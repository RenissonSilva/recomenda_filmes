import { describe, expect, it } from 'vitest';

import type { LibraryItem } from '@/domain/library-items';
import { getMediaKey } from '@/domain/media';
import { buildMedia } from '@test/fixtures/media';

import type { LibraryItemRow } from '../db/schema';
import { libraryItemToRow, rowToLibraryItem } from './mappers';

describe('mappers da biblioteca', () => {
  const media = buildMedia({ title: 'Duna' });
  const key = getMediaKey(media);
  const item: LibraryItem = {
    media,
    rating: { value: 'love', ratedAt: '2026-11-16T12:00:00.000Z' },
    unseenAt: null,
    watchlistAt: null,
    dismissedAt: null,
  };

  it('converte título → linha → título sem perder dados', () => {
    const row = libraryItemToRow('user-1', key, item);
    expect(row).toMatchObject({ userId: 'user-1', mediaKey: key, rating: 'love' });
    expect(row.ratedAt).toEqual(new Date(item.rating!.ratedAt));

    const stored: LibraryItemRow = { ...row, updatedAt: new Date() } as LibraryItemRow;
    expect(rowToLibraryItem(stored)).toEqual([key, item]);
  });

  it('ignora linhas com identificador inválido', () => {
    const row = { ...libraryItemToRow('user-1', key, item), mediaKey: 'livro:1' };
    expect(rowToLibraryItem({ ...row, updatedAt: new Date() } as LibraryItemRow)).toBeNull();
  });
});
