import { getMediaKey, toMediaSummary, type MediaKey, type MediaSummary } from './media';
import type { RatingValue } from './rating';

/**
 * Estado da biblioteca do usuário e suas transições.
 * Funções puras (sem React/armazenamento) para facilitar testes e manutenção.
 */

export interface RatedEntry {
  media: MediaSummary;
  value: RatingValue;
  ratedAt: string;
}

export interface SavedEntry {
  media: MediaSummary;
  savedAt: string;
}

export type EntryMap<T> = Partial<Record<MediaKey, T>>;

export interface LibraryData {
  /** Títulos avaliados (Odeio, Ruim, Bom, Ótimo). */
  ratings: EntryMap<RatedEntry>;
  /** Marcados como "Nunca vi": saem da lista de avaliação, mas podem ser recomendados. */
  unseen: EntryMap<SavedEntry>;
  /** Lista "Quero ver". */
  watchlist: EntryMap<SavedEntry>;
  /** "Não tenho interesse": nunca mais recomendados. */
  dismissed: EntryMap<SavedEntry>;
}

export const EMPTY_LIBRARY: LibraryData = {
  ratings: {},
  unseen: {},
  watchlist: {},
  dismissed: {},
};

function without<T>(entries: EntryMap<T>, key: MediaKey): EntryMap<T> {
  if (!(key in entries)) return entries;
  const next = { ...entries };
  delete next[key];
  return next;
}

/** Avaliar implica ter assistido: o título sai de "Nunca vi", "Quero ver" e "Não tenho interesse". */
export function rateTitle(
  data: LibraryData,
  media: MediaSummary,
  value: RatingValue,
  now: string,
): LibraryData {
  const key = getMediaKey(media);
  return {
    ratings: { ...data.ratings, [key]: { media: toMediaSummary(media), value, ratedAt: now } },
    unseen: without(data.unseen, key),
    watchlist: without(data.watchlist, key),
    dismissed: without(data.dismissed, key),
  };
}

export function removeRating(data: LibraryData, key: MediaKey): LibraryData {
  return { ...data, ratings: without(data.ratings, key) };
}

export function markUnseen(data: LibraryData, media: MediaSummary, now: string): LibraryData {
  const key = getMediaKey(media);
  return {
    ...data,
    ratings: without(data.ratings, key),
    unseen: { ...data.unseen, [key]: { media: toMediaSummary(media), savedAt: now } },
  };
}

export function unmarkUnseen(data: LibraryData, key: MediaKey): LibraryData {
  return { ...data, unseen: without(data.unseen, key) };
}

export function toggleWatchlist(data: LibraryData, media: MediaSummary, now: string): LibraryData {
  const key = getMediaKey(media);
  if (key in data.watchlist) return { ...data, watchlist: without(data.watchlist, key) };

  return {
    ...data,
    watchlist: { ...data.watchlist, [key]: { media: toMediaSummary(media), savedAt: now } },
    dismissed: without(data.dismissed, key),
  };
}

export function dismissTitle(data: LibraryData, media: MediaSummary, now: string): LibraryData {
  const key = getMediaKey(media);
  return {
    ...data,
    watchlist: without(data.watchlist, key),
    dismissed: { ...data.dismissed, [key]: { media: toMediaSummary(media), savedAt: now } },
  };
}

export function restoreDismissed(data: LibraryData, key: MediaKey): LibraryData {
  return { ...data, dismissed: without(data.dismissed, key) };
}

/** Entradas ordenadas da mais recente para a mais antiga. */
export function sortedEntries<T extends RatedEntry | SavedEntry>(entries: EntryMap<T>): T[] {
  const timestamp = (entry: T) => ('ratedAt' in entry ? entry.ratedAt : entry.savedAt);
  return Object.values(entries)
    .filter((entry): entry is T => entry !== undefined)
    .sort((a, b) => timestamp(b).localeCompare(timestamp(a)));
}
