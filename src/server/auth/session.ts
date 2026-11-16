import 'server-only';

import { UnauthorizedError } from '../errors';
import { getAuth } from './auth';

/**
 * Id do usuário logado na requisição. Lança `UnauthorizedError` (401) sem sessão válida.
 * Toda rota com dados do usuário deve passar por aqui — nunca confie em ids enviados pelo cliente.
 */
export async function requireUserId(request: Request): Promise<string> {
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session) throw new UnauthorizedError();
  return session.user.id;
}
