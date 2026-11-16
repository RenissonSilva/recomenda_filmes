import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { mediaFilterSchema } from '@/domain/schemas';
import { searchParamsToObject, withErrorHandling } from '@/server/http/route-handler';
import { searchTitles } from '@/server/tmdb/catalog';
import { TMDB_MAX_PAGE } from '@/server/tmdb/config';

const querySchema = z.object({
  q: z.string().trim().min(1).max(100),
  filter: mediaFilterSchema.default('all'),
  page: z.coerce.number().int().min(1).max(TMDB_MAX_PAGE).default(1),
});

/** GET /api/titles/search?q=duna&filter=all|movie|tv|anime&page=1 — busca por nome. */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { q, filter, page } = querySchema.parse(searchParamsToObject(request.nextUrl.searchParams));
  return Response.json(await searchTitles(q, filter, page));
});
