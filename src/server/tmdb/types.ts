/**
 * Tipos das respostas brutas da API v3 do TMDB (apenas os campos que o app utiliza).
 * Os dados são convertidos para os tipos de domínio em `mappers.ts`.
 */

export interface TmdbPaginated<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

interface TmdbListItemBase {
  id: number;
  poster_path?: string | null;
  backdrop_path?: string | null;
  genre_ids?: number[];
  original_language?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
}

export interface TmdbMovieListItem extends TmdbListItemBase {
  media_type?: 'movie';
  title: string;
  original_title?: string;
  release_date?: string;
}

export interface TmdbTvListItem extends TmdbListItemBase {
  media_type?: 'tv';
  name: string;
  original_name?: string;
  first_air_date?: string;
}

export type TmdbListItem = TmdbMovieListItem | TmdbTvListItem;

/** Um título na filmografia de uma pessoa (`combined_credits`). */
export type TmdbPersonCredit<Extra> =
  | (TmdbMovieListItem & { media_type: 'movie'; adult?: boolean } & Extra)
  | (TmdbTvListItem & {
      media_type: 'tv';
      adult?: boolean;
      episode_count?: number;
      /** Exibição do primeiro episódio com a pessoa (a série pode ter estreado anos antes). */
      first_credit_air_date?: string | null;
    } & Extra);

export type TmdbPersonCastCredit = TmdbPersonCredit<{ character?: string }>;
export type TmdbPersonCrewCredit = TmdbPersonCredit<{ job: string }>;

/** Créditos de uma pessoa em filmes e séries (`/person/{id}/combined_credits`). */
export interface TmdbCombinedCredits {
  cast?: TmdbPersonCastCredit[];
  crew?: TmdbPersonCrewCredit[];
}

export interface TmdbPersonDetails {
  id: number;
  name: string;
  biography?: string;
  known_for_department?: string | null;
  /** 0 = não informado, 1 = feminino, 2 = masculino, 3 = não binário. */
  gender?: number;
  birthday?: string | null;
  deathday?: string | null;
  place_of_birth?: string | null;
  profile_path?: string | null;
  combined_credits?: TmdbCombinedCredits;
}

/** Equipe de todas as temporadas de uma série (`/tv/{id}/aggregate_credits`). */
export interface TmdbAggregateCredits {
  crew?: Array<{
    id: number;
    name: string;
    profile_path?: string | null;
    jobs?: Array<{ job: string }>;
  }>;
}

/** `/movie/{id}/keywords` devolve `keywords`; `/tv/{id}/keywords` devolve `results`. */
export interface TmdbKeywordsResponse {
  keywords?: TmdbKeyword[];
  results?: TmdbKeyword[];
}

interface TmdbPersonSearchItem {
  media_type: 'person';
  id: number;
  name: string;
}

export type TmdbMultiSearchItem =
  | (TmdbMovieListItem & { media_type: 'movie' })
  | (TmdbTvListItem & { media_type: 'tv' })
  | TmdbPersonSearchItem;

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbKeyword {
  id: number;
  name: string;
}

export interface TmdbCastMember {
  id: number;
  name: string;
  character?: string;
  profile_path?: string | null;
  order?: number;
}

export interface TmdbCrewMember {
  id: number;
  name: string;
  job: string;
  profile_path?: string | null;
}

export interface TmdbVideo {
  key: string;
  site: string;
  type: string;
  official?: boolean;
  iso_639_1?: string | null;
}

export interface TmdbWatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path?: string | null;
  display_priority?: number;
}

export interface TmdbWatchProviderRegion {
  link?: string;
  flatrate?: TmdbWatchProvider[];
  free?: TmdbWatchProvider[];
  ads?: TmdbWatchProvider[];
  rent?: TmdbWatchProvider[];
  buy?: TmdbWatchProvider[];
}

interface TmdbDetailsBase {
  id: number;
  overview?: string;
  tagline?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  genres?: TmdbGenre[];
  original_language?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  credits?: { cast?: TmdbCastMember[]; crew?: TmdbCrewMember[] };
  videos?: { results?: TmdbVideo[] };
  'watch/providers'?: { results?: Record<string, TmdbWatchProviderRegion> };
}

/** Situação de um filme no TMDB. */
export type TmdbMovieStatus =
  'Rumored' | 'Planned' | 'In Production' | 'Post Production' | 'Released' | 'Canceled';

/** Situação de uma série no TMDB. */
export type TmdbTvStatus =
  'Returning Series' | 'Planned' | 'In Production' | 'Ended' | 'Canceled' | 'Pilot';

/** Episódio em `last_episode_to_air` / `next_episode_to_air`. */
export interface TmdbEpisodeAiring {
  season_number: number;
  episode_number: number;
  air_date?: string | null;
}

export interface TmdbMovieDetails extends TmdbDetailsBase {
  title: string;
  original_title?: string;
  release_date?: string;
  runtime?: number | null;
  status?: TmdbMovieStatus | string;
  keywords?: { keywords?: TmdbKeyword[] };
  recommendations?: TmdbPaginated<TmdbMovieListItem>;
}

export interface TmdbTvDetails extends TmdbDetailsBase {
  name: string;
  original_name?: string;
  first_air_date?: string;
  episode_run_time?: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  status?: TmdbTvStatus | string;
  last_episode_to_air?: TmdbEpisodeAiring | null;
  next_episode_to_air?: TmdbEpisodeAiring | null;
  created_by?: Array<{ id: number; name: string; profile_path?: string | null }>;
  /** Em séries o TMDB devolve as palavras-chave em `results` (em filmes, em `keywords`). */
  keywords?: { results?: TmdbKeyword[] };
  recommendations?: TmdbPaginated<TmdbTvListItem>;
}
