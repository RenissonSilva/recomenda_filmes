import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { canonicalGenreSchema, discoverSortSchema, mediaFilterSchema } from '@/domain/schemas';
import { searchParamsToObject, withErrorHandling } from '@/server/http/route-handler';
import { discoverTitles } from '@/server/tmdb/catalog';
import { TMDB_MAX_PAGE } from '@/server/tmdb/config';

const querySchema = z.object({
  filter: mediaFilterSchema.default('all'),
  page: z.coerce.number().int().min(1).max(TMDB_MAX_PAGE).default(1),
  genre: canonicalGenreSchema.optional(),
  sort: discoverSortSchema.default('popularity'),
});

/**
 * GET /api/titles/discover?filter=all|movie|tv|anime&page=1[&genre=action][&sort=popularity]
 * Títulos da seção (os mais votados, por padrão), opcionalmente de um só gênero.
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { filter, page, genre, sort } = querySchema.parse(
    searchParamsToObject(request.nextUrl.searchParams),
  );
  return Response.json(await discoverTitles(filter, page, { genre, sort }));
});
