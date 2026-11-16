import type { EntryMap, LibraryData, RatedEntry, SavedEntry } from './library';
import type { MediaKey, MediaSummary } from './media';
import type { RatingValue } from './rating';

/**
 * Visão "por título" da biblioteca, usada para sincronizá-la com a conta do usuário.
 *
 * No navegador, a biblioteca é organizada por lista (avaliações, Nunca vi, Quero ver e
 * dispensados). Na conta, cada título é guardado uma única vez, com a sua situação em todas
 * as listas: o `LibraryItem`. Como toda ação do usuário altera um único título, sincronizar
 * item a item é suficiente — e permite juntar bibliotecas título a título.
 */

export interface LibraryItem {
  media: MediaSummary;
  rating: { value: RatingValue; ratedAt: string } | null;
  unseenAt: string | null;
  watchlistAt: string | null;
  dismissedAt: string | null;
}

/** Alteração de um título: o novo estado, ou `null` quando ele saiu da biblioteca. */
export interface LibraryChange {
  key: MediaKey;
  item: LibraryItem | null;
}

/** Máximo de alterações enviadas por requisição. */
export const LIBRARY_CHANGES_BATCH_SIZE = 100;

/** Limite de títulos aceitos de uma vez (ao juntar a biblioteca do navegador com a da conta). */
export const MAX_LIBRARY_ITEMS = 20_000;

const LISTS = ['ratings', 'unseen', 'watchlist', 'dismissed'] as const;

function keysOf(entries: EntryMap<unknown>): MediaKey[] {
  return Object.keys(entries) as MediaKey[];
}

/** Todos os títulos presentes em alguma lista. */
export function libraryKeys(data: LibraryData): Set<MediaKey> {
  return new Set(LISTS.flatMap((list) => keysOf(data[list])));
}

export function isLibraryEmpty(data: LibraryData): boolean {
  return LISTS.every((list) => keysOf(data[list]).length === 0);
}

export function getLibraryItem(data: LibraryData, key: MediaKey): LibraryItem | null {
  const rated = data.ratings[key];
  const unseen = data.unseen[key];
  const watchlist = data.watchlist[key];
  const dismissed = data.dismissed[key];

  const media = (rated ?? unseen ?? watchlist ?? dismissed)?.media;
  if (!media) return null;

  return {
    media,
    rating: rated ? { value: rated.value, ratedAt: rated.ratedAt } : null,
    unseenAt: unseen?.savedAt ?? null,
    watchlistAt: watchlist?.savedAt ?? null,
    dismissedAt: dismissed?.savedAt ?? null,
  };
}

/** Cópias mutáveis das listas, para montar uma nova biblioteca sem custo quadrático. */
function cloneLists(data: LibraryData): LibraryData {
  return {
    ratings: { ...data.ratings },
    unseen: { ...data.unseen },
    watchlist: { ...data.watchlist },
    dismissed: { ...data.dismissed },
  };
}

function savedEntry(media: MediaSummary, savedAt: string | null): SavedEntry | undefined {
  return savedAt === null ? undefined : { media, savedAt };
}

/** Grava (mutando `target`) a situação de um título em todas as listas. */
function writeItem(target: LibraryData, key: MediaKey, item: LibraryItem | null) {
  const entries: { [List in (typeof LISTS)[number]]: RatedEntry | SavedEntry | undefined } = {
    ratings: item?.rating ? { media: item.media, ...item.rating } : undefined,
    unseen: item ? savedEntry(item.media, item.unseenAt) : undefined,
    watchlist: item ? savedEntry(item.media, item.watchlistAt) : undefined,
    dismissed: item ? savedEntry(item.media, item.dismissedAt) : undefined,
  };

  for (const list of LISTS) {
    const entry = entries[list];
    const map = target[list] as EntryMap<RatedEntry | SavedEntry>;
    if (entry) map[key] = entry;
    else delete map[key];
  }
}

