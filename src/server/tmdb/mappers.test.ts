import { describe, expect, it } from 'vitest';

import {
  mapAggregateOriginalAuthors,
  mapMovieDetails,
  mapMultiSearchItems,
  mapPersonCredits,
  mapPersonDetails,
  mapTitleStatus,
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

describe('situação do título', () => {
  it('converte a situação e a estreia de um filme', () => {
    expect(mapMovieDetails({ ...interstellar, status: 'Released' })).toMatchObject({
      status: 'released',
      releaseDate: '2014-11-04',
      episodeCount: null,
      lastEpisode: null,
      nextEpisode: null,
    });
  });

  it('converte a situação, os episódios e a agenda de uma série', () => {
    const details = mapTvDetails({
      ...breakingBad,
      status: 'Returning Series',
      number_of_episodes: 62,
      last_episode_to_air: { season_number: 3, episode_number: 8, air_date: '2026-08-09' },
      next_episode_to_air: { season_number: 4, episode_number: 1, air_date: '' },
    });

    expect(details).toMatchObject({
      status: 'returning',
      releaseDate: '2008-01-20',
      episodeCount: 62,
      lastEpisode: { seasonNumber: 3, episodeNumber: 8, airDate: '2026-08-09' },
      nextEpisode: { seasonNumber: 4, episodeNumber: 1, airDate: null },
    });
  });

  it('normaliza todas as situações conhecidas e descarta as desconhecidas', () => {
    expect(mapTitleStatus('Ended')).toBe('ended');
    expect(mapTitleStatus('Canceled')).toBe('canceled');
    expect(mapTitleStatus('In Production')).toBe('in-production');
    expect(mapTitleStatus('Post Production')).toBe('post-production');
    expect(mapTitleStatus('Rumored')).toBe('rumored');
    expect(mapTitleStatus('Pilot')).toBe('pilot');
    expect(mapTitleStatus('Algo novo')).toBeNull();
    expect(mapTitleStatus(undefined)).toBeNull();
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

describe('mapPersonCredits', () => {
  const credits = mapPersonCredits({
    cast: [
      {
        media_type: 'tv',
        id: 1,
        name: 'The Last of Us',
        character: 'Joel Miller',
        episode_count: 12,
        vote_count: 7000,
        first_air_date: '2023-01-15',
        first_credit_air_date: '2023-01-15',
      },
      {
        media_type: 'tv',
        id: 1,
        name: 'The Last of Us',
        character: 'Joel Miller (uncredited)',
        episode_count: 1,
        vote_count: 7000,
      },
      {
        media_type: 'movie',
        id: 2,
        title: 'Divertida Mente',
        character: 'Pedro (voice)',
        vote_count: 300,
      },
      { media_type: 'tv', id: 3, name: 'Talk show', character: 'Self - Guest', vote_count: 9000 },
      {
        media_type: 'tv',
        id: 4,
        name: 'Programa de entrevistas',
        character: 'Entrevistado',
        genre_ids: [10767],
        vote_count: 9000,
      },
      {
        media_type: 'movie',
        id: 5,
        title: 'Adulto',
        character: 'Alguém',
        adult: true,
        vote_count: 9000,
      },
      {
        media_type: 'movie',
        id: 6,
        title: 'Os Imperdoáveis',
        character: 'William Munny',
        vote_count: 5000,
        release_date: '1992-08-07',
      },
      {
        media_type: 'tv',
        id: 10,
        name: 'O Mentalista',
        character: 'Marcus Pike',
        episode_count: 7,
        vote_count: 3000,
        first_air_date: '2008-09-23',
        first_credit_air_date: '2014-03-30',
      },
    ],
    crew: [
      { media_type: 'movie', id: 6, title: 'Os Imperdoáveis', job: 'Director', vote_count: 5000 },
      { media_type: 'movie', id: 6, title: 'Os Imperdoáveis', job: 'Producer', vote_count: 5000 },
      { media_type: 'tv', id: 7, name: 'Episódio dirigido', job: 'Director', vote_count: 800 },
      { media_type: 'tv', id: 8, name: 'Criada', job: 'Creator', vote_count: 500 },
      { media_type: 'tv', id: 9, name: 'Anime', job: 'Comic Book', vote_count: 400 },
    ],
  });

  it('junta elenco e equipe em um item por título, dos mais aos menos votados', () => {
    expect(credits.map((credit) => [credit.media.id, credit.roles])).toEqual([
      [1, ['cast']],
      [6, ['cast', 'direction']],
      [10, ['cast']],
      [8, ['creation']],
      [9, ['original-work']],
      [2, ['cast']],
    ]);
  });

  it('remove aparições como "si mesmo", programas de entrevista e conteúdo adulto', () => {
    const ids = credits.map((credit) => credit.media.id);
    expect(ids).not.toContain(3);
    expect(ids).not.toContain(4);
    expect(ids).not.toContain(5);
  });

  it('ignora a direção de episódios avulsos de séries', () => {
    expect(credits.map((credit) => credit.media.id)).not.toContain(7);
  });

  it('limpa os personagens e guarda o número de episódios', () => {
    expect(credits[0]).toMatchObject({ characters: ['Joel Miller'], episodeCount: 12 });
    expect(credits.find((credit) => credit.media.id === 2)?.characters).toEqual(['Pedro (voz)']);
  });

  it('data a participação pelo lançamento do filme ou pelo primeiro episódio com a pessoa', () => {
    const dateOf = (id: number) => credits.find((credit) => credit.media.id === id)?.date;
    expect(dateOf(6)).toBe('1992-08-07');
    expect(dateOf(10)).toBe('2014-03-30');
    expect(dateOf(1)).toBe('2023-01-15');
    expect(dateOf(2)).toBeNull();
  });
});

describe('mapPersonDetails', () => {
  it('traduz a área de atuação e tolera campos vazios', () => {
    expect(
      mapPersonDetails({
        id: 1,
        name: 'Pedro Pascal',
        known_for_department: 'Acting',
        birthday: '',
      }),
    ).toMatchObject({
      name: 'Pedro Pascal',
      knownFor: 'Atuação',
      gender: null,
      birthday: null,
      credits: [],
    });
  });

  it('converte o código de gênero do TMDB', () => {
    const genderOf = (gender: number) => mapPersonDetails({ id: 1, name: 'X', gender }).gender;
    expect(genderOf(1)).toBe('female');
    expect(genderOf(2)).toBe('male');
    expect(genderOf(3)).toBe('non-binary');
    expect(genderOf(0)).toBeNull();
  });
});

describe('autores da obra original', () => {
  it('vêm da equipe de roteiro, sem duplicar', () => {
    const details = mapTvDetails({
      ...breakingBad,
      credits: {
        crew: [
          { id: 10, name: 'Hajime Isayama', job: 'Comic Book' },
          { id: 10, name: 'Hajime Isayama', job: 'Original Concept' },
          { id: 11, name: 'Hiroshi Seko', job: 'Series Composition' },
        ],
      },
    });

    expect(details.originalAuthors).toEqual([
      { id: 10, name: 'Hajime Isayama', profilePath: null, role: 'Obra original' },
    ]);
  });

  it('são encontrados nos créditos de todas as temporadas', () => {
    expect(
      mapAggregateOriginalAuthors({
        crew: [
          {
            id: 20,
            name: 'Eiichiro Oda',
            jobs: [{ job: 'Original Concept' }, { job: 'Comic Book' }],
          },
          { id: 21, name: 'Roteirista', jobs: [{ job: 'Writer' }] },
        ],
      }).map((person) => person.name),
    ).toEqual(['Eiichiro Oda']);
  });
});
