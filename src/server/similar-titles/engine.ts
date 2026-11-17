import 'server-only';

import { toCanonicalGenres, type CanonicalGenre } from '@/domain/genres';
import {
  getMediaCategory,
  getMediaKey,
  MEDIA_CATEGORIES,
  type Keyword,
  type MediaCategory,
  type MediaDetails,
  type MediaKey,
  type MediaSummary,
  type MediaType,
} from '@/domain/media';
import { uniqueBy } from '@/lib/array';
import { mapWithConcurrency } from '@/lib/async';

import {
  contentSimilarity,
  extractContentFeatures,
  keywordFeatureKey,
  vectorize,
  type TitleFeatures,
} from '../recommendations/features';
import { computeIdf, type IdfTable } from '../recommendations/vector';
import { withTmdbFallback } from '../tmdb/fallback';
import { SIMILAR_TITLES_CONFIG } from './config';

/** Dependências externas (implementadas pelo catálogo do TMDB). */
export interface SimilarTitlesCatalog {
  /** Em quantos títulos do TMDB a palavra-chave aparece. */
  getKeywordFrequency(keywordId: number): Promise<number>;
  getTitleKeywords(mediaType: MediaType, id: number): Promise<Keyword[]>;
  /** Títulos mais votados da seção com pelo menos uma das palavras-chave. */
  discoverByKeywords(
    category: MediaCategory,
    keywordIds: readonly number[],
  ): Promise<MediaSummary[]>;
  /** Títulos bem avaliados da seção que têm todos os gêneros informados. */
  discoverTopRatedByGenres(
    category: MediaCategory,
    genres: readonly CanonicalGenre[],
  ): Promise<MediaSummary[]>;
}

interface Candidates {
  items: MediaSummary[];
  /** Candidatos com vínculo direto: palavra-chave específica em comum ou recomendação do TMDB. */
  linked: ReadonlySet<MediaKey>;
}

/**
 * Títulos parecidos com `title` pelo conteúdo — enredo e gênero —, de todas as seções.
 *
 * 1. Mede o quanto cada palavra-chave da trama é específica: em quantos títulos ela aparece.
 * 2. Reúne candidatos de filmes, séries e animes: os mais votados com as palavras-chave mais
 *    específicas, os mais bem avaliados dos mesmos gêneros e as recomendações do TMDB.
 * 3. Etapa 1: pré-seleção barata, por gênero, com bônus para os candidatos com vínculo direto.
 * 4. Etapa 2: carrega as palavras-chave dos pré-selecionados e compara gêneros e palavras-chave
 *    (similaridade do cosseno com pesos TF-IDF: palavras-chave raras pesam mais).
 *
 * Devolve até `maxPerCategory` títulos de cada seção, do mais para o menos parecido.
 */
export async function findSimilarTitles(
  title: MediaDetails,
  catalog: SimilarTitlesCatalog,
): Promise<MediaSummary[]> {
  const { concurrency, maxKeywords, minVoteCount, weights, minSimilarity } = SIMILAR_TITLES_CONFIG;

  const keywords = title.keywords.slice(0, maxKeywords);
  const frequencies = await loadKeywordFrequencies(keywords, catalog);
  const candidates = await collectCandidates(
    title,
    selectSearchKeywords(keywords, frequencies),
    catalog,
  );

  const titleKey = getMediaKey(title);
  const eligible = candidates.items.filter(
    (media) => getMediaKey(media) !== titleKey && media.voteCount >= minVoteCount,
  );
  const titleFeatures = extractContentFeatures(title, keywords);

  // Etapa 1: pré-seleção só por gênero (as palavras-chave dos candidatos ainda não foram carregadas).
  const shortlist = preselect(eligible, candidates.linked, titleFeatures, frequencies);

  // Etapa 2: compara também as palavras-chave da trama.
  const detailed = await mapWithConcurrency(shortlist, concurrency, async (media) => ({
    media,
    features: extractContentFeatures(
      media,
      await withTmdbFallback(() => catalog.getTitleKeywords(media.mediaType, media.id), []),
    ),
  }));

  const idf = buildIdf([titleFeatures, ...detailed.map((entry) => entry.features)], frequencies);
  const reference = vectorize(titleFeatures, idf);

  const ranked = detailed
    .map(({ media, features }) => ({
      media,
      similarity: contentSimilarity(vectorize(features, idf), reference, 'full', weights),
    }))
    .filter((candidate) => candidate.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity)
    .map((candidate) => candidate.media);

  return limitPerCategory(ranked, SIMILAR_TITLES_CONFIG.maxPerCategory);
}

