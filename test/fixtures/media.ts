import type { MediaDetails, MediaSummary } from '@/domain/media';

let nextId = 1000;

/** Cria um resumo de título com valores padrão plausíveis (sobrescreva o que importar no teste). */
export function buildMedia(overrides: Partial<MediaSummary> = {}): MediaSummary {
  const id = overrides.id ?? nextId++;
  return {
    id,
    mediaType: 'movie',
    title: `Título ${id}`,
    originalTitle: `Title ${id}`,
    posterPath: `/poster-${id}.jpg`,
    backdropPath: null,
    releaseYear: 2015,
    genreIds: [18],
    originalLanguage: 'en',
    voteAverage: 7.5,
    voteCount: 5000,
    popularity: 50,
    ...overrides,
  };
}

/** Cria um título completo (detalhes) com valores padrão plausíveis. */
export function buildDetails(overrides: Partial<MediaDetails> = {}): MediaDetails {
  const {
    overview = '',
    tagline = null,
    genres = [],
    runtimeMinutes = 120,
    seasonCount = null,
    keywords = [],
    cast = [],
    creators = [],
    originalAuthors = [],
    trailerYoutubeKey = null,
    watchProviders = null,
    recommendations = [],
    ...summary
  } = overrides;

  return {
    ...buildMedia(summary),
    overview,
    tagline,
    genres,
    runtimeMinutes,
    seasonCount,
    keywords,
    cast,
    creators,
    originalAuthors,
    trailerYoutubeKey,
    watchProviders,
    recommendations,
  };
}
