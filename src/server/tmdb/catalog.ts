import 'server-only';

import { cacheLife } from 'next/cache';

import { toTmdbGenreIds, type CanonicalGenre } from '@/domain/genres';
import {
  ANIME_CRITERIA,
  getMediaKey,
  matchesFilter,
  MEDIA_TYPES,
  type Keyword,
  type MediaCategory,
  type MediaDetails,
  type MediaFilter,
  type MediaSummary,
  type MediaType,
  type Person,
} from '@/domain/media';
import type { Paginated } from '@/domain/pagination';
import { getWorksByRoles, hasLatinScript, type PersonDetails } from '@/domain/person';
import type { DiscoverSort } from '@/domain/title-sort';
import { interleave, uniqueBy } from '@/lib/array';
import { getTodayIsoDate } from '@/lib/format';

import { TmdbRequestError } from '../errors';
import { tmdbGet, type TmdbQuery } from './client';
import { TMDB_LATIN_NAME_LANGUAGE, TMDB_MAX_PAGE, TMDB_VIDEO_LANGUAGES } from './config';
import {
  mapAggregateOriginalAuthors,
  mapKeywords,
  mapListItem,
  mapMovieDetails,
  mapMultiSearchItems,
  mapPersonDetails,
  mapTvDetails,
} from './mappers';
import type {
  TmdbAggregateCredits,
  TmdbKeywordsResponse,
  TmdbListItem,
  TmdbMovieDetails,
  TmdbMultiSearchItem,
  TmdbPaginated,
  TmdbPersonDetails,
  TmdbTvDetails,
} from './types';

/**
 * Catálogo de títulos — a única porta de entrada do app para o TMDB.
 * Cada função usa `'use cache'`: chamadas repetidas com os mesmos argumentos
 * são servidas do cache do Next.js, sem nova requisição ao TMDB.
 */

const DETAILS_APPEND = 'credits,keywords,videos,watch/providers,recommendations';

/**
 * Uma consulta ao `/discover` do TMDB. Os animes não têm endpoint próprio: são filmes e séries
 * com o gênero Animação e o idioma original japonês.
 */
interface DiscoverSource {
  mediaType: MediaType;
  requiredGenre?: CanonicalGenre;
  originalLanguage?: string;
}

const ANIME_SOURCE = {
  requiredGenre: ANIME_CRITERIA.genre,
  originalLanguage: ANIME_CRITERIA.originalLanguage,
} as const;

/** De onde vêm os títulos de cada seção (séries de anime primeiro: são a maior parte). */
const DISCOVER_SOURCES: Record<MediaFilter, readonly DiscoverSource[]> = {
  all: [{ mediaType: 'movie' }, { mediaType: 'tv' }],
  movie: [{ mediaType: 'movie' }],
  tv: [{ mediaType: 'tv' }],
  anime: [
    { mediaType: 'tv', ...ANIME_SOURCE },
    { mediaType: 'movie', ...ANIME_SOURCE },
  ],
};

/** Mínimo de votos para um título entrar entre os "mais bem avaliados" de um gênero. */
const TOP_RATED_MIN_VOTES: Record<MediaType, number> = { movie: 1000, tv: 300 };

/**
 * Mínimo de votos nas ordenações por nota e por data. Sem ele, a lista começa com títulos
 * obscuros (nota 10 com dois votos, lançamentos sem pôster nem sinopse).
 */
const DISCOVER_MIN_VOTES: Record<Exclude<DiscoverSort, 'popularity'>, Record<MediaType, number>> = {
  rating: { movie: 300, tv: 150 },
  recent: { movie: 50, tv: 20 },
};

/** Parâmetros do `/discover` para cada ordenação. */
function sortQuery(sort: DiscoverSort, mediaType: MediaType): TmdbQuery {
  switch (sort) {
    // Total de votos: os mais assistidos, e não os que estão em alta hoje.
    case 'popularity':
      return { sort_by: 'vote_count.desc' };
    case 'rating':
      return {
        sort_by: 'vote_average.desc',
        'vote_count.gte': DISCOVER_MIN_VOTES.rating[mediaType],
      };
    case 'recent': {
      // Só o que já estreou: o TMDB também cadastra lançamentos futuros.
      const dateField = mediaType === 'movie' ? 'primary_release_date' : 'first_air_date';
      return {
        sort_by: `${dateField}.desc`,
        [`${dateField}.lte`]: getTodayIsoDate(),
        'vote_count.gte': DISCOVER_MIN_VOTES.recent[mediaType],
      };
    }
  }
}

export interface DiscoverOptions {
  /** Só títulos deste gênero. */
  genre?: CanonicalGenre;
  sort?: DiscoverSort;
}

