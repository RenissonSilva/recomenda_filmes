import type { MediaSummary, MediaType, Person } from '@/domain/media';

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
  signIn: '/entrar',
  signUp: '/criar-conta',
  forgotPassword: '/esqueci-a-senha',
  resetPassword: '/redefinir-senha',
  title: (media: Pick<MediaSummary, 'mediaType' | 'id'>) =>
    `/${MEDIA_ROUTE_SEGMENTS[media.mediaType]}/${media.id}`,
  person: (person: Pick<Person, 'id'>) => `/pessoa/${person.id}`,
} as const;

/** Converte o segmento `[id]` de uma rota (`/filme/123`, `/pessoa/456`) em número, ou `null`. */
export function parseRouteId(rawId: string): number | null {
  if (!/^\d+$/.test(rawId)) return null;
  const id = Number(rawId);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** Endpoints da API interna (Route Handlers em `src/app/api`). */
export const apiRoutes = {
  discover: '/api/titles/discover',
  search: '/api/titles/search',
  recommendations: '/api/recommendations',
  library: '/api/library',
  libraryMerge: '/api/library/merge',
} as const;
