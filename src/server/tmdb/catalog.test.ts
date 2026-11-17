import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TmdbRequestError } from '../errors';
import {
  discoverByKeywords,
  discoverTitles,
  discoverTopRatedByGenres,
  getPersonDetails,
  searchTitles,
} from './catalog';
import { tmdbGet } from './client';
import type { TmdbListItem, TmdbMultiSearchItem, TmdbPaginated } from './types';

vi.mock('next/cache', () => ({ cacheLife: vi.fn() }));
// "Hoje" fixo: a ordenação por data só aceita títulos que já estrearam.
vi.mock('@/lib/format', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getTodayIsoDate: () => '2026-11-17',
}));
vi.mock('./client', () => ({ tmdbGet: vi.fn() }));

const ANIMATION = 16;
const DRAMA = 18;
const HORROR = 27;
const ACTION_MOVIE = 28;
const ACTION_ADVENTURE_TV = 10759;

const movie = (id: number, genreIds = [DRAMA], language = 'en') => ({
  id,
  title: `Filme ${id}`,
  genre_ids: genreIds,
  original_language: language,
});
const series = (id: number, genreIds = [DRAMA], language = 'en') => ({
  id,
  name: `Série ${id}`,
  genre_ids: genreIds,
  original_language: language,
});

const page = <T>(results: T[], totalPages = 10): TmdbPaginated<T> => ({
  page: 1,
  results,
  total_pages: totalPages,
  total_results: results.length,
});

/** Simula o TMDB respondendo por endpoint. */
function mockTmdb(responses: Record<string, TmdbPaginated<TmdbListItem | TmdbMultiSearchItem>>) {
  vi.mocked(tmdbGet).mockImplementation(async (path: string) => {
    const response = responses[path];
    if (!response) throw new Error(`Endpoint inesperado: ${path}`);
    return response;
  });
}

const queryOf = (path: string) =>
  vi.mocked(tmdbGet).mock.calls.find(([calledPath]) => calledPath === path)?.[1];

const idsOf = (items: Array<{ mediaType: string; id: number }>) =>
  items.map((item) => `${item.mediaType}:${item.id}`);

