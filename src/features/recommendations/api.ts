import type { RecommendationRequest, RecommendationResponse } from '@/domain/recommendation';
import { fetchJson } from '@/lib/http/fetch-json';
import { apiRoutes } from '@/lib/routes';

export function fetchRecommendations(request: RecommendationRequest, signal?: AbortSignal) {
  return fetchJson<RecommendationResponse>(apiRoutes.recommendations, {
    method: 'POST',
    json: request,
    signal,
  });
}
