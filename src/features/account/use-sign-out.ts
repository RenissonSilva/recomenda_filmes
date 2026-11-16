'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { authClient } from '@/features/auth/auth-client';
import { useLibraryStore } from '@/features/library/store';
import { isUnauthorizedError } from '@/features/library/sync/library-sync';

import { librarySync } from './library-sync';

/**
 * Sair da conta: salva as últimas alterações, encerra a sessão e limpa os dados do navegador
 * (eles continuam na conta). Se não der para salvar, não sai — para não perder nada.
 */
export function useSignOut() {
  const [pending, setPending] = useState(false);

  const signOut = async () => {
    setPending(true);
    try {
      await librarySync.flush();
    } catch (error) {
      // 401: a sessão já tinha acabado — não há como salvar, então segue com a saída.
      if (!isUnauthorizedError(error)) {
        toast.error(
          'Não foi possível salvar suas últimas alterações na conta. Verifique a conexão e tente sair de novo.',
        );
        setPending(false);
        return;
      }
    }

    const { error } = await authClient.signOut();
    setPending(false);
    if (error) {
      toast.error('Não foi possível sair agora. Tente novamente.');
      return;
    }

    librarySync.disconnect();
    useLibraryStore.getState().resetLocal();
    toast.success('Você saiu da sua conta.');
  };

  return { signOut: () => void signOut(), pending };
}
