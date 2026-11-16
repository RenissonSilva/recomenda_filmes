'use client';

import { useEffect } from 'react';

import { LIBRARY_STORAGE_KEY, useLibraryStore } from '../store';

/**
 * Carrega a biblioteca do `localStorage` após a hidratação do React e mantém
 * as abas sincronizadas (uma avaliação feita em outra aba aparece nesta).
 */
export function LibraryHydrator() {
  useEffect(() => {
    void useLibraryStore.persist.rehydrate();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === LIBRARY_STORAGE_KEY) void useLibraryStore.persist.rehydrate();
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return null;
}
