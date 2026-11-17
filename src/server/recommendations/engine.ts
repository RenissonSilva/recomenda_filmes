import 'server-only';

import { CANONICAL_GENRE_LABELS, toCanonicalGenres, type CanonicalGenre } from '@/domain/genres';
import {
  getMediaCategory,
  getMediaKey,
  matchesFilter,
  MEDIA_CATEGORIES,
  toMediaSummary,
  type MediaKey,
  type MediaSummary,
} from '@/domain/media';
import { RATING_SCORES } from '@/domain/rating';
import type {
  RatedTitleInput,
  Recommendation,
  RecommendationRequest,
} from '@/domain/recommendation';
import { mapWithConcurrency } from '@/lib/async';

import { TmdbRequestError } from '../errors';
import { withTmdbFallback } from '../tmdb/fallback';
import { collectCandidates, creatorLinks, recommendationLinks } from './candidates';
import { RECOMMENDER_CONFIG } from './config';
import { contentSimilarity, extractFeatures, featureKeys, vectorize } from './features';
import { finalScore, predictMatch, toMatchPercent } from './scoring';
import type { Candidate, FeatureLevel, RecommenderCatalog, ScoredCandidate, Seed } from './types';
import { computeIdf } from './vector';

/**
 * Gera recomendações personalizadas a partir das avaliações do usuário.
 *
 * 1. Carrega os detalhes dos títulos avaliados (sementes).
 * 2. Reúne candidatos: o que o TMDB recomenda a partir de cada semente, as outras obras
 *    dos diretores/criadores favoritos e os mais bem avaliados dos gêneros favoritos.
 * 3. Etapa 1: pré-seleção barata (gênero, idioma, época e vínculos diretos).
 * 4. Etapa 2: carrega os detalhes dos melhores candidatos e reordena usando também
 *    palavras-chave, direção e elenco.
 * 5. Converte a compatibilidade em % e explica o porquê.
 */
export async function generateRecommendations(
  request: RecommendationRequest,
  catalog: RecommenderCatalog,
): Promise<Recommendation[]> {
  const { concurrency, detailedCandidatesPerCategory, defaultLimit, minVoteCount, minMatch } =
    RECOMMENDER_CONFIG;

  const seeds = await loadSeeds(request.ratings, catalog);
  if (!seeds.some((seed) => seed.score > 0)) return [];

  const ratedKeys = new Set(request.ratings.map(getMediaKey));
  const excludedKeys = new Set(request.excludeKeys);

  // O filtro de seção só é aplicado no final: assim o cálculo (e a % de cada título)
  // é o mesmo em "Tudo", "Filmes", "Séries" e "Animes".
  const isEligible = (media: MediaSummary, key: MediaKey) =>
    !ratedKeys.has(key) && !excludedKeys.has(key) && media.voteCount >= minVoteCount;

  const favoriteGenres = rankByAffinity(seeds, (seed) => toCanonicalGenres(seed.media.genreIds));
  const favoriteCreators = rankByAffinity(seeds, (seed) =>
    seed.media.creators.map((person) => person.id),
  );

  const [worksByCreator, topRatedByGenre] = await Promise.all([
    loadCreatorWorks(favoriteCreators, catalog),
    discoverTopRatedByGenres(favoriteGenres, catalog),
  ]);

  const candidates = collectCandidates({
    links: [...recommendationLinks(seeds), ...creatorLinks(seeds, worksByCreator)],
    extra: topRatedByGenre,
    isEligible,
  });

  // Etapa 1 → os melhores de cada seção seguem para a etapa 2
  // (cota igual para filmes, séries e animes, para nenhuma aba ficar vazia).
  const preliminary = scoreCandidates(candidates, seeds, 'basic');
  const shortlist = MEDIA_CATEGORIES.flatMap((category) =>
    preliminary
      .filter((candidate) => getMediaCategory(candidate.media) === category)
      .slice(0, detailedCandidatesPerCategory),
  );

  const detailed = await mapWithConcurrency(shortlist, concurrency, async (candidate) => ({
    ...candidate,
    media:
      (await withTmdbFallback(
        () => catalog.getTitleDetails(candidate.media.mediaType, candidate.media.id),
        null,
      )) ?? candidate.media,
  }));

  return scoreCandidates(detailed, seeds, 'full')
    .filter(
      (candidate) => candidate.match >= minMatch && matchesFilter(candidate.media, request.filter),
    )
    .slice(0, request.limit ?? defaultLimit)
    .map((candidate) => toRecommendation(candidate, favoriteGenres));
}

/** Usa as notas mais fortes (Ótimo/Odeio) primeiro; em empate, as mais recentes. */
function selectSeedRatings(ratings: readonly RatedTitleInput[]): RatedTitleInput[] {
  return [...ratings]
    .sort((a, b) => Math.abs(RATING_SCORES[b.value]) - Math.abs(RATING_SCORES[a.value]))
    .slice(0, RECOMMENDER_CONFIG.maxSeeds);
}

