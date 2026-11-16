import { z } from 'zod';

import type { EntryMap, LibraryData, RatedEntry, SavedEntry } from './library';
import {
  LIBRARY_CHANGES_BATCH_SIZE,
  libraryKeys,
  MAX_LIBRARY_ITEMS,
  type LibraryChange,
  type LibraryItem,
} from './library-items';
import { getMediaKey, type MediaKey } from './media';
import { mediaKeySchema, mediaSummarySchema, ratingValueSchema } from './schemas';

/** Data e hora em texto (ISO 8601), como `2026-11-16T12:00:00.000Z`. */
const timestampSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), { message: 'Data inválida.' });

export const ratedEntrySchema = z.object({
  media: mediaSummarySchema,
  value: ratingValueSchema,
  ratedAt: timestampSchema,
}) satisfies z.ZodType<RatedEntry>;

export const savedEntrySchema = z.object({
  media: mediaSummarySchema,
  savedAt: timestampSchema,
}) satisfies z.ZodType<SavedEntry>;

const LIST_NAMES = ['ratings', 'unseen', 'watchlist', 'dismissed'] as const;

/** Validação estrita (importação de backup e envio da biblioteca para a conta). */
export const libraryDataSchema = z
  .object({
    ratings: z.partialRecord(mediaKeySchema, ratedEntrySchema),
    unseen: z.partialRecord(mediaKeySchema, savedEntrySchema),
    watchlist: z.partialRecord(mediaKeySchema, savedEntrySchema),
    dismissed: z.partialRecord(mediaKeySchema, savedEntrySchema),
  })
  .superRefine((data, ctx) => {
    for (const list of LIST_NAMES) {
      for (const [key, entry] of Object.entries(data[list])) {
        if (entry && key !== getMediaKey(entry.media)) {
          ctx.addIssue({
            code: 'custom',
            path: [list, key],
            message: 'O identificador não corresponde ao título.',
          });
        }
      }
    }
  }) satisfies z.ZodType<LibraryData>;

export const libraryItemSchema = z
  .object({
    media: mediaSummarySchema,
    rating: z.object({ value: ratingValueSchema, ratedAt: timestampSchema }).nullable(),
    unseenAt: timestampSchema.nullable(),
    watchlistAt: timestampSchema.nullable(),
    dismissedAt: timestampSchema.nullable(),
  })
  .refine((item) => item.rating || item.unseenAt || item.watchlistAt || item.dismissedAt, {
    message: 'O título precisa estar em pelo menos uma lista.',
  }) satisfies z.ZodType<LibraryItem>;

export const libraryChangeSchema = z
  .object({ key: mediaKeySchema, item: libraryItemSchema.nullable() })
  .refine((change) => change.item === null || getMediaKey(change.item.media) === change.key, {
    message: 'O identificador não corresponde ao título.',
  }) satisfies z.ZodType<LibraryChange>;

/** Corpo de `PATCH /api/library`. */
export const libraryChangesRequestSchema = z.object({
  changes: z.array(libraryChangeSchema).min(1).max(LIBRARY_CHANGES_BATCH_SIZE),
});

/** Corpo de `POST /api/library/merge`. */
export const libraryMergeRequestSchema = z.object({
  library: libraryDataSchema.refine((data) => libraryKeys(data).size <= MAX_LIBRARY_ITEMS, {
    message: 'A biblioteca tem títulos demais.',
  }),
});

/**
 * Validação tolerante (usada ao ler o localStorage): descarta só as entradas
 * inválidas, para que um dado corrompido não apague a biblioteca inteira.
 */
export function sanitizeLibraryData(value: unknown): LibraryData {
  const source = isRecord(value) ? value : {};
  return {
    ratings: sanitizeEntries(source.ratings, ratedEntrySchema),
    unseen: sanitizeEntries(source.unseen, savedEntrySchema),
    watchlist: sanitizeEntries(source.watchlist, savedEntrySchema),
    dismissed: sanitizeEntries(source.dismissed, savedEntrySchema),
  };
}

function sanitizeEntries<T extends RatedEntry | SavedEntry>(
  value: unknown,
  schema: z.ZodType<T>,
): EntryMap<T> {
  if (!isRecord(value)) return {};

  const entries: EntryMap<T> = {};
  for (const [key, entry] of Object.entries(value)) {
    const parsed = schema.safeParse(entry);
    if (parsed.success && key === getMediaKey(parsed.data.media)) {
      entries[key as MediaKey] = parsed.data;
    }
  }
  return entries;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
