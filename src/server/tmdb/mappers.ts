import type {
  MediaDetails,
  MediaSummary,
  MediaType,
  Person,
  WatchProvider,
  WatchProviders,
} from '@/domain/media';
import { uniqueBy } from '@/lib/array';

import { MAX_CAST_MEMBERS, MAX_KEYWORDS, TMDB_REGION } from './config';
import type {
  TmdbCastMember,
  TmdbCombinedCredits,
  TmdbCrewMember,
  TmdbListItem,
  TmdbMovieDetails,
  TmdbMovieListItem,
  TmdbMultiSearchItem,
  TmdbTvDetails,
  TmdbTvListItem,
  TmdbVideo,
  TmdbWatchProvider,
  TmdbWatchProviderRegion,
} from './types';

const UNTITLED = 'Sem título';

export function parseReleaseYear(date: string | null | undefined): number | null {
  if (!date) return null;
  const year = Number.parseInt(date.slice(0, 4), 10);
  return Number.isFinite(year) ? year : null;
}

export function mapMovieListItem(item: TmdbMovieListItem): MediaSummary {
  const title = item.title || item.original_title || UNTITLED;
  return {
    id: item.id,
    mediaType: 'movie',
    title,
    originalTitle: item.original_title || title,
    posterPath: item.poster_path ?? null,
    backdropPath: item.backdrop_path ?? null,
    releaseYear: parseReleaseYear(item.release_date),
    genreIds: item.genre_ids ?? [],
    originalLanguage: item.original_language ?? '',
    voteAverage: item.vote_average ?? 0,
    voteCount: item.vote_count ?? 0,
    popularity: item.popularity ?? 0,
  };
}

export function mapTvListItem(item: TmdbTvListItem): MediaSummary {
  const title = item.name || item.original_name || UNTITLED;
  return {
    id: item.id,
    mediaType: 'tv',
    title,
    originalTitle: item.original_name || title,
    posterPath: item.poster_path ?? null,
    backdropPath: item.backdrop_path ?? null,
    releaseYear: parseReleaseYear(item.first_air_date),
    genreIds: item.genre_ids ?? [],
    originalLanguage: item.original_language ?? '',
    voteAverage: item.vote_average ?? 0,
    voteCount: item.vote_count ?? 0,
    popularity: item.popularity ?? 0,
  };
}

/** Para endpoints específicos de um tipo (ex.: `/discover/tv`), o tipo vem da própria rota. */
export function mapListItem(mediaType: MediaType, item: TmdbListItem): MediaSummary {
  return mediaType === 'movie'
    ? mapMovieListItem(item as TmdbMovieListItem)
    : mapTvListItem(item as TmdbTvListItem);
}

/** A busca "multi" também devolve pessoas — elas são descartadas. */
export function mapMultiSearchItems(items: readonly TmdbMultiSearchItem[]): MediaSummary[] {
  return items.flatMap((item) => {
    if (item.media_type === 'movie') return [mapMovieListItem(item)];
    if (item.media_type === 'tv') return [mapTvListItem(item)];
    return [];
  });
}

/**
 * Obras autorais de uma pessoa: filmes que ela dirigiu e séries que criou
 * (créditos de produção e roteiro ficam de fora), das mais às menos votadas.
 */
export function mapCreatorWorks(credits: TmdbCombinedCredits): MediaSummary[] {
  const works = (credits.crew ?? []).flatMap((credit) => {
    if (credit.media_type === 'movie' && credit.job === 'Director')
      return [mapMovieListItem(credit)];
    if (credit.media_type === 'tv' && credit.job === 'Creator') return [mapTvListItem(credit)];
    return [];
  });

  return uniqueBy(works, (media) => `${media.mediaType}:${media.id}`).sort(
    (a, b) => b.voteCount - a.voteCount,
  );
}

