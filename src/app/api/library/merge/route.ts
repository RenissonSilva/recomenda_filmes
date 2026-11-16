import type { LibraryResponse } from '@/domain/library-items';
import { libraryMergeRequestSchema } from '@/domain/library-schema';
import { requireUserId } from '@/server/auth/session';
import { readJsonBody, withErrorHandling } from '@/server/http/route-handler';
import { mergeIntoLibrary } from '@/server/library/repository';

/**
 * POST /api/library/merge — junta a biblioteca deste navegador (feita sem login) com a da
 * conta e devolve o resultado. Quando o mesmo título está nas duas, vale a ação mais recente.
 */
export const POST = withErrorHandling(async (request: Request) => {
  const userId = await requireUserId(request);
  const { library } = libraryMergeRequestSchema.parse(await readJsonBody(request));
  const body: LibraryResponse = { library: await mergeIntoLibrary(userId, library) };
  return Response.json(body, { headers: { 'cache-control': 'private, no-store' } });
});
