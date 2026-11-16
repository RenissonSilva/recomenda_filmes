'use client';

import { useEffect, useState } from 'react';

/** Devolve `value` só depois de `delayMs` sem mudanças (ex.: evita uma busca por tecla digitada). */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}
