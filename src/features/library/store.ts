import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  EMPTY_LIBRARY,
  dismissTitle,
  markUnseen,
  rateTitle,
  removeRating,
  restoreDismissed,
  toggleWatchlist,
  unmarkUnseen,
  type LibraryData,
} from '@/domain/library';
import {
  changedLibraryKeys,
  getLibraryItem,
  overlayLibraryItems,
  sameLibraryItem,
  type LibraryChange,
} from '@/domain/library-items';
import { sanitizeLibraryData } from '@/domain/library-schema';
import type { MediaKey, MediaSummary } from '@/domain/media';
import type { RatingValue } from '@/domain/rating';

import { LOCAL_SYNC_STATE, sanitizeSyncState, type LibrarySyncState } from './sync/sync-state';

export const LIBRARY_STORAGE_KEY = 'recomenda-filmes:library';
const LIBRARY_STORAGE_VERSION = 2;

interface LibraryActions {
  rate: (media: MediaSummary, value: RatingValue) => void;
  removeRating: (key: MediaKey) => void;
  markUnseen: (media: MediaSummary) => void;
  unmarkUnseen: (key: MediaKey) => void;
  toggleWatchlist: (media: MediaSummary) => void;
  dismiss: (media: MediaSummary) => void;
  restoreDismissed: (key: MediaKey) => void;
  /** Substitui toda a biblioteca (importação de backup). */
  replaceAll: (data: LibraryData) => void;
  clear: () => void;
}

/** Ações usadas apenas pela sincronização com a conta (ver `sync/library-sync.ts`). */
interface LibrarySyncActions {
  /**
   * Passa a exibir a biblioteca da conta `ownerId`, preservando a situação local dos
   * títulos em `keepLocalKeys` (alterações feitas enquanto a conta era consultada).
   */
  applyAccountLibrary: (
    ownerId: string,
    account: LibraryData,
    keepLocalKeys: readonly MediaKey[],
  ) => void;
  /** Marca como salvas as alterações confirmadas pelo servidor (se não mudaram desde o envio). */
  acknowledgeChanges: (changes: readonly LibraryChange[]) => void;
  /** Esvazia o navegador e volta ao modo local (ao sair da conta). */
  resetLocal: () => void;
}

export type LibraryState = LibraryData & { sync: LibrarySyncState } & LibraryActions &
  LibrarySyncActions;

const now = () => new Date().toISOString();

export function selectLibraryData(state: LibraryData): LibraryData {
  const { ratings, unseen, watchlist, dismissed } = state;
  return { ratings, unseen, watchlist, dismissed };
}

function addKeys(keys: readonly MediaKey[], added: readonly MediaKey[]): MediaKey[] {
  return [...new Set([...keys, ...added])];
}

/**
 * Biblioteca do usuário, persistida no `localStorage`. Com login, ela funciona como uma cópia
 * local da conta: cada alteração entra em `sync.pendingKeys` até ser salva no servidor.
 *
 * A hidratação é manual (`skipHydration`) para que a primeira renderização no cliente
 * seja igual à do servidor — ver `LibraryHydrator` e `useLibraryHydrated`.
 */
export const useLibraryStore = create<LibraryState>()(
  persist(
    (set) => {
      /** Aplica uma transição e, com login, registra os títulos alterados para envio. */
      const update = (transition: (data: LibraryData) => LibraryData) =>
        set((state) => {
          const next = selectLibraryData(transition(selectLibraryData(state)));
          if (state.sync.ownerId === null) return next;

          const changed = changedLibraryKeys(state, next);
          if (changed.length === 0) return next;
          return {
            ...next,
            sync: { ...state.sync, pendingKeys: addKeys(state.sync.pendingKeys, changed) },
          };
        });

      return {
        ...EMPTY_LIBRARY,
        sync: LOCAL_SYNC_STATE,
        rate: (media, value) => update((data) => rateTitle(data, media, value, now())),
        removeRating: (key) => update((data) => removeRating(data, key)),
        markUnseen: (media) => update((data) => markUnseen(data, media, now())),
        unmarkUnseen: (key) => update((data) => unmarkUnseen(data, key)),
        toggleWatchlist: (media) => update((data) => toggleWatchlist(data, media, now())),
        dismiss: (media) => update((data) => dismissTitle(data, media, now())),
        restoreDismissed: (key) => update((data) => restoreDismissed(data, key)),
        replaceAll: (data) => update(() => data),
        clear: () => update(() => EMPTY_LIBRARY),

        applyAccountLibrary: (ownerId, account, keepLocalKeys) =>
          set((state) => {
            const pendingKeys = addKeys(
              state.sync.ownerId === ownerId ? state.sync.pendingKeys : [],
              keepLocalKeys,
            );
            return {
              ...overlayLibraryItems(account, state, pendingKeys),
              sync: { ownerId, pendingKeys },
            };
          }),
        acknowledgeChanges: (changes) =>
          set((state) => {
            const saved = new Set(
              changes
                .filter((change) => sameLibraryItem(getLibraryItem(state, change.key), change.item))
                .map((change) => change.key),
            );
            if (saved.size === 0) return state;
            return {
              sync: {
                ...state.sync,
                pendingKeys: state.sync.pendingKeys.filter((key) => !saved.has(key)),
              },
            };
          }),
        resetLocal: () => set({ ...EMPTY_LIBRARY, sync: LOCAL_SYNC_STATE }),
      };
    },
    {
      name: LIBRARY_STORAGE_KEY,
      version: LIBRARY_STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({ ...selectLibraryData(state), sync: state.sync }),
      // Versão 1 (antes das contas): só a biblioteca, sempre local. O `merge` completa o resto.
      migrate: (persisted) => persisted,
      merge: (persisted, current) => ({
        ...current,
        ...sanitizeLibraryData(persisted),
        sync: sanitizeSyncState((persisted as { sync?: unknown } | undefined)?.sync),
      }),
    },
  ),
);
