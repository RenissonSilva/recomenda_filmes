import type { MediaSummary, MediaType } from '@/domain/media';

/** Segmento de URL em português para cada tipo de título: /filme/123 e /serie/456. */
const MEDIA_ROUTE_SEGMENTS: Record<MediaType, string> = {
  movie: 'filme',
  tv: 'serie',
};

/** Rotas do app — use sempre estas funções em vez de montar URLs à mão. */
export const routes = {
  home: '/',
  rate: '/avaliar',
  recommendations: '/recomendacoes',
  ratings: '/minhas-avaliacoes',
  watchlist: '/quero-ver',
  title: (media: Pick<MediaSummary, 'mediaType' | 'id'>) =>
    `/${MEDIA_ROUTE_SEGMENTS[media.mediaType]}/${media.id}`,
} as const;

/** Endpoints da API interna (Route Handlers em `src/app/api`). */
export const apiRoutes = {
  discover: '/api/titles/discover',
  search: '/api/titles/search',
  recommendations: '/api/recommendations',
} as const;
