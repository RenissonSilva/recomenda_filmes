'use client';

import { Alert } from '@/components/ui/alert';
import { useLibraryCounts, useLibraryHydrated } from '@/features/library/hooks';
import { useLibraryStore } from '@/features/library/store';
import { pluralize } from '@/lib/format';

/** No cadastro: avisa que as avaliações feitas neste navegador irão para a nova conta. */
export function LocalLibraryNotice() {
  const hydrated = useLibraryHydrated();
  const { ratings } = useLibraryCounts();
  const isLocal = useLibraryStore((state) => state.sync.ownerId === null);

  if (!hydrated || !isLocal || ratings === 0) return null;

  return (
    <Alert tone="info" className="mb-6">
      {ratings === 1
        ? 'A avaliação que você fez neste navegador será salva na sua nova conta.'
        : `As ${pluralize(ratings, 'avaliação', 'avaliações')} que você fez neste navegador serão salvas na sua nova conta.`}
    </Alert>
  );
}
