import { createAuthClient } from 'better-auth/react';

/**
 * Cliente do Better Auth no navegador: chama as rotas de `/api/auth` (mesma origem do app)
 * e mantém a sessão sincronizada entre as abas.
 */
export const authClient = createAuthClient();

/** Pede ao cliente que consulte a sessão de novo (ex.: o servidor respondeu 401). */
export function refreshSession() {
  authClient.$store.notify('$sessionSignal');
}
