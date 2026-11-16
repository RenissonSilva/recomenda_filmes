import type { RecommendationResponse } from '@/domain/recommendation';
import { recommendationRequestSchema } from '@/domain/schemas';
import { readJsonBody, withErrorHandling } from '@/server/http/route-handler';
import { generateRecommendations } from '@/server/recommendations/engine';
import type { RecommenderCatalog } from '@/server/recommendations/types';
import { discoverTopRatedByGenres, getCreatorWorks, getTitleDetails } from '@/server/tmdb/catalog';

const catalog: RecommenderCatalog = {
  getTitleDetails,
  discoverTopRatedByGenres,
  getCreatorWorks,
};

/**
 * POST /api/recommendations — recebe as avaliações (guardadas no navegador do usuário)
 * e devolve as recomendações calculadas no servidor.
 */
export const POST = withErrorHandling(async (request: Request) => {
  const input = recommendationRequestSchema.parse(await readJsonBody(request));
  const body: RecommendationResponse = { items: await generateRecommendations(input, catalog) };
  return Response.json(body);
});
