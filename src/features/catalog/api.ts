import type { CanonicalGenre } from '@/domain/genres';
import type { MediaFilter, MediaSummary } from '@/domain/media';
import type { Paginated } from '@/domain/pagination';
import type { DiscoverSort } from '@/domain/title-sort';
import { fetchJson } from '@/lib/http/fetch-json';
import { apiRoutes } from '@/lib/routes';

/** Cliente da API interna de títulos (usado pelos hooks do TanStack Query). */

export interface DiscoverPageParams {
  filter: MediaFilter;
  page: number;
  /** Só títulos deste gênero. */
  genre?: CanonicalGenre;
  /** Padrão: os mais votados. */
  sort?: DiscoverSort;
}

export function fetchDiscoverPage(
  { filter, page, genre, sort }: DiscoverPageParams,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({ filter, page: String(page) });
  if (genre) params.set('genre', genre);
  if (sort) params.set('sort', sort);
  return fetchJson<Paginated<MediaSummary>>(`${apiRoutes.discover}?${params}`, { signal });
}

export function fetchSearchPage(
  query: string,
  filter: MediaFilter,
  page: number,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({ q: query, filter, page: String(page) });
  return fetchJson<Paginated<MediaSummary>>(`${apiRoutes.search}?${params}`, { signal });
}
