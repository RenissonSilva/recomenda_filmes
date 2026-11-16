import { describe, expect, it } from 'vitest';

import { getMediaKey } from '@/domain/media';
import { buildMedia } from '@test/fixtures/media';

import { sanitizeLibraryData } from './library-schema';

describe('sanitizeLibraryData', () => {
  it('descarta só as entradas inválidas, preservando as demais', () => {
    const valid = buildMedia({ title: 'Válido' });
    const mismatched = buildMedia({ title: 'Chave errada' });

    const data = sanitizeLibraryData({
      ratings: {
        [getMediaKey(valid)]: { media: valid, value: 'love', ratedAt: '2026-01-01' },
        'movie:1': { media: valid, value: 'nota-inexistente', ratedAt: '2026-01-01' },
        [`movie:${mismatched.id + 1}`]: { media: mismatched, value: 'like', ratedAt: '2026-01-01' },
      },
      watchlist: 'não é um objeto',
    });

    expect(Object.keys(data.ratings)).toEqual([getMediaKey(valid)]);
    expect(data.watchlist).toEqual({});
    expect(data.unseen).toEqual({});
  });

  it('devolve uma biblioteca vazia para dados irreconhecíveis', () => {
    expect(sanitizeLibraryData(null)).toEqual({
      ratings: {},
      unseen: {},
      watchlist: {},
      dismissed: {},
    });
    expect(sanitizeLibraryData([1, 2, 3]).ratings).toEqual({});
  });
});