export function mapMovieDetails(raw: TmdbMovieDetails): MediaDetails {
  const genres = raw.genres ?? [];
  return {
    ...mapMovieListItem({ ...raw, genre_ids: genres.map((genre) => genre.id) }),
    overview: raw.overview ?? '',
    tagline: raw.tagline || null,
    genres,
    runtimeMinutes: raw.runtime || null,
    seasonCount: null,
    keywords: (raw.keywords?.keywords ?? []).slice(0, MAX_KEYWORDS),
    cast: mapCast(raw.credits?.cast),
    creators: mapDirectors(raw.credits?.crew),
    trailerYoutubeKey: pickTrailerKey(raw.videos?.results),
    watchProviders: mapWatchProviders(raw['watch/providers']?.results?.[TMDB_REGION]),
    recommendations: (raw.recommendations?.results ?? []).map(mapMovieListItem),
  };
}

export function mapTvDetails(raw: TmdbTvDetails): MediaDetails {
  const genres = raw.genres ?? [];
  return {
    ...mapTvListItem({ ...raw, genre_ids: genres.map((genre) => genre.id) }),
    overview: raw.overview ?? '',
    tagline: raw.tagline || null,
    genres,
    runtimeMinutes: raw.episode_run_time?.[0] || null,
    seasonCount: raw.number_of_seasons ?? null,
    keywords: (raw.keywords?.results ?? []).slice(0, MAX_KEYWORDS),
    cast: mapCast(raw.credits?.cast),
    creators: uniqueBy(raw.created_by ?? [], (creator) => creator.id).map((creator) => ({
      id: creator.id,
      name: creator.name,
      profilePath: creator.profile_path ?? null,
      role: 'Criação',
    })),
    trailerYoutubeKey: pickTrailerKey(raw.videos?.results),
    watchProviders: mapWatchProviders(raw['watch/providers']?.results?.[TMDB_REGION]),
    recommendations: (raw.recommendations?.results ?? []).map(mapTvListItem),
  };
}

function mapCast(cast: readonly TmdbCastMember[] = []): Person[] {
  return [...cast]
    .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER))
    .slice(0, MAX_CAST_MEMBERS)
    .map((member) => ({
      id: member.id,
      name: member.name,
      profilePath: member.profile_path ?? null,
      role: member.character || null,
    }));
}

function mapDirectors(crew: readonly TmdbCrewMember[] = []): Person[] {
  return uniqueBy(
    crew.filter((member) => member.job === 'Director'),
    (member) => member.id,
  ).map((member) => ({
    id: member.id,
    name: member.name,
    profilePath: member.profile_path ?? null,
    role: 'Direção',
  }));
}

const TRAILER_TYPES = ['Trailer', 'Teaser'];
const TRAILER_LANGUAGES = ['pt', 'en'];

/** Escolhe o melhor vídeo do YouTube: trailer > teaser, português > inglês, oficial > não oficial. */
export function pickTrailerKey(videos: readonly TmdbVideo[] = []): string | null {
  const rank = (video: TmdbVideo) => {
    const language = TRAILER_LANGUAGES.indexOf(video.iso_639_1 ?? '');
    return (
      TRAILER_TYPES.indexOf(video.type) * 100 +
      (language === -1 ? TRAILER_LANGUAGES.length : language) * 10 +
      (video.official ? 0 : 1)
    );
  };

  const [best] = videos
    .filter((video) => video.site === 'YouTube' && TRAILER_TYPES.includes(video.type))
    .sort((a, b) => rank(a) - rank(b));

  return best?.key ?? null;
}

export function mapWatchProviders(
  region: TmdbWatchProviderRegion | undefined,
): WatchProviders | null {
  if (!region) return null;

  const streaming = uniqueBy(
    [...mapProviders(region.flatrate), ...mapProviders(region.free), ...mapProviders(region.ads)],
    (provider) => provider.id,
  );
  const rent = mapProviders(region.rent);
  const buy = mapProviders(region.buy);

  if (streaming.length + rent.length + buy.length === 0) return null;

  return { link: region.link ?? null, streaming, rent, buy };
}

function mapProviders(providers: readonly TmdbWatchProvider[] = []): WatchProvider[] {
  return [...providers]
    .sort((a, b) => (a.display_priority ?? 999) - (b.display_priority ?? 999))
    .map((provider) => ({
      id: provider.provider_id,
      name: provider.provider_name,
      logoPath: provider.logo_path ?? null,
    }));
}
