import { describe, expect, it } from 'vitest';

import {
  mapCreatorWorks,
  mapMovieDetails,
  mapMultiSearchItems,
  mapTvDetails,
  mapWatchProviders,
  parseReleaseYear,
  pickTrailerKey,
} from './mappers';
import type { TmdbMovieDetails, TmdbTvDetails } from './types';

const interstellar: TmdbMovieDetails = {
  id: 157336,
  title: 'Interestelar',
  original_title: 'Interstellar',
  release_date: '2014-11-04',
  runtime: 169,
  overview: 'As reservas naturais da Terra estão chegando ao fim…',
  tagline: 'O fim da terra não será o nosso fim.',
  poster_path: '/poster.jpg',
  backdrop_path: '/backdrop.jpg',
  genres: [
    { id: 12, name: 'Aventura' },
    { id: 878, name: 'Ficção científica' },
  ],
  original_language: 'en',
  vote_average: 8.46,
  vote_count: 38000,
  popularity: 40,
  keywords: { keywords: [{ id: 1612, name: 'spacecraft' }] },
  credits: {
    cast: [
      { id: 2, name: 'Anne Hathaway', character: 'Brand', profile_path: null, order: 1 },
      {
        id: 1,
        name: 'Matthew McConaughey',
        character: 'Cooper',
        profile_path: '/mm.jpg',
        order: 0,
      },
    ],
    crew: [
      { id: 525, name: 'Christopher Nolan', job: 'Director' },
      { id: 525, name: 'Christopher Nolan', job: 'Director' },
      { id: 999, name: 'Hans Zimmer', job: 'Original Music Composer' },
    ],
  },
  videos: {
    results: [
      { key: 'clip', site: 'YouTube', type: 'Clip', official: true, iso_639_1: 'en' },
      { key: 'trailer-en', site: 'YouTube', type: 'Trailer', official: true, iso_639_1: 'en' },
      { key: 'trailer-pt', site: 'YouTube', type: 'Trailer', official: true, iso_639_1: 'pt' },
    ],
  },
  'watch/providers': {
    results: {
      BR: {
        link: 'https://www.themoviedb.org/movie/157336/watch?locale=BR',
        flatrate: [
          {
            provider_id: 1899,
            provider_name: 'HBO Max',
            logo_path: '/hbo.png',
            display_priority: 9,
          },
          {
            provider_id: 119,
            provider_name: 'Prime Video',
            logo_path: '/prime.png',
            display_priority: 2,
          },
        ],
      },
    },
  },
  recommendations: {
    page: 1,
    total_pages: 1,
    total_results: 1,
    results: [{ id: 27205, title: 'A Origem', release_date: '2010-07-15', genre_ids: [28, 878] }],
  },
};

const breakingBad: TmdbTvDetails = {
  id: 1396,
  name: 'Breaking Bad',
  original_name: 'Breaking Bad',
  first_air_date: '2008-01-20',
  episode_run_time: [],
  number_of_seasons: 5,
  created_by: [{ id: 66633, name: 'Vince Gilligan', profile_path: '/vg.jpg' }],
  genres: [
    { id: 18, name: 'Drama' },
    { id: 80, name: 'Crime' },
  ],
  keywords: { results: [{ id: 1508, name: 'new mexico' }] },
};

describe('parseReleaseYear', () => {
  it('extrai o ano da data do TMDB', () => {
    expect(parseReleaseYear('2014-11-04')).toBe(2014);
    expect(parseReleaseYear('')).toBeNull();
    expect(parseReleaseYear(undefined)).toBeNull();
  });
});