describe('catálogo do TMDB', () => {
  beforeEach(() => {
    vi.mocked(tmdbGet).mockReset();
  });

  describe('discoverTitles', () => {
    it('em "Animes", junta séries e filmes de animação japonesa', async () => {
      mockTmdb({
        '/discover/tv': page([series(1, [ANIMATION], 'ja')], 8),
        '/discover/movie': page([movie(2, [ANIMATION], 'ja')], 5),
      });

      const result = await discoverTitles('anime', 1);

      expect(idsOf(result.items)).toEqual(['tv:1', 'movie:2']);
      // Quando os filmes acabam, as séries continuam.
      expect(result.totalPages).toBe(8);
      for (const path of ['/discover/tv', '/discover/movie']) {
        expect(queryOf(path)).toMatchObject({
          with_genres: String(ANIMATION),
          with_original_language: 'ja',
          sort_by: 'vote_count.desc',
        });
      }
    });

    it('em "Séries", remove os animes (eles têm a própria seção)', async () => {
      mockTmdb({
        '/discover/tv': page([series(1), series(2, [ANIMATION], 'ja'), series(3, [ANIMATION])]),
      });

      const result = await discoverTitles('tv', 1);

      // Animação ocidental continua em "Séries"; só a japonesa vai para "Animes".
      expect(idsOf(result.items)).toEqual(['tv:1', 'tv:3']);
      expect(queryOf('/discover/tv')).not.toHaveProperty('with_original_language', 'ja');
    });

    it('em "Tudo", intercala filmes e séries, incluindo animes', async () => {
      mockTmdb({
        '/discover/movie': page([movie(1), movie(3)]),
        '/discover/tv': page([series(2, [ANIMATION], 'ja')]),
      });

      const result = await discoverTitles('all', 1);

      expect(idsOf(result.items)).toEqual(['movie:1', 'tv:2', 'movie:3']);
    });

    it('com um gênero, usa o ID equivalente em filmes e em séries', async () => {
      mockTmdb({
        '/discover/movie': page([movie(1, [ACTION_MOVIE])]),
        '/discover/tv': page([series(2, [ACTION_ADVENTURE_TV])]),
      });

      await discoverTitles('all', 1, { genre: 'action' });

      expect(queryOf('/discover/movie')).toMatchObject({ with_genres: String(ACTION_MOVIE) });
      expect(queryOf('/discover/tv')).toMatchObject({ with_genres: String(ACTION_ADVENTURE_TV) });
    });

    it('nos animes, exige animação e também o gênero escolhido', async () => {
      mockTmdb({
        '/discover/tv': page([series(1, [ANIMATION, ACTION_ADVENTURE_TV], 'ja')]),
        '/discover/movie': page([movie(2, [ANIMATION, ACTION_MOVIE], 'ja')]),
      });

      await discoverTitles('anime', 1, { genre: 'action' });

      expect(queryOf('/discover/tv')).toMatchObject({
        with_genres: `${ANIMATION},${ACTION_ADVENTURE_TV}`,
        with_original_language: 'ja',
      });
      expect(queryOf('/discover/movie')).toMatchObject({
        with_genres: `${ANIMATION},${ACTION_MOVIE}`,
      });
    });

    it('ignora a fonte que não tem o gênero e fica vazio se nenhuma tiver', async () => {
      mockTmdb({ '/discover/movie': page([movie(1, [HORROR])], 3) });

      const all = await discoverTitles('all', 1, { genre: 'horror' });
      expect(idsOf(all.items)).toEqual(['movie:1']);
      expect(all.totalPages).toBe(3);

      const tvOnly = await discoverTitles('tv', 1, { genre: 'horror' });
      expect(tvOnly).toEqual({ page: 1, totalPages: 0, items: [] });
      expect(vi.mocked(tmdbGet)).toHaveBeenCalledTimes(1);
    });

    it('ordena por nota exigindo um mínimo de votos', async () => {
      mockTmdb({ '/discover/movie': page([movie(1)]) });

      await discoverTitles('movie', 1, { sort: 'rating' });

      expect(queryOf('/discover/movie')).toMatchObject({
        sort_by: 'vote_average.desc',
        'vote_count.gte': 300,
      });
    });

    it('ordena pelos mais recentes que já estrearam, pela data de cada tipo', async () => {
      mockTmdb({ '/discover/movie': page([movie(1)]), '/discover/tv': page([series(2)]) });

      await discoverTitles('all', 1, { sort: 'recent' });

      expect(queryOf('/discover/movie')).toMatchObject({
        sort_by: 'primary_release_date.desc',
        'primary_release_date.lte': '2026-11-17',
      });
      expect(queryOf('/discover/tv')).toMatchObject({
        sort_by: 'first_air_date.desc',
        'first_air_date.lte': '2026-11-17',
      });
    });
  });

  describe('searchTitles', () => {
    it('em "Animes", busca filmes e séries e mantém só os animes', async () => {
      mockTmdb({
        '/search/multi': page<TmdbMultiSearchItem>([
          { ...series(1, [ANIMATION], 'ja'), media_type: 'tv' },
          { ...series(2), media_type: 'tv' },
          { ...movie(3, [ANIMATION], 'ja'), media_type: 'movie' },
          { id: 4, name: 'Pessoa', media_type: 'person' },
        ]),
      });

      const result = await searchTitles('naruto', 'anime', 1);

      expect(idsOf(result.items)).toEqual(['tv:1', 'movie:3']);
    });

    it('em "Filmes", não mostra filmes de anime', async () => {
      mockTmdb({ '/search/movie': page([movie(1), movie(2, [ANIMATION], 'ja')]) });

      const result = await searchTitles('viagem', 'movie', 1);

      expect(idsOf(result.items)).toEqual(['movie:1']);
    });
  });

  describe('discoverTopRatedByGenres', () => {
    it('em "Animes", exige animação, idioma japonês e os gêneros favoritos', async () => {
      mockTmdb({
        '/discover/tv': page([series(1, [ANIMATION, DRAMA], 'ja')]),
        '/discover/movie': page([movie(2, [ANIMATION, DRAMA], 'ja')]),
      });

      const items = await discoverTopRatedByGenres('anime', ['drama']);

      expect(idsOf(items)).toEqual(['tv:1', 'movie:2']);
      expect(queryOf('/discover/tv')).toMatchObject({
        with_genres: `${ANIMATION},${DRAMA}`,
        with_original_language: 'ja',
        sort_by: 'vote_average.desc',
      });
    });

    it('ignora as fontes em que nenhum dos gêneros existe', async () => {
      mockTmdb({ '/discover/tv': page([series(1)]) });

      // "Novela" só existe na lista de gêneros de séries.
      const items = await discoverTopRatedByGenres('movie', ['soap']);

      expect(items).toEqual([]);
      expect(tmdbGet).not.toHaveBeenCalled();
    });
  });

  describe('discoverByKeywords', () => {
    it('busca os títulos com qualquer uma das palavras-chave e respeita a seção', async () => {
      mockTmdb({ '/discover/movie': page([movie(1), movie(2, [ANIMATION], 'ja')]) });

      const items = await discoverByKeywords('movie', [30, 7]);

      // O filme de anime fica para a seção "Animes".
      expect(idsOf(items)).toEqual(['movie:1']);
      expect(queryOf('/discover/movie')).toMatchObject({
        with_keywords: '7|30',
        sort_by: 'vote_count.desc',
      });
    });
  });

  describe('getPersonDetails', () => {
    it('troca o nome em outro alfabeto pela versão latina', async () => {
      vi.mocked(tmdbGet).mockImplementation(async (_path, query) => ({
        id: 1,
        name: query?.language === 'en-US' ? 'Hajime Isayama' : '諫山創',
        combined_credits: { crew: [] },
      }));

      expect(await getPersonDetails(1)).toMatchObject({
        name: 'Hajime Isayama',
        originalName: '諫山創',
      });
    });

    it('devolve null quando a pessoa não existe', async () => {
      vi.mocked(tmdbGet).mockRejectedValue(new TmdbRequestError(404, '/person/1'));

      expect(await getPersonDetails(1)).toBeNull();
    });
  });
});