/** Monta a biblioteca a partir dos títulos (ex.: linhas vindas do banco). */
export function libraryFromItems(items: Iterable<readonly [MediaKey, LibraryItem]>): LibraryData {
  const data = cloneLists({ ratings: {}, unseen: {}, watchlist: {}, dismissed: {} });
  for (const [key, item] of items) writeItem(data, key, item);
  return data;
}

export function libraryItems(data: LibraryData): Array<[MediaKey, LibraryItem]> {
  return [...libraryKeys(data)].flatMap((key) => {
    const item = getLibraryItem(data, key);
    return item ? [[key, item] as [MediaKey, LibraryItem]] : [];
  });
}

/** Copia para `base` a situação que os títulos `keys` têm em `source` (inclusive a ausência). */
export function overlayLibraryItems(
  base: LibraryData,
  source: LibraryData,
  keys: Iterable<MediaKey>,
): LibraryData {
  const result = cloneLists(base);
  for (const key of keys) writeItem(result, key, getLibraryItem(source, key));
  return result;
}

function sameInstant(a: string | null, b: string | null): boolean {
  if (a === b) return true;
  return a !== null && b !== null && Date.parse(a) === Date.parse(b);
}

/** Compara a situação de dois títulos (os dados do título em si, como o pôster, não contam). */
export function sameLibraryItem(a: LibraryItem | null, b: LibraryItem | null): boolean {
  if (a === null || b === null) return a === b;
  return (
    a.rating?.value === b.rating?.value &&
    sameInstant(a.rating?.ratedAt ?? null, b.rating?.ratedAt ?? null) &&
    sameInstant(a.unseenAt, b.unseenAt) &&
    sameInstant(a.watchlistAt, b.watchlistAt) &&
    sameInstant(a.dismissedAt, b.dismissedAt)
  );
}

/** Momento da ação mais recente sobre o título (em milissegundos). */
export function libraryItemUpdatedAt(item: LibraryItem): number {
  const timestamps = [item.rating?.ratedAt, item.unseenAt, item.watchlistAt, item.dismissedAt];
  return Math.max(
    ...timestamps.map((value) => (value ? Date.parse(value) : Number.NEGATIVE_INFINITY)),
  );
}

/** Títulos cuja situação mudou de `prev` para `next`. */
export function changedLibraryKeys(prev: LibraryData, next: LibraryData): MediaKey[] {
  const candidates = new Set<MediaKey>();
  for (const list of LISTS) {
    const before = prev[list];
    const after = next[list];
    if (before === after) continue;
    for (const key of [...keysOf(before), ...keysOf(after)]) {
      if (before[key] !== after[key]) candidates.add(key);
    }
  }
  return [...candidates].filter(
    (key) => !sameLibraryItem(getLibraryItem(prev, key), getLibraryItem(next, key)),
  );
}

/** Quantos títulos de `incoming` não estão em `base` (ou estão numa situação diferente). */
export function countItemsMissingFrom(base: LibraryData, incoming: LibraryData): number {
  let count = 0;
  for (const key of libraryKeys(incoming)) {
    if (!sameLibraryItem(getLibraryItem(base, key), getLibraryItem(incoming, key))) count++;
  }
  return count;
}

/**
 * Junta duas bibliotecas título a título. Quando o mesmo título está nas duas,
 * vale a situação com a ação mais recente (em caso de empate, a de `incoming`).
 */
export function mergeLibraries(base: LibraryData, incoming: LibraryData): LibraryData {
  const keys = new Set([...libraryKeys(base), ...libraryKeys(incoming)]);

  const merged = [...keys].flatMap((key): Array<[MediaKey, LibraryItem]> => {
    const current = getLibraryItem(base, key);
    const candidate = getLibraryItem(incoming, key);
    const winner =
      current && candidate
        ? libraryItemUpdatedAt(candidate) >= libraryItemUpdatedAt(current)
          ? candidate
          : current
        : (candidate ?? current);
    return winner ? [[key, winner]] : [];
  });

  return libraryFromItems(merged);
}

/** Resposta de `GET /api/library` e `POST /api/library/merge`. */
export interface LibraryResponse {
  library: LibraryData;
}
