import { describe, expect, it } from 'vitest';

import { interleave, uniqueBy } from './array';
import { mapWithConcurrency } from './async';
import { formatList, formatRuntime, formatVoteAverage, pluralize } from './format';
import { hashString } from './hash';
import { tmdbImageLoader } from './tmdb-image';

describe('array', () => {
  it('uniqueBy mantém a primeira ocorrência', () => {
    expect(
      uniqueBy(
        [
          { id: 1, v: 'a' },
          { id: 1, v: 'b' },
          { id: 2, v: 'c' },
        ],
        (item) => item.id,
      ),
    ).toEqual([
      { id: 1, v: 'a' },
      { id: 2, v: 'c' },
    ]);
  });

  it('interleave intercala listas de tamanhos diferentes', () => {
    expect(interleave([1, 3, 5, 7], [2, 4])).toEqual([1, 2, 3, 4, 5, 7]);
  });
});

describe('mapWithConcurrency', () => {
  it('preserva a ordem e respeita o limite de execuções simultâneas', async () => {
    let running = 0;
    let maxRunning = 0;

    const result = await mapWithConcurrency([30, 10, 20, 5, 15], 2, async (delay, index) => {
      running++;
      maxRunning = Math.max(maxRunning, running);
      await new Promise((resolve) => setTimeout(resolve, delay));
      running--;
      return index;
    });

    expect(result).toEqual([0, 1, 2, 3, 4]);
    expect(maxRunning).toBe(2);
  });

  it('lida com lista vazia', async () => {
    await expect(mapWithConcurrency([], 4, async () => 1)).resolves.toEqual([]);
  });
});

describe('format', () => {
  it('formata duração, nota, listas e plurais em pt-BR', () => {
    expect(formatRuntime(169)).toBe('2h 49min');
    expect(formatRuntime(120)).toBe('2h');
    expect(formatRuntime(45)).toBe('45min');
    expect(formatRuntime(null)).toBeNull();
    expect(formatVoteAverage(8.456)).toBe('8,5');
    expect(formatList(['Duna', 'Dark', 'Arcane'])).toBe('Duna, Dark e Arcane');
    expect(pluralize(1, 'título', 'títulos')).toBe('1 título');
    expect(pluralize(3, 'título', 'títulos')).toBe('3 títulos');
  });
});

describe('hashString', () => {
  it('é determinístico e sensível ao conteúdo', () => {
    expect(hashString('movie:1=love')).toBe(hashString('movie:1=love'));
    expect(hashString('movie:1=love')).not.toBe(hashString('movie:1=like'));
  });
});

describe('tmdbImageLoader', () => {
  it('usa o menor tamanho do CDN que cobre a largura pedida', () => {
    expect(tmdbImageLoader({ src: '/a.jpg', width: 300 })).toBe(
      'https://image.tmdb.org/t/p/w300/a.jpg',
    );
    expect(tmdbImageLoader({ src: '/a.jpg', width: 384 })).toBe(
      'https://image.tmdb.org/t/p/w500/a.jpg',
    );
    expect(tmdbImageLoader({ src: '/a.jpg', width: 3840 })).toBe(
      'https://image.tmdb.org/t/p/original/a.jpg',
    );
  });
});
