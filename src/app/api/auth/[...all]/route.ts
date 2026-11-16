import { toNextJsHandler } from 'better-auth/next-js';

import { getAuth } from '@/server/auth/auth';

/** Rotas do Better Auth (login, cadastro, sessão, OAuth do Google, recuperação de senha…). */
const handler = (request: Request) => getAuth().handler(request);

export const { GET, POST } = toNextJsHandler(handler);
