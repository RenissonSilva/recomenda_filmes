import 'server-only';

import { cacheLife } from 'next/cache';

import { toTmdbGenreIds, type CanonicalGenre } from '@/domain/genres';
import {
  ANIME_CRITERIA,
  getMediaKey,
  matchesFilter,
  type MediaCategory,
  type MediaDetails,
  type MediaFilter,
  type MediaSummary,
  type MediaType,
} from '@/domain/media';
import type { Paginated } from '@/domain/pagination';
import { interleave, uniqueBy } from '@/lib/array';

import { TmdbRequestError } from '../errors';
import { tmdbGet, type TmdbQuery } from './client';
import { TMDB_MAX_PAGE, TMDB_VIDEO_LANGUAGES } from './config';
import {
  mapCreatorWorks,
  mapListItem,
  mapMovieDetails,
  mapMultiSearchItems,
  mapTvDetails,
} from './mappers';
import type {
  TmdbCombinedCredits,
  TmdbListItem,
  TmdbMovieDetails,
  TmdbMultiSearchItem,
  TmdbPaginated,
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
 * Títulos mais votados do TMDB — os mais prováveis de o usuário já ter assistido.
 * Em "Filmes" e "Séries" os animes são removidos (eles têm a própria seção), por isso
 * algumas páginas podem vir com menos itens.
 */
export async function discoverPopularTitles(
  filter: MediaFilter,
  page: number,
): Promise<Paginated<MediaSummary>> {
  'use cache';
  cacheLife('days');

  const pages = await Promise.all(
    DISCOVER_SOURCES[filter].map((source) =>
      discoverPage(source, { sort_by: 'vote_count.desc', page }),
    ),
  );

  return {
    page,
    totalPages: Math.min(...pages.map((result) => result.totalPages)),
    items: interleave(...pages.map((result) => result.items)).filter((media) =>
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

/** Filmes dirigidos e séries criadas pela pessoa, dos mais aos menos votados. */
export async function getCreatorWorks(personId: number): Promise<MediaSummary[]> {
  'use cache';
  cacheLife('weeks');

  return mapCreatorWorks(
    await tmdbGet<TmdbCombinedCredits>(`/person/${personId}/combined_credits`),
  );
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
