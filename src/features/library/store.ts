import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { MediaKey, MediaSummary } from '@/domain/media';
import type { RatingValue } from '@/domain/rating';

import { sanitizeLibraryData } from './library-schema';
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
} from './library-state';

export const LIBRARY_STORAGE_KEY = 'recomenda-filmes:library';
const LIBRARY_STORAGE_VERSION = 1;

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

export type LibraryState = LibraryData & LibraryActions;

const now = () => new Date().toISOString();

/**
 * Biblioteca do usuário, persistida no `localStorage` (o app não tem login).
 * A hidratação é manual (`skipHydration`) para que a primeira renderização no cliente
 * seja igual à do servidor — ver `LibraryHydrator` e `useLibraryHydrated`.
 */
export const useLibraryStore = create<LibraryState>()(
  persist(
    (set) => ({
      ...EMPTY_LIBRARY,
      rate: (media, value) => set((state) => rateTitle(state, media, value, now())),
      removeRating: (key) => set((state) => removeRating(state, key)),
      markUnseen: (media) => set((state) => markUnseen(state, media, now())),
      unmarkUnseen: (key) => set((state) => unmarkUnseen(state, key)),
      toggleWatchlist: (media) => set((state) => toggleWatchlist(state, media, now())),
      dismiss: (media) => set((state) => dismissTitle(state, media, now())),
      restoreDismissed: (key) => set((state) => restoreDismissed(state, key)),
      replaceAll: (data) => set(data),
      clear: () => set(EMPTY_LIBRARY),
    }),
    {
      name: LIBRARY_STORAGE_KEY,
      version: LIBRARY_STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: ({ ratings, unseen, watchlist, dismissed }): LibraryData => ({
        ratings,
        unseen,
        watchlist,
        dismissed,
      }),
      merge: (persisted, current) => ({ ...current, ...sanitizeLibraryData(persisted) }),
    },
  ),
);