/**
 * Títulos da seção, por padrão os mais votados do TMDB (os mais prováveis de o usuário já ter
 * assistido). Em "Filmes" e "Séries" os animes são removidos (eles têm a própria seção), por isso
 * algumas páginas podem vir com menos itens. Com `genre`, as fontes que não têm o gênero
 * (ex.: "Terror" em séries) são ignoradas.
 */
export async function discoverTitles(
  filter: MediaFilter,
  page: number,
  { genre, sort = 'popularity' }: DiscoverOptions = {},
): Promise<Paginated<MediaSummary>> {
  'use cache';
  cacheLife('days');

  const pages = await Promise.all(
    DISCOVER_SOURCES[filter].map((source) => {
      // Cada gênero canônico corresponde a no máximo um ID por tipo (ver `genres.test.ts`).
      const genreIds = genre ? toTmdbGenreIds(genre, source.mediaType) : [];
      if (genre && genreIds.length === 0) return null;

      return discoverPage(source, { ...sortQuery(sort, source.mediaType), page }, genreIds);
    }),
  );
  const results = pages.filter((result) => result !== null);

  return {
    page,
    // Uma fonte que acabou antes devolve páginas vazias; as outras continuam.
    totalPages: Math.max(0, ...results.map((result) => result.totalPages)),
    items: interleave(...results.map((result) => result.items)).filter((media) =>
      matchesFilter(media, filter),
    ),
  };
}

export async function searchTitles(
  query: string,
  filter: MediaFilter,
  page: number,
): Promise<Paginated<MediaSummary>> {
  'use cache';
  cacheLife('hours');

  const params = { query, include_adult: false, page };

  // Animes podem ser filmes ou séries: a busca usa o endpoint "multi" e filtra depois.
  if (filter === 'all' || filter === 'anime') {
    const data = await tmdbGet<TmdbPaginated<TmdbMultiSearchItem>>('/search/multi', params);
    return toPaginated(
      data,
      prioritizeWithPoster(
        mapMultiSearchItems(data.results).filter((media) => matchesFilter(media, filter)),
      ),
    );
  }

  const data = await tmdbGet<TmdbPaginated<TmdbListItem>>(`/search/${filter}`, params);
  return toPaginated(
    data,
    prioritizeWithPoster(
      data.results
        .map((item) => mapListItem(filter, item))
        .filter((media) => matchesFilter(media, filter)),
    ),
  );
}

/** Detalhes completos de um título, ou `null` se ele não existir no TMDB. */
export async function getTitleDetails(
  mediaType: MediaType,
  id: number,
): Promise<MediaDetails | null> {
  'use cache';
  cacheLife('days');

  const params = {
    append_to_response: DETAILS_APPEND,
    include_video_language: TMDB_VIDEO_LANGUAGES,
  };

  try {
    return mediaType === 'movie'
      ? mapMovieDetails(await tmdbGet<TmdbMovieDetails>(`/movie/${id}`, params))
      : mapTvDetails(await tmdbGet<TmdbTvDetails>(`/tv/${id}`, params));
  } catch (error) {
    if (error instanceof TmdbRequestError && error.isNotFound) return null;
    throw error;
  }
}

/**
 * Títulos bem avaliados da seção que combinam TODOS os gêneros informados.
 * Fontes em que nenhum dos gêneros existe (ex.: "Novela" em filmes) são ignoradas.
 */
export async function discoverTopRatedByGenres(
  category: MediaCategory,
  genres: readonly CanonicalGenre[],
): Promise<MediaSummary[]> {
  'use cache';
  cacheLife('days');

  const lists = await Promise.all(
    DISCOVER_SOURCES[category].map(async (source) => {
      const genreIds = genres.flatMap((genre) => toTmdbGenreIds(genre, source.mediaType));
      if (genreIds.length === 0) return [];

      const { items } = await discoverPage(
        source,
        {
          sort_by: 'vote_average.desc',
          'vote_count.gte': TOP_RATED_MIN_VOTES[source.mediaType],
          page: 1,
        },
        genreIds,
      );
      return items;
    }),
  );
  return interleave(...lists);
}

/**
 * Dados e filmografia de uma pessoa, ou `null` se ela não existir no TMDB.
 * Nomes que vêm em outro alfabeto (ex.: japonês) são trocados pela versão latina.
 */
export async function getPersonDetails(personId: number): Promise<PersonDetails | null> {
  'use cache';
  cacheLife('weeks');

  let person: PersonDetails;
  try {
    person = mapPersonDetails(
      await tmdbGet<TmdbPersonDetails>(`/person/${personId}`, {
        append_to_response: 'combined_credits',
      }),
    );
  } catch (error) {
    if (error instanceof TmdbRequestError && error.isNotFound) return null;
    throw error;
  }

  if (hasLatinScript(person.name)) return person;
  const latinName = await getLatinPersonName(personId);
  return latinName ? { ...person, name: latinName, originalName: person.name } : person;
}

