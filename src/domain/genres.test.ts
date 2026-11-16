import { describe, expect, it } from 'vitest';

import { toCanonicalGenres, toTmdbGenreIds } from './genres';

describe('toCanonicalGenres', () => {
  it('unifica os gêneros de filmes e de séries', () => {
    // Filme: Ficção científica (878) + Fantasia (14); Série: Sci-Fi & Fantasy (10765)
    expect(toCanonicalGenres([878, 14]).sort()).toEqual(['fantasy', 'science-fiction']);
    expect(toCanonicalGenres([10765]).sort()).toEqual(['fantasy', 'science-fiction']);
  });

  it('ignora IDs desconhecidos e remove duplicados', () => {
    expect(toCanonicalGenres([28, 10759, 999999]).sort()).toEqual(['action', 'adventure']);
  });
});

describe('toTmdbGenreIds', () => {
  it('converte um gênero canônico nos IDs do tipo pedido', () => {
    expect(toTmdbGenreIds('science-fiction', 'movie')).toEqual([878]);
    expect(toTmdbGenreIds('science-fiction', 'tv')).toEqual([10765]);
    expect(toTmdbGenreIds('drama', 'tv')).toEqual([18]);
  });

  it('devolve lista vazia quando o tipo não tem o gênero', () => {
    expect(toTmdbGenreIds('horror', 'tv')).toEqual([]);
  });
});
