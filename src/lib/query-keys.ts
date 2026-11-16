import type { MediaFilter } from '@/domain/media';

/** Chaves do cache do TanStack Query, centralizadas para evitar colisões e erros de digitação. */
export const queryKeys = {
  discover: (filter: MediaFilter) => ['titles', 'discover', filter] as const,
  search: (query: string, filter: MediaFilter) => ['titles', 'search', filter, query] as const,
  recommendations: (filter: MediaFilter, ratingsSignature: string) =>
    ['recommendations', filter, ratingsSignature] as const,
};
