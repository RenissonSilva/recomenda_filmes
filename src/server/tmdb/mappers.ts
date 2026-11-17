import { toCanonicalGenres, type CanonicalGenre } from '@/domain/genres';
import {
  getMediaKey,
  type Keyword,
  type MediaDetails,
  type MediaKey,
  type MediaSummary,
  type MediaType,
  type Person,
  type WatchProvider,
  type WatchProviders,
} from '@/domain/media';
import {
  CREDIT_ROLES,
  type CreditRole,
  type PersonCredit,
  type PersonDetails,
} from '@/domain/person';
import { uniqueBy } from '@/lib/array';

import { MAX_CAST_MEMBERS, MAX_KEYWORDS, ORIGINAL_WORK_JOBS, TMDB_REGION } from './config';
import type {
  TmdbAggregateCredits,
  TmdbCastMember,
  TmdbCombinedCredits,
  TmdbCrewMember,
  TmdbKeywordsResponse,
  TmdbListItem,
  TmdbMovieDetails,
  TmdbMovieListItem,
  TmdbMultiSearchItem,
  TmdbPersonCastCredit,
  TmdbPersonCrewCredit,
  TmdbPersonDetails,
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
    originalAuthors: mapOriginalAuthors(raw.credits?.crew),
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
    originalAuthors: mapOriginalAuthors(raw.credits?.crew),
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

const ORIGINAL_WORK_ROLE = 'Obra original';

/** Autores da obra adaptada (mangá, livro…), a partir da equipe de roteiro. */
export function mapOriginalAuthors(crew: readonly TmdbCrewMember[] = []): Person[] {
  return uniqueBy(
    crew.filter((member) => ORIGINAL_WORK_JOBS.has(member.job)),
    (member) => member.id,
  ).map((member) => ({
    id: member.id,
    name: member.name,
    profilePath: member.profile_path ?? null,
    role: ORIGINAL_WORK_ROLE,
  }));
}

/** O mesmo que `mapOriginalAuthors`, para a equipe de todas as temporadas de uma série. */
export function mapAggregateOriginalAuthors(credits: TmdbAggregateCredits): Person[] {
  return (credits.crew ?? [])
    .filter((member) => member.jobs?.some((job) => ORIGINAL_WORK_JOBS.has(job.job)))
    .map((member) => ({
      id: member.id,
      name: member.name,
      profilePath: member.profile_path ?? null,
      role: ORIGINAL_WORK_ROLE,
    }));
}

/** Palavras-chave de `/movie/{id}/keywords` ou `/tv/{id}/keywords`. */
export function mapKeywords(response: TmdbKeywordsResponse): Keyword[] {
  return (response.keywords ?? response.results ?? [])
    .slice(0, MAX_KEYWORDS)
    .map((keyword) => ({ id: keyword.id, name: keyword.name }));
}

/** Área de atuação (`known_for_department`) em português. */
const DEPARTMENT_LABELS: Readonly<Record<string, string>> = {
  Acting: 'Atuação',
  Directing: 'Direção',
  Writing: 'Roteiro',
  Production: 'Produção',
  Creator: 'Criação',
  Camera: 'Fotografia',
  Editing: 'Montagem',
  Sound: 'Som',
  Art: 'Direção de arte',
  'Costume & Make-Up': 'Figurino e maquiagem',
  'Visual Effects': 'Efeitos visuais',
  Lighting: 'Iluminação',
  Crew: 'Equipe técnica',
};

export function mapPersonDetails(raw: TmdbPersonDetails): PersonDetails {
  return {
    id: raw.id,
    name: raw.name,
    originalName: null,
    profilePath: raw.profile_path ?? null,
    biography: raw.biography?.trim() ?? '',
    knownFor: DEPARTMENT_LABELS[raw.known_for_department ?? ''] ?? null,
    birthday: raw.birthday || null,
    deathday: raw.deathday || null,
    placeOfBirth: raw.place_of_birth || null,
    credits: mapPersonCredits(raw.combined_credits ?? {}),
  };
}

/** Participações em que a pessoa aparece como ela mesma (talk shows, premiações, bastidores). */
const SELF_APPEARANCE = /^(self|himself|herself|themselves|themself|ele mesmo|ela mesma)\b/i;

/** Programas que não são obras de ficção: aparições neles ficam fora da filmografia. */
const EXCLUDED_CAST_GENRES: readonly CanonicalGenre[] = ['talk', 'news'];

function isFilmographyCastCredit(credit: TmdbPersonCastCredit): boolean {
  if (SELF_APPEARANCE.test(credit.character?.trim() ?? '')) return false;
  const genres = toCanonicalGenres(credit.genre_ids ?? []);
  return !genres.some((genre) => EXCLUDED_CAST_GENRES.includes(genre));
}

/** "Joel Miller (uncredited)" → "Joel Miller"; "Pedro (voice)" → "Pedro (voz)". */
function cleanCharacter(character: string | undefined): string {
  return (character ?? '')
    .replace(/\s*\(uncredited\)/gi, '')
    .replace(/\(voice\)/gi, '(voz)')
    .trim();
}

function crewRole(credit: TmdbPersonCrewCredit): CreditRole | null {
  // Em séries, "Director" é a direção de episódios avulsos: não conta como obra da pessoa.
  if (credit.media_type === 'movie' && credit.job === 'Director') return 'direction';
  if (credit.media_type === 'tv' && credit.job === 'Creator') return 'creation';
  if (ORIGINAL_WORK_JOBS.has(credit.job)) return 'original-work';
  return null;
}

/**
 * Filmografia: junta elenco e equipe em um item por título. Da equipe entram só direção (filmes),
 * criação (séries) e autoria da obra original; do elenco saem as aparições como "si mesmo".
 */
export function mapPersonCredits(credits: TmdbCombinedCredits): PersonCredit[] {
  const byTitle = new Map<MediaKey, PersonCredit>();

  const creditFor = (item: TmdbPersonCastCredit | TmdbPersonCrewCredit): PersonCredit => {
    const media = item.media_type === 'movie' ? mapMovieListItem(item) : mapTvListItem(item);
    const key = getMediaKey(media);
    let credit = byTitle.get(key);
    if (!credit) {
      credit = { media, roles: [], characters: [], episodeCount: null };
      byTitle.set(key, credit);
    }
    return credit;
  };
  const addRole = (credit: PersonCredit, role: CreditRole) => {
    if (!credit.roles.includes(role)) credit.roles.push(role);
  };

  for (const item of credits.cast ?? []) {
    if (item.adult || !isFilmographyCastCredit(item)) continue;
    const credit = creditFor(item);
    addRole(credit, 'cast');

    const character = cleanCharacter(item.character);
    if (character && !credit.characters.includes(character)) credit.characters.push(character);
    if (item.media_type === 'tv' && item.episode_count) {
      credit.episodeCount = Math.max(credit.episodeCount ?? 0, item.episode_count);
    }
  }

  for (const item of credits.crew ?? []) {
    const role = item.adult ? null : crewRole(item);
    if (role) addRole(creditFor(item), role);
  }

  return [...byTitle.values()]
    .map((credit) => ({
      ...credit,
      roles: [...credit.roles].sort((a, b) => CREDIT_ROLES.indexOf(a) - CREDIT_ROLES.indexOf(b)),
    }))
    .sort((a, b) => b.media.voteCount - a.media.voteCount);
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