describe('mapMovieDetails', () => {
  const details = mapMovieDetails(interstellar);

  it('converte os dados principais', () => {
    expect(details).toMatchObject({
      id: 157336,
      mediaType: 'movie',
      title: 'Interestelar',
      originalTitle: 'Interstellar',
      releaseYear: 2014,
      runtimeMinutes: 169,
      genreIds: [12, 878],
      keywords: [{ id: 1612, name: 'spacecraft' }],
    });
  });

  it('ordena o elenco pela ordem de crédito e extrai a direção sem duplicar', () => {
    expect(details.cast.map((person) => person.name)).toEqual([
      'Matthew McConaughey',
      'Anne Hathaway',
    ]);
    expect(details.creators).toEqual([
      { id: 525, name: 'Christopher Nolan', profilePath: null, role: 'Direção' },
    ]);
  });

  it('escolhe o trailer em português e as plataformas do Brasil por prioridade', () => {
    expect(details.trailerYoutubeKey).toBe('trailer-pt');
    expect(details.watchProviders?.streaming.map((provider) => provider.name)).toEqual([
      'Prime Video',
      'HBO Max',
    ]);
  });

  it('converte as recomendações do TMDB em resumos', () => {
    expect(details.recommendations).toEqual([
      expect.objectContaining({
        id: 27205,
        mediaType: 'movie',
        title: 'A Origem',
        releaseYear: 2010,
      }),
    ]);
  });
});

describe('mapTvDetails', () => {
  it('usa os campos de série (nome, temporadas, criação e palavras-chave em "results")', () => {
    const details = mapTvDetails(breakingBad);

    expect(details).toMatchObject({
      mediaType: 'tv',
      title: 'Breaking Bad',
      releaseYear: 2008,
      seasonCount: 5,
      runtimeMinutes: null,
      keywords: [{ id: 1508, name: 'new mexico' }],
      creators: [{ id: 66633, name: 'Vince Gilligan', profilePath: '/vg.jpg', role: 'Criação' }],
      watchProviders: null,
      trailerYoutubeKey: null,
    });
  });
});

describe('mapMultiSearchItems', () => {
  it('mantém filmes e séries e descarta pessoas', () => {
    const items = mapMultiSearchItems([
      { media_type: 'tv', id: 1, name: 'Breaking Bad' },
      { media_type: 'person', id: 2, name: 'Bryan Cranston' },
      { media_type: 'movie', id: 3, title: 'El Camino' },
    ]);

    expect(items.map((item) => [item.mediaType, item.title])).toEqual([
      ['tv', 'Breaking Bad'],
      ['movie', 'El Camino'],
    ]);
  });
});

describe('pickTrailerKey / mapWatchProviders', () => {
  it('prefere trailer a teaser e ignora vídeos fora do YouTube', () => {
    expect(
      pickTrailerKey([
        { key: 'teaser', site: 'YouTube', type: 'Teaser', iso_639_1: 'pt' },
        { key: 'vimeo', site: 'Vimeo', type: 'Trailer', iso_639_1: 'pt' },
        { key: 'trailer', site: 'YouTube', type: 'Trailer', iso_639_1: 'en' },
      ]),
    ).toBe('trailer');
    expect(pickTrailerKey([])).toBeNull();
  });

  it('devolve null quando não há nenhuma plataforma', () => {
    expect(mapWatchProviders(undefined)).toBeNull();
    expect(mapWatchProviders({ link: 'https://example.com' })).toBeNull();
  });
});

describe('mapCreatorWorks', () => {
  it('mantém só filmes dirigidos e séries criadas, dos mais aos menos votados', () => {
    const works = mapCreatorWorks({
      crew: [
        { media_type: 'movie', id: 1, title: 'Produzido', job: 'Producer', vote_count: 9000 },
        { media_type: 'movie', id: 2, title: 'Dirigido', job: 'Director', vote_count: 100 },
        { media_type: 'tv', id: 3, name: 'Criada', job: 'Creator', vote_count: 500 },
        { media_type: 'tv', id: 4, name: 'Episódio dirigido', job: 'Director', vote_count: 800 },
        { media_type: 'movie', id: 2, title: 'Dirigido', job: 'Director', vote_count: 100 },
      ],
    });

    expect(works.map((work) => [work.mediaType, work.title])).toEqual([
      ['tv', 'Criada'],
      ['movie', 'Dirigido'],
    ]);
  });
});
