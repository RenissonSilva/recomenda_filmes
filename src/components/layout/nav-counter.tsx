'use client';

import type { NavItem } from '@/config/navigation';
import { useLibraryCounts, useLibraryHydrated } from '@/features/library/hooks';
import { cn } from '@/lib/cn';

/** Contador ao lado de um item de navegação (ex.: total de avaliações). */
export function NavCounter({
  counter,
  className,
}: {
  counter: NonNullable<NavItem['counter']>;
  className?: string;
}) {
  const hydrated = useLibraryHydrated();
  const counts = useLibraryCounts();
  const value = counts[counter];

  if (!hydrated || value === 0) return null;

  return (
    <span
      className={cn(
        'min-w-5 rounded-full bg-surface-2 px-1.5 text-center text-[11px] leading-5 font-semibold text-fg-muted tabular-nums',
        className,
      )}
    >
      {value > 99 ? '99+' : value}
    </span>
  );
}
