'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { authClient } from './auth-client';
import { RETURN_TO_PARAM, sanitizeReturnTo } from './return-to';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
}

/**
 * - `loading`: consultando a sessão (também na renderização no servidor).
 * - `unavailable`: não foi possível consultar (ex.: servidor fora do ar) — não é o mesmo que deslogado.
 */
export type SessionStatus = 'loading' | 'authenticated' | 'anonymous' | 'unavailable';

/** Usuário logado no navegador. */
export function useCurrentUser(): { user: CurrentUser | null; status: SessionStatus } {
  const { data, isPending, error } = authClient.useSession();

  if (data) {
    const { id, name, email } = data.user;
    return { user: { id, name, email }, status: 'authenticated' };
  }
  if (isPending) return { user: null, status: 'loading' };
  return { user: null, status: error ? 'unavailable' : 'anonymous' };
}

/** Página de retorno informada na URL (`?voltar=`), já validada. */
export function useReturnTo(): string {
  return sanitizeReturnTo(useSearchParams().get(RETURN_TO_PARAM));
}

/** Nas telas de entrar/criar conta: quem já está logado segue direto para `returnTo`. */
export function useRedirectWhenSignedIn(returnTo: string) {
  const router = useRouter();
  const { status } = useCurrentUser();

  useEffect(() => {
    if (status === 'authenticated') router.replace(returnTo);
  }, [status, returnTo, router]);
}
