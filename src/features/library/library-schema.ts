import { z } from 'zod';

import { getMediaKey, type MediaKey } from '@/domain/media';
import { mediaKeySchema, mediaSummarySchema, ratingValueSchema } from '@/domain/schemas';

import type { EntryMap, LibraryData, RatedEntry, SavedEntry } from './library-state';

export const ratedEntrySchema = z.object({
  media: mediaSummarySchema,
  value: ratingValueSchema,
  ratedAt: z.string(),
}) satisfies z.ZodType<RatedEntry>;

export const savedEntrySchema = z.object({
  media: mediaSummarySchema,
  savedAt: z.string(),
}) satisfies z.ZodType<SavedEntry>;

/** Validação estrita (usada na importação de backup). */
export const libraryDataSchema = z.object({
  ratings: z.partialRecord(mediaKeySchema, ratedEntrySchema),
  unseen: z.partialRecord(mediaKeySchema, savedEntrySchema),
  watchlist: z.partialRecord(mediaKeySchema, savedEntrySchema),
  dismissed: z.partialRecord(mediaKeySchema, savedEntrySchema),
}) satisfies z.ZodType<LibraryData>;

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
