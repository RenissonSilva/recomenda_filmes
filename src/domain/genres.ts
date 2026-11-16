import type { MediaType } from './media';

/**
 * O TMDB usa listas de gêneros diferentes para filmes e séries
 * (ex.: filme "Ficção científica" = 878, série "Sci-Fi & Fantasy" = 10765).
 * Os gêneros canônicos unificam as duas listas para que um filme possa ser comparado a uma série.
 */
export const CANONICAL_GENRES = [
  'action',
  'adventure',
  'animation',
  'comedy',
  'crime',
  'documentary',
  'drama',
  'family',
  'fantasy',
  'history',
  'horror',
  'kids',
  'music',
  'mystery',
  'news',
  'politics',
  'reality',
  'romance',
  'science-fiction',
  'soap',
  'talk',
  'thriller',
  'tv-movie',
  'war',
  'western',
] as const;

export type CanonicalGenre = (typeof CANONICAL_GENRES)[number];

export const CANONICAL_GENRE_LABELS: Record<CanonicalGenre, string> = {
  action: 'Ação',
  adventure: 'Aventura',
  animation: 'Animação',
  comedy: 'Comédia',
  crime: 'Crime',
  documentary: 'Documentário',
  drama: 'Drama',
  family: 'Família',
  fantasy: 'Fantasia',
  history: 'História',
  horror: 'Terror',
  kids: 'Infantil',
  music: 'Música',
  mystery: 'Mistério',
  news: 'Notícias',
  politics: 'Política',
  reality: 'Reality show',
  romance: 'Romance',
  'science-fiction': 'Ficção científica',
  soap: 'Novela',
  talk: 'Talk show',
  thriller: 'Suspense',
  'tv-movie': 'Filme para TV',
  war: 'Guerra',
  western: 'Faroeste',
};

/** IDs de gênero do TMDB (filmes e séries) → gêneros canônicos. */
const TMDB_GENRE_TO_CANONICAL: Readonly<Record<number, readonly CanonicalGenre[]>> = {
  // Filmes
  28: ['action'],
  12: ['adventure'],
  14: ['fantasy'],
  27: ['horror'],
  36: ['history'],
  53: ['thriller'],
  878: ['science-fiction'],
  10402: ['music'],
  10749: ['romance'],
  10752: ['war'],
  10770: ['tv-movie'],
  // Compartilhados entre filmes e séries
  16: ['animation'],
  18: ['drama'],
  35: ['comedy'],
  37: ['western'],
  80: ['crime'],
  99: ['documentary'],
  9648: ['mystery'],
  10751: ['family'],
  // Séries
  10759: ['action', 'adventure'],
  10762: ['kids'],
  10763: ['news'],
  10764: ['reality'],
  10765: ['science-fiction', 'fantasy'],
  10766: ['soap'],
  10767: ['talk'],
  10768: ['war', 'politics'],
};

/** IDs válidos em cada lista do TMDB, usados para montar consultas de descoberta. */
const TMDB_GENRE_IDS_BY_TYPE: Readonly<Record<MediaType, readonly number[]>> = {
  movie: [
    28, 12, 14, 27, 36, 53, 878, 10402, 10749, 10752, 10770, 16, 18, 35, 37, 80, 99, 9648, 10751,
  ],
  tv: [10759, 10762, 10763, 10764, 10765, 10766, 10767, 10768, 16, 18, 35, 37, 80, 99, 9648, 10751],
};

export function toCanonicalGenres(tmdbGenreIds: readonly number[]): CanonicalGenre[] {
  const genres = new Set<CanonicalGenre>();
  for (const id of tmdbGenreIds) {
    for (const genre of TMDB_GENRE_TO_CANONICAL[id] ?? []) genres.add(genre);
  }
  return [...genres];
}

/** Caminho inverso: gênero canônico → IDs do TMDB para o tipo de mídia informado. */
export function toTmdbGenreIds(genre: CanonicalGenre, mediaType: MediaType): number[] {
  return TMDB_GENRE_IDS_BY_TYPE[mediaType].filter((id) =>
    TMDB_GENRE_TO_CANONICAL[id]?.includes(genre),
  );
}
