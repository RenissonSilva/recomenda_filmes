import { beforeEach, describe, expect, it, vi } from 'vitest';

import { discoverPopularTitles, discoverTopRatedByGenres, searchTitles } from './catalog';
import { tmdbGet } from './client';
import type { TmdbListItem, TmdbMultiSearchItem, TmdbPaginated } from './types';

vi.mock('next/cache', () => ({ cacheLife: vi.fn() }));
vi.mock('./client', () => ({ tmdbGet: vi.fn() }));

const ANIMATION = 16;
const DRAMA = 18;

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

  describe('discoverPopularTitles', () => {
    it('em "Animes", junta séries e filmes de animação japonesa', async () => {
      mockTmdb({
        '/discover/tv': page([series(1, [ANIMATION], 'ja')], 8),
        '/discover/movie': page([movie(2, [ANIMATION], 'ja')], 5),
      });

      const result = await discoverPopularTitles('anime', 1);

      expect(idsOf(result.items)).toEqual(['tv:1', 'movie:2']);
      expect(result.totalPages).toBe(5);
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

      const result = await discoverPopularTitles('tv', 1);

      // Animação ocidental continua em "Séries"; só a japonesa vai para "Animes".
      expect(idsOf(result.items)).toEqual(['tv:1', 'tv:3']);
      expect(queryOf('/discover/tv')).not.toHaveProperty('with_original_language', 'ja');
    });

    it('em "Tudo", intercala filmes e séries, incluindo animes', async () => {
      mockTmdb({
        '/discover/movie': page([movie(1), movie(3)]),
        '/discover/tv': page([series(2, [ANIMATION], 'ja')]),
      });

      const result = await discoverPopularTitles('all', 1);

      expect(idsOf(result.items)).toEqual(['movie:1', 'tv:2', 'movie:3']);
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
});
