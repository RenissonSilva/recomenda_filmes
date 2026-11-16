import { refreshSession } from '@/features/auth/auth-client';
import { useLibraryStore } from '@/features/library/store';
import { librarySyncApi } from '@/features/library/sync/api';
import { createLibrarySync } from '@/features/library/sync/library-sync';

/** Sincronização da biblioteca deste navegador com a conta (instância única do app). */
export const librarySync = createLibrarySync({
  store: useLibraryStore,
  api: librarySyncApi,
  // 401: a sessão acabou em outro lugar. Consultar de novo faz o app voltar ao modo sem login.
  onUnauthorized: refreshSession,
});
