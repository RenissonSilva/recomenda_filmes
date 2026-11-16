import type { LibraryItem } from '@/domain/library-items';
import { parseMediaKey, toMediaSummary, type MediaKey } from '@/domain/media';

import type { LibraryItemRow, NewLibraryItemRow } from '../db/schema';

/** Conversão entre as linhas da tabela `library_item` e o `LibraryItem` do domínio. */

const toIso = (date: Date | null): string | null => date?.toISOString() ?? null;
const toDate = (value: string | null | undefined): Date | null => (value ? new Date(value) : null);

export function rowToLibraryItem(row: LibraryItemRow): [MediaKey, LibraryItem] | null {
  if (!parseMediaKey(row.mediaKey)) return null;

  return [
    row.mediaKey as MediaKey,
    {
      media: row.media,
      rating:
        row.rating && row.ratedAt
          ? { value: row.rating, ratedAt: row.ratedAt.toISOString() }
          : null,
      unseenAt: toIso(row.unseenAt),
      watchlistAt: toIso(row.watchlistAt),
      dismissedAt: toIso(row.dismissedAt),
    },
  ];
}

export function libraryItemToRow(
  userId: string,
  key: MediaKey,
  item: LibraryItem,
): NewLibraryItemRow {
  return {
    userId,
    mediaKey: key,
    media: toMediaSummary(item.media),
    rating: item.rating?.value ?? null,
    ratedAt: toDate(item.rating?.ratedAt),
    unseenAt: toDate(item.unseenAt),
    watchlistAt: toDate(item.watchlistAt),
    dismissedAt: toDate(item.dismissedAt),
  };
}
