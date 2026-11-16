'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useCurrentUser } from '@/features/auth/hooks';
import { useLibraryHydrated } from '@/features/library/hooks';
import { useLibraryStore } from '@/features/library/store';
import { isUnauthorizedError, type LibrarySyncChoice } from '@/features/library/sync/library-sync';

import { librarySync } from '../library-sync';
import { importedTitlesMessage } from '../messages';
import { MergeLibraryDialog } from './merge-library-dialog';

interface PendingDecision {
  userId: string;
  localCount: number;
}

/**
 * Liga a sessão à sincronização da biblioteca:
 * - ao entrar (ou abrir o app logado), conecta à conta e, se preciso, pergunta se deve juntar
 *   os dados do navegador;
 * - quando a sessão termina (logout em outra aba, expiração), tira os dados da conta do navegador;
 * - envia as pendências ao ocultar a página e busca novidades ao voltar a ela.
 */
export function LibrarySyncManager() {
  const hydrated = useLibraryHydrated();
  const { user, status } = useCurrentUser();
  const userId = user?.id ?? null;

  const [decision, setDecision] = useState<PendingDecision | null>(null);
  const [pendingChoice, setPendingChoice] = useState<LibrarySyncChoice | null>(null);

  useEffect(() => {
    // Sem saber se há sessão (carregando ou servidor indisponível), nada muda.
    if (!hydrated || status === 'loading' || status === 'unavailable') return;

    if (userId === null) {
      librarySync.disconnect();
      const library = useLibraryStore.getState();
      if (library.sync.ownerId !== null) library.resetLocal();
      return;
    }

    let active = true;
    librarySync
      .connect(userId)
      .then((result) => {
        if (!active) return;
        if (result.status === 'needs-decision') {
          setDecision({ userId, localCount: result.localCount });
        } else if (result.status === 'synced' && result.importedCount > 0) {
          toast.success(importedTitlesMessage(result.importedCount));
        }
      })
      .catch((error: unknown) => {
        if (active && !isUnauthorizedError(error)) {
          toast.error(
            'Não foi possível carregar os dados da sua conta. Tente recarregar a página.',
          );
        }
      });

    return () => {
      active = false;
      setDecision(null);
    };
  }, [hydrated, status, userId]);

  useEffect(() => {
    if (userId === null) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // `keepalive`: o envio termina mesmo se a aba estiver sendo fechada.
        librarySync.flush({ keepalive: true }).catch(() => undefined);
      } else {
        void librarySync.refresh();
      }
    };
    const handleOnline = () => librarySync.flush().catch(() => undefined);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [userId]);

  const handleChoice = async (choice: LibrarySyncChoice) => {
    if (!decision) return;
    setPendingChoice(choice);
    try {
      await librarySync.resolve(decision.userId, choice);
      setDecision(null);
      toast.success(
        choice === 'merge'
          ? importedTitlesMessage(decision.localCount)
          : 'Pronto! Agora você está vendo as avaliações da sua conta.',
      );
    } catch {
      toast.error('Não foi possível concluir agora. Tente novamente.');
    } finally {
      setPendingChoice(null);
    }
  };

  return (
    <MergeLibraryDialog
      open={decision !== null}
      localCount={decision?.localCount ?? 0}
      pendingChoice={pendingChoice}
      onChoose={(choice) => void handleChoice(choice)}
    />
  );
}
