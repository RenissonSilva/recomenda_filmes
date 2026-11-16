import { describe, expect, it } from 'vitest';

import { getMediaKey } from '@/domain/media';
import { buildMedia } from '@test/fixtures/media';

import {
  libraryChangesRequestSchema,
  libraryDataSchema,
  sanitizeLibraryData,
} from './library-schema';

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

describe('schemas de sincronização', () => {
  const media = buildMedia({ title: 'Duna' });
  const key = getMediaKey(media);
  const item = {
    media,
    rating: { value: 'love', ratedAt: '2026-11-16T12:00:00.000Z' },
    unseenAt: null,
    watchlistAt: null,
    dismissedAt: null,
  };

  it('aceita alterações válidas, inclusive remoções', () => {
    const result = libraryChangesRequestSchema.safeParse({
      changes: [
        { key, item },
        { key: 'tv:1', item: null },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejeita título fora de qualquer lista, data inválida ou chave que não bate', () => {
    const parse = (change: unknown) =>
      libraryChangesRequestSchema.safeParse({ changes: [change] }).success;

    expect(parse({ key, item: { ...item, rating: null } })).toBe(false);
    expect(parse({ key, item: { ...item, rating: { value: 'love', ratedAt: 'ontem' } } })).toBe(
      false,
    );
    expect(parse({ key: 'movie:1', item })).toBe(false);
    expect(libraryChangesRequestSchema.safeParse({ changes: [] }).success).toBe(false);
  });

  it('rejeita bibliotecas com chaves que não correspondem ao título', () => {
    const library = {
      ratings: { 'movie:1': { media, value: 'like', ratedAt: item.rating.ratedAt } },
    };
    const valid = { ratings: { [key]: { media, value: 'like', ratedAt: item.rating.ratedAt } } };
    const withLists = (ratings: object) => ({ ratings, unseen: {}, watchlist: {}, dismissed: {} });

    expect(libraryDataSchema.safeParse(withLists(library.ratings)).success).toBe(false);
    expect(libraryDataSchema.safeParse(withLists(valid.ratings)).success).toBe(true);
  });
});
