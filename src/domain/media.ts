/**
 * Tipos e regras de domínio sobre títulos (filmes, séries e animes).
 * Este módulo não depende de framework nem do TMDB: é usado tanto no servidor quanto no cliente.
 */

import { toCanonicalGenres, type CanonicalGenre } from './genres';
import type { EpisodeAiring, TitleStatus } from './title-status';

/** Formato do título no TMDB. Um anime é um filme ou uma série — ver `MediaCategory`. */
export const MEDIA_TYPES = ['movie', 'tv'] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

/**
 * Seção do app em que o título aparece. As seções são exclusivas:
 * um anime (filme ou série) fica só em "Animes", e não em "Filmes" ou "Séries".
 */
export const MEDIA_CATEGORIES = ['movie', 'tv', 'anime'] as const;
export type MediaCategory = (typeof MEDIA_CATEGORIES)[number];

/** Filtro das listagens: uma seção específica ou todas. */
export const MEDIA_FILTERS = ['all', ...MEDIA_CATEGORIES] as const;
export type MediaFilter = (typeof MEDIA_FILTERS)[number];

/** O que conta como anime: animação com idioma original japonês. */
export const ANIME_CRITERIA = {
  genre: 'animation',
  originalLanguage: 'ja',
} as const satisfies { genre: CanonicalGenre; originalLanguage: string };

/** Identificador único de um título no app, ex.: `movie:157336`. */
export type MediaKey = `${MediaType}:${number}`;

/** Dados essenciais de um título — o suficiente para exibir um card e alimentar o recomendador. */
export interface MediaSummary {
  id: number;
  mediaType: MediaType;
  title: string;
  originalTitle: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseYear: number | null;
  genreIds: number[];
  originalLanguage: string;
  voteAverage: number;
  voteCount: number;
  popularity: number;
}

export interface Genre {
  id: number;
  name: string;
}

export interface Keyword {
  id: number;
  name: string;
}

export interface Person {
  id: number;
  name: string;
  profilePath: string | null;
  /** Personagem (elenco) ou função (equipe), quando houver. */
  role: string | null;
}

export interface WatchProvider {
  id: number;
  name: string;
  logoPath: string | null;
}

export interface WatchProviders {
  link: string | null;
  streaming: WatchProvider[];
  rent: WatchProvider[];
  buy: WatchProvider[];
}

/** Título completo, usado na página de detalhes e no cálculo de similaridade. */
export interface MediaDetails extends MediaSummary {
  overview: string;
  tagline: string | null;
  genres: Genre[];
  runtimeMinutes: number | null;
  seasonCount: number | null;
  keywords: Keyword[];
  cast: Person[];
  /** Direção (filmes) ou criação (séries). */
  creators: Person[];
  /** Autores da obra adaptada (mangá, livro, HQ…), quando o título é uma adaptação. */
  originalAuthors: Person[];
  trailerYoutubeKey: string | null;
  watchProviders: WatchProviders | null;
  recommendations: MediaSummary[];
  /** Situação informada pelo TMDB (lançado, em andamento, finalizado…). */
  status: TitleStatus | null;
  /** Estreia do filme ou do primeiro episódio da série ("2014-11-06"). */
  releaseDate: string | null;
  /** Total de episódios (só séries). */
  episodeCount: number | null;
  /** Último episódio já exibido e o próximo previsto (só séries). */
  lastEpisode: EpisodeAiring | null;
  nextEpisode: EpisodeAiring | null;
}

/** Campos usados para classificar um título em uma seção. */
export type CategorizableMedia = Pick<MediaSummary, 'mediaType' | 'genreIds' | 'originalLanguage'>;

export const MEDIA_FILTER_LABELS: Record<MediaFilter, string> = {
  all: 'Tudo',
  movie: 'Filmes',
  tv: 'Séries',
  anime: 'Animes',
};

/** Rótulo do formato exibido nos cards e na página do título. */
const MEDIA_LABELS: Record<MediaType, { regular: string; anime: string }> = {
  movie: { regular: 'Filme', anime: 'Filme anime' },
  tv: { regular: 'Série', anime: 'Anime' },
};

export function isMediaType(value: unknown): value is MediaType {
  return MEDIA_TYPES.includes(value as MediaType);
}

export function getMediaKey(media: Pick<MediaSummary, 'mediaType' | 'id'>): MediaKey {
  return `${media.mediaType}:${media.id}`;
}

export function parseMediaKey(key: string): Pick<MediaSummary, 'mediaType' | 'id'> | null {
  const [mediaType, rawId, ...rest] = key.split(':');
  const id = Number(rawId);

  if (rest.length > 0 || !isMediaType(mediaType) || !Number.isInteger(id) || id <= 0) {
    return null;
  }

  return { mediaType, id };
}

export function isAnime(media: Pick<MediaSummary, 'genreIds' | 'originalLanguage'>): boolean {
  return (
    media.originalLanguage === ANIME_CRITERIA.originalLanguage &&
    toCanonicalGenres(media.genreIds).includes(ANIME_CRITERIA.genre)
  );
}

export function getMediaCategory(media: CategorizableMedia): MediaCategory {
  return isAnime(media) ? 'anime' : media.mediaType;
}

/** "Filme", "Série", "Anime" (série) ou "Filme anime". */
export function getMediaLabel(media: CategorizableMedia): string {
  const labels = MEDIA_LABELS[media.mediaType];
  return isAnime(media) ? labels.anime : labels.regular;
}

/** Gênero gramatical do rótulo, para concordar adjetivos: "a série", mas "o filme" e "o anime". */
export type GrammaticalGender = 'masculine' | 'feminine';

export function getMediaLabelGender(media: CategorizableMedia): GrammaticalGender {
  return getMediaCategory(media) === 'tv' ? 'feminine' : 'masculine';
}

export function matchesFilter(media: CategorizableMedia, filter: MediaFilter): boolean {
  return filter === 'all' || getMediaCategory(media) === filter;
}

/**
 * Quem é o "autor" do título (usado em "Outras obras de…"): a direção nos filmes, a criação
 * nas séries e o autor da obra original (mangá, light novel…) nos animes. Na falta dele,
 * vale o outro grupo — ex.: série sem criador cadastrado → autor do livro adaptado.
 */
export function getTitleAuthors(
  media: CategorizableMedia & Pick<MediaDetails, 'creators' | 'originalAuthors'>,
): Person[] {
  const [preferred, fallback] = isAnime(media)
    ? [media.originalAuthors, media.creators]
    : [media.creators, media.originalAuthors];
  return preferred.length > 0 ? preferred : fallback;
}

/** Reduz um título completo ao resumo (evita trafegar/persistir dados desnecessários). */
export function toMediaSummary(media: MediaSummary): MediaSummary {
  return {
    id: media.id,
    mediaType: media.mediaType,
    title: media.title,
    originalTitle: media.originalTitle,
    posterPath: media.posterPath,
    backdropPath: media.backdropPath,
    releaseYear: media.releaseYear,
    genreIds: media.genreIds,
    originalLanguage: media.originalLanguage,
    voteAverage: media.voteAverage,
    voteCount: media.voteCount,
    popularity: media.popularity,
  };
}
