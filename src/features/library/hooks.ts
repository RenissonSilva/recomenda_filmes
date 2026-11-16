'use client';

import { useSyncExternalStore } from 'react';
import { useShallow } from 'zustand/react/shallow';

import type { MediaKey } from '@/domain/media';
import type { RatingValue } from '@/domain/rating';

import { useLibraryStore } from './store';

const subscribeToHydration = (onChange: () => void) =>
  useLibraryStore.persist.onFinishHydration(onChange);

/**
 * `true` depois que a biblioteca foi lida do `localStorage`.
 * Antes disso, telas que dependem dela devem mostrar um estado de carregamento.
 */
export function useLibraryHydrated(): boolean {
  return useSyncExternalStore(
    subscribeToHydration,
    () => useLibraryStore.persist.hasHydrated(),
    () => false,
  );
}

export function useRatingOf(key: MediaKey): RatingValue | null {
  return useLibraryStore((state) => state.ratings[key]?.value ?? null);
}

export function useIsUnseen(key: MediaKey): boolean {
  return useLibraryStore((state) => key in state.unseen);
}

export function useIsInWatchlist(key: MediaKey): boolean {
  return useLibraryStore((state) => key in state.watchlist);
}

export function useLibraryCounts() {
  return useLibraryStore(
    useShallow((state) => ({
      ratings: Object.keys(state.ratings).length,
      unseen: Object.keys(state.unseen).length,
      watchlist: Object.keys(state.watchlist).length,
      dismissed: Object.keys(state.dismissed).length,
    })),
  );
}

/** Ações da biblioteca (referências estáveis — não causam re-renderização). */
export function useLibraryActions() {
  return useLibraryStore(
    useShallow((state) => ({
      rate: state.rate,
      removeRating: state.removeRating,
      markUnseen: state.markUnseen,
      unmarkUnseen: state.unmarkUnseen,
      toggleWatchlist: state.toggleWatchlist,
      dismiss: state.dismiss,
      restoreDismissed: state.restoreDismissed,
      replaceAll: state.replaceAll,
      clear: state.clear,
    })),
  );
}