async function loadSeeds(
  ratings: readonly RatedTitleInput[],
  catalog: RecommenderCatalog,
): Promise<Seed[]> {
  let firstError: unknown = null;

  const results = await mapWithConcurrency(
    selectSeedRatings(ratings),
    RECOMMENDER_CONFIG.concurrency,
    async (rating): Promise<Seed | null> => {
      try {
        const media = await catalog.getTitleDetails(rating.mediaType, rating.id);
        return media
          ? { key: getMediaKey(rating), media, score: RATING_SCORES[rating.value] }
          : null;
      } catch (error) {
        if (!(error instanceof TmdbRequestError)) throw error;
        firstError ??= error;
        return null;
      }
    },
  );

  const seeds = results.filter((seed): seed is Seed => seed !== null);
  // Falhas pontuais são toleradas; se nenhuma semente carregou, o erro é real.
  if (seeds.length === 0 && firstError) throw firstError;
  return seeds;
}

/**
 * Ordena características (gêneros, pessoas…) pela afinidade do usuário: a soma das notas
 * dos títulos avaliados que as têm. Só entram as de saldo positivo.
 */
function rankByAffinity<K>(seeds: readonly Seed[], keysOf: (seed: Seed) => readonly K[]): K[] {
  const affinity = new Map<K, number>();
  for (const seed of seeds) {
    for (const key of new Set(keysOf(seed))) {
      affinity.set(key, (affinity.get(key) ?? 0) + seed.score);
    }
  }

  return [...affinity]
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key);
}

/** Obras (filmes dirigidos e séries criadas) dos diretores/criadores favoritos, por pessoa. */
async function loadCreatorWorks(
  favoriteCreators: readonly number[],
  catalog: RecommenderCatalog,
): Promise<Map<number, MediaSummary[]>> {
  const { discoverCreators, maxWorksPerCreator } = RECOMMENDER_CONFIG;

  const entries = await Promise.all(
    favoriteCreators.slice(0, discoverCreators).map(async (personId) => {
      const works = await withTmdbFallback(() => catalog.getCreatorWorks(personId), []);
      return [personId, works.slice(0, maxWorksPerCreator)] as const;
    }),
  );
  return new Map(entries);
}

/** Os títulos mais bem avaliados que combinam os gêneros favoritos, em cada seção. */
async function discoverTopRatedByGenres(
  favoriteGenres: readonly CanonicalGenre[],
  catalog: RecommenderCatalog,
): Promise<MediaSummary[]> {
  // A ordem não muda o resultado (o título precisa ter todos): ordenar aproveita melhor o cache.
  const genres = favoriteGenres.slice(0, RECOMMENDER_CONFIG.discoverGenres).sort();
  if (genres.length === 0) return [];

  const lists = await Promise.all(
    MEDIA_CATEGORIES.map((category) =>
      withTmdbFallback(() => catalog.discoverTopRatedByGenres(category, genres), []),
    ),
  );
  return lists.flat();
}

function scoreCandidates(
  candidates: readonly Candidate[],
  seeds: readonly Seed[],
  level: FeatureLevel,
): ScoredCandidate[] {
  const seedFeatures = seeds.map((seed) => ({
    seed,
    features: extractFeatures(seed.media, level),
  }));
  const candidateFeatures = candidates.map((candidate) => ({
    candidate,
    features: extractFeatures(candidate.media, level),
  }));

  const idf = computeIdf(
    [...seedFeatures, ...candidateFeatures].map(({ features }) => featureKeys(features)),
  );
  const references = seedFeatures.map(({ seed, features }) => ({
    seed,
    vectors: vectorize(features, idf),
  }));

  return candidateFeatures
    .map(({ candidate, features }) => {
      const vectors = vectorize(features, idf);
      const { match, neighbors } = predictMatch(
        references.map((reference) => ({
          seed: reference.seed,
          similarity: Math.min(
            1,
            contentSimilarity(vectors, reference.vectors, level) +
              (candidate.linkBoosts.get(reference.seed.key) ?? 0),
          ),
        })),
      );

      return { ...candidate, match, neighbors, score: finalScore(match, candidate.media) };
    })
    .sort((a, b) => b.score - a.score);
}

function toRecommendation(
  candidate: ScoredCandidate,
  favoriteGenres: readonly CanonicalGenre[],
): Recommendation {
  const { maxReasons, minReasonSimilarity, maxMatchedGenres } = RECOMMENDER_CONFIG;

  const becauseOf = candidate.neighbors
    .filter(({ seed, similarity }) => seed.score > 0 && similarity >= minReasonSimilarity)
    .sort((a, b) => b.similarity * b.seed.score - a.similarity * a.seed.score)
    .slice(0, maxReasons)
    .map(({ seed }) => ({ key: seed.key, title: seed.media.title }));

  const candidateGenres = new Set(toCanonicalGenres(candidate.media.genreIds));
  const matchedGenres = favoriteGenres
    .filter((genre) => candidateGenres.has(genre))
    .slice(0, maxMatchedGenres)
    .map((genre) => CANONICAL_GENRE_LABELS[genre]);

  return {
    media: toMediaSummary(candidate.media),
    matchPercent: toMatchPercent(candidate.score),
    becauseOf,
    matchedGenres,
  };
}