/** Filmes dirigidos e séries criadas pela pessoa, dos mais aos menos votados. */
export async function getCreatorWorks(personId: number): Promise<MediaSummary[]> {
  const person = await getPersonDetails(personId);
  return person ? getWorksByRoles(person.credits, ['direction', 'creation']) : [];
}

/**
 * Autores da obra original de uma série considerando todas as temporadas. Os créditos comuns
 * trazem só a equipe da temporada mais recente, e às vezes o autor do mangá fica de fora
 * (ex.: One Piece).
 */
export async function getTvOriginalAuthors(tvId: number): Promise<Person[]> {
  'use cache';
  cacheLife('weeks');

  return mapAggregateOriginalAuthors(
    await tmdbGet<TmdbAggregateCredits>(`/tv/${tvId}/aggregate_credits`),
  );
}

/** Palavras-chave (temas da trama) de um título, sem carregar os detalhes completos. */
export async function getTitleKeywords(mediaType: MediaType, id: number): Promise<Keyword[]> {
  'use cache';
  cacheLife('weeks');

  return mapKeywords(await tmdbGet<TmdbKeywordsResponse>(`/${mediaType}/${id}/keywords`));
}

/**
 * Em quantos títulos (filmes + séries) a palavra-chave aparece. Mede o quanto ela é específica:
 * "buraco de minhoca" diz mais sobre a trama do que "amizade".
 */
export async function getKeywordFrequency(keywordId: number): Promise<number> {
  'use cache';
  cacheLife('weeks');

  const pages = await Promise.all(
    MEDIA_TYPES.map((mediaType) =>
      tmdbGet<TmdbPaginated<TmdbListItem>>(`/discover/${mediaType}`, {
        with_keywords: keywordId,
        include_adult: false,
      }),
    ),
  );
  return pages.reduce((total, page) => total + page.total_results, 0);
}

/** Títulos mais votados da seção que têm PELO MENOS UMA das palavras-chave informadas. */
export async function discoverByKeywords(
  category: MediaCategory,
  keywordIds: readonly number[],
): Promise<MediaSummary[]> {
  'use cache';
  cacheLife('days');

  if (keywordIds.length === 0) return [];

  const lists = await Promise.all(
    DISCOVER_SOURCES[category].map(async (source) => {
      const { items } = await discoverPage(source, {
        sort_by: 'vote_count.desc',
        // Barra vertical = basta ter uma das palavras-chave.
        with_keywords: sortedUnique(keywordIds).join('|'),
        page: 1,
      });
      return items;
    }),
  );
  return interleave(...lists).filter((media) => matchesFilter(media, category));
}

async function getLatinPersonName(personId: number): Promise<string | null> {
  'use cache';
  cacheLife('weeks');

  const { name } = await tmdbGet<Pick<TmdbPersonDetails, 'name'>>(`/person/${personId}`, {
    language: TMDB_LATIN_NAME_LANGUAGE,
  });
  return hasLatinScript(name) ? name : null;
}

/** Uma página do `/discover`; `extraGenreIds` são exigidos além do gênero da própria fonte. */
async function discoverPage(
  source: DiscoverSource,
  query: TmdbQuery & { page: number },
  extraGenreIds: readonly number[] = [],
): Promise<Paginated<MediaSummary>> {
  const genreIds = [
    ...(source.requiredGenre ? toTmdbGenreIds(source.requiredGenre, source.mediaType) : []),
    ...extraGenreIds,
  ];

  const data = await tmdbGet<TmdbPaginated<TmdbListItem>>(`/discover/${source.mediaType}`, {
    ...query,
    // Vírgula = o título precisa ter TODOS os gêneros.
    with_genres: genreIds.length > 0 ? sortedUnique(genreIds).join(',') : undefined,
    with_original_language: source.originalLanguage,
    include_adult: false,
  });
  return toPaginated(
    data,
    data.results.map((item) => mapListItem(source.mediaType, item)),
  );
}

function sortedUnique(ids: readonly number[]): number[] {
  return [...new Set(ids)].sort((a, b) => a - b);
}

function toPaginated<T>(data: TmdbPaginated<unknown>, items: T[]): Paginated<T> {
  return {
    page: data.page,
    totalPages: Math.min(data.total_pages, TMDB_MAX_PAGE),
    items,
  };
}

/** Na busca, resultados sem pôster (geralmente obscuros) vão para o final. */
function prioritizeWithPoster(items: readonly MediaSummary[]): MediaSummary[] {
  const unique = uniqueBy(items, getMediaKey);
  return [
    ...unique.filter((item) => item.posterPath),
    ...unique.filter((item) => !item.posterPath),
  ];
}
