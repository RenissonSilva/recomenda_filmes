import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { mediaFilterSchema } from '@/domain/schemas';
import { searchParamsToObject, withErrorHandling } from '@/server/http/route-handler';
import { discoverPopularTitles } from '@/server/tmdb/catalog';
import { TMDB_MAX_PAGE } from '@/server/tmdb/config';

const querySchema = z.object({
  filter: mediaFilterSchema.default('all'),
  page: z.coerce.number().int().min(1).max(TMDB_MAX_PAGE).default(1),
});

/** GET /api/titles/discover?filter=all|movie|tv|anime&page=1 — títulos populares para avaliar. */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { filter, page } = querySchema.parse(searchParamsToObject(request.nextUrl.searchParams));
  return Response.json(await discoverPopularTitles(filter, page));
});
