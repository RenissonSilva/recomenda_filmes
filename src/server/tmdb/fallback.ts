import 'server-only';

import { TmdbRequestError } from '../errors';

/**
 * Para consultas opcionais (uma seção extra, um candidato a mais): uma falha temporária do TMDB
 * vira `fallback` em vez de interromper tudo. Outros erros continuam sendo lançados.
 */
export async function withTmdbFallback<T>(load: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await load();
  } catch (error) {
    if (error instanceof TmdbRequestError) return fallback;
    throw error;
  }
}
