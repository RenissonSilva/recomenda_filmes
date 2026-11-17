import { describe, expect, it } from 'vitest';

import { CANONICAL_GENRES } from '@/domain/genres';

import { parseExploreParams, routes } from './routes';
import { slugify } from './slug';

describe('slugify', () => {
  it('remove acentos, troca espaços e símbolos por hífen e usa minúsculas', () => {
    expect(slugify('Ficção científica')).toBe('ficcao-cientifica');
    expect(slugify('  Ação & Aventura! ')).toBe('acao-aventura');
    expect(slugify('Séries')).toBe('series');
  });
});

describe('rotas da página "Explorar"', () => {
  it('monta a URL em português, omitindo seção e ordem padrão', () => {
    expect(routes.exploreGenre({ genre: 'science-fiction' })).toBe(
      '/explorar?genero=ficcao-cientifica',
    );
    expect(routes.exploreGenre({ genre: 'action', filter: 'anime', sort: 'rating' })).toBe(
      '/explorar?genero=acao&secao=animes&ordem=nota',
    );
    expect(routes.exploreGenre({ genre: 'drama', filter: 'all', sort: 'recent' })).toBe(
      '/explorar?genero=drama&ordem=mais-recentes',
    );
  });

  it('lê de volta os parâmetros da URL', () => {
    expect(parseExploreParams({ genero: 'acao', secao: 'animes', ordem: 'nota' })).toEqual({
      genre: 'action',
      filter: 'anime',
      sort: 'rating',
    });
  });

  it('usa o padrão para parâmetros ausentes, repetidos ou inválidos', () => {
    expect(parseExploreParams({ genero: 'inexistente', secao: ['filmes', 'series'] })).toEqual({
      genre: null,
      filter: 'all',
      sort: 'popularity',
    });
  });

  it('cada gênero tem um parâmetro próprio que volta para o mesmo gênero', () => {
    for (const genre of CANONICAL_GENRES) {
      const url = new URL(routes.exploreGenre({ genre }), 'http://localhost');
      expect(parseExploreParams(Object.fromEntries(url.searchParams)).genre).toBe(genre);
    }
  });
});
