'use client';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import type { LibrarySyncChoice } from '@/features/library/sync/library-sync';
import { pluralize } from '@/lib/format';

interface MergeLibraryDialogProps {
  open: boolean;
  /** Títulos deste navegador que não estão (ou estão diferentes) na conta. */
  localCount: number;
  /** Escolha em andamento (`null` = nenhuma). */
  pendingChoice: LibrarySyncChoice | null;
  onChoose: (choice: LibrarySyncChoice) => void;
}

/**
 * Pergunta o que fazer com as avaliações feitas sem login quando a conta já tem dados.
 * É uma decisão obrigatória: o diálogo só fecha com uma das escolhas.
 */
export function MergeLibraryDialog({
  open,
  localCount,
  pendingChoice,
  onChoose,
}: MergeLibraryDialogProps) {
  const busy = pendingChoice !== null;

  return (
    <Dialog
      open={open}
      dismissible={false}
      title="Juntar com as avaliações da sua conta?"
      description={
        <>
          <p>
            Este navegador tem {pluralize(localCount, 'título', 'títulos')} (avaliações e listas)
            feitos antes de você entrar que ainda não estão na sua conta.
          </p>
          <p className="mt-2">
            Ao juntar, quando o mesmo título estiver nos dois, vale a ação mais recente.
          </p>
        </>
      }
      actions={
        <>
          <Button variant="ghost" disabled={busy} onClick={() => onChoose('discard-local')}>
            {pendingChoice === 'discard-local' && <Spinner label="Descartando" />}
            Descartar os deste navegador
          </Button>
          <Button disabled={busy} onClick={() => onChoose('merge')}>
            {pendingChoice === 'merge' && <Spinner label="Juntando" className="text-brand-fg" />}
            Juntar com a conta
          </Button>
        </>
      }
    />
  );
}
