import 'server-only';

import { connection } from 'next/server';

import { getGoogleCredentials } from '../env';

export interface AuthProviders {
  google: boolean;
}

/**
 * Formas de login disponíveis. Lidas na requisição (e não no build), para que a mesma
 * build funcione em ambientes com e sem o Google configurado.
 */
export async function getAuthProviders(): Promise<AuthProviders> {
  await connection();
  return { google: getGoogleCredentials() !== null };
}
