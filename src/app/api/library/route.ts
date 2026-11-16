import type { LibraryResponse } from '@/domain/library-items';
import { libraryChangesRequestSchema } from '@/domain/library-schema';
import { requireUserId } from '@/server/auth/session';
import { readJsonBody, withErrorHandling } from '@/server/http/route-handler';
import { getLibrary, saveLibraryChanges } from '@/server/library/repository';

/** GET /api/library — biblioteca (avaliações e listas) salva na conta do usuário logado. */
export const GET = withErrorHandling(async (request: Request) => {
  const userId = await requireUserId(request);
  const body: LibraryResponse = { library: await getLibrary(userId) };
  return Response.json(body, { headers: { 'cache-control': 'private, no-store' } });
});

/** PATCH /api/library — grava as alterações feitas no navegador, título a título. */
export const PATCH = withErrorHandling(async (request: Request) => {
  const userId = await requireUserId(request);
  const { changes } = libraryChangesRequestSchema.parse(await readJsonBody(request));
  await saveLibraryChanges(userId, changes);
  return new Response(null, { status: 204 });
});