/** Frequência de cada palavra-chave no TMDB. As que falharem ficam de fora do mapa. */
async function loadKeywordFrequencies(
  keywords: readonly Keyword[],
  catalog: SimilarTitlesCatalog,
): Promise<Map<number, number>> {
  const entries = await mapWithConcurrency(
    keywords,
    SIMILAR_TITLES_CONFIG.concurrency,
    async (keyword) =>
      [
        keyword.id,
        await withTmdbFallback(() => catalog.getKeywordFrequency(keyword.id), null),
      ] as const,
  );
  return new Map(entries.filter((entry): entry is readonly [number, number] => entry[1] !== null));
}

/**
 * As palavras-chave mais específicas (menos frequentes), em ordem de ID para aproveitar o cache.
 * Frequência 1 significa que só o próprio título a tem: não serve para encontrar outros.
 */
function selectSearchKeywords(
  keywords: readonly Keyword[],
  frequencies: ReadonlyMap<number, number>,
): number[] {
  const frequencyOf = (keyword: Keyword) => frequencies.get(keyword.id) ?? 0;
  return keywords
    .filter((keyword) => frequencyOf(keyword) > 1)
    .sort((a, b) => frequencyOf(a) - frequencyOf(b))
    .slice(0, SIMILAR_TITLES_CONFIG.searchKeywords)
    .map((keyword) => keyword.id)
    .sort((a, b) => a - b);
}

async function collectCandidates(
  title: MediaDetails,
  searchKeywordIds: readonly number[],
  catalog: SimilarTitlesCatalog,
): Promise<Candidates> {
  // A ordem não muda o resultado (o título precisa ter todos): ordenar aproveita melhor o cache.
  const genres = toCanonicalGenres(title.genreIds)
    .slice(0, SIMILAR_TITLES_CONFIG.searchGenres)
    .sort();

  const [byKeywords, byGenres] = await Promise.all([
    Promise.all(
      MEDIA_CATEGORIES.map(async (category) =>
        searchKeywordIds.length === 0
          ? []
          : withTmdbFallback(() => catalog.discoverByKeywords(category, searchKeywordIds), []),
      ),
    ),
    Promise.all(
      MEDIA_CATEGORIES.map(async (category) =>
        genres.length === 0
          ? []
          : withTmdbFallback(() => catalog.discoverTopRatedByGenres(category, genres), []),
      ),
    ),
  ]);

  const linked = [...title.recommendations, ...byKeywords.flat()];
  return {
    items: uniqueBy([...linked, ...byGenres.flat()], getMediaKey),
    linked: new Set(linked.map(getMediaKey)),
  };
}

/** Etapa 1: os melhores candidatos de cada seção, comparando só gênero, idioma e época. */
function preselect(
  candidates: readonly MediaSummary[],
  linked: ReadonlySet<MediaKey>,
  titleFeatures: TitleFeatures,
  frequencies: ReadonlyMap<number, number>,
): MediaSummary[] {
  const { shortlistPerCategory, shortlistLinkBonus } = SIMILAR_TITLES_CONFIG;

  const entries = candidates.map((media) => ({
    media,
    features: extractContentFeatures(media, []),
  }));
  const idf = buildIdf([titleFeatures, ...entries.map((entry) => entry.features)], frequencies);
  const reference = vectorize(titleFeatures, idf);

  const scored = entries
    .map(({ media, features }) => ({
      media,
      score:
        contentSimilarity(vectorize(features, idf), reference, 'basic') +
        (linked.has(getMediaKey(media)) ? shortlistLinkBonus : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .map((candidate) => candidate.media);

  return limitPerCategory(scored, shortlistPerCategory);
}

/**
 * Gêneros pesam pela frequência no próprio conjunto (são poucos e se repetem muito);
 * palavras-chave, pela raridade no TMDB inteiro.
 */
function buildIdf(
  features: readonly TitleFeatures[],
  frequencies: ReadonlyMap<number, number>,
): IdfTable {
  const { catalogSize, defaultKeywordFrequency } = SIMILAR_TITLES_CONFIG;
  const idf = new Map(computeIdf(features.map((feature) => [...feature.genres.keys()])));

  const frequencyByKey = new Map(
    [...frequencies].map(([keywordId, frequency]) => [keywordFeatureKey(keywordId), frequency]),
  );
  for (const feature of features) {
    for (const key of feature.keywords.keys()) {
      const frequency = frequencyByKey.get(key) ?? defaultKeywordFrequency;
      idf.set(key, Math.log((catalogSize + 1) / (frequency + 1)) + 1);
    }
  }
  return idf;
}

/** Mantém a ordem, com no máximo `limit` títulos de cada seção. */
function limitPerCategory(items: readonly MediaSummary[], limit: number): MediaSummary[] {
  const counts = new Map<MediaCategory, number>();
  return items.filter((media) => {
    const category = getMediaCategory(media);
    const count = counts.get(category) ?? 0;
    counts.set(category, count + 1);
    return count < limit;
  });
}
