'use client';

import { useState } from 'react';

import { useLibraryHydrated } from './hooks';
import type { LibraryData } from './library-state';
import { useLibraryStore } from './store';

/**
 * Captura um valor derivado da biblioteca uma única vez, assim que ela é carregada,
 * e só o atualiza quando `refresh` é chamado. Útil para listas que não devem
 * "pular" enquanto o usuário interage com elas.
 *
 * `select` deve ser uma função estável (declarada fora do componente).
 */
export function useLibrarySnapshot<T>(select: (data: LibraryData) => T) {
  const hydrated = useLibraryHydrated();
  const [snapshot, setSnapshot] = useState<{ value: T } | null>(null);

  // Ajuste de estado durante a renderização (padrão recomendado pelo React no lugar de um efeito).
  if (hydrated && snapshot === null) {
    setSnapshot({ value: select(useLibraryStore.getState()) });
  }

  const refresh = () => setSnapshot({ value: select(useLibraryStore.getState()) });

  return { snapshot: snapshot?.value ?? null, refresh };
}
