import type { MediaFilter, MediaSummary } from '@/domain/media';
import type { Paginated } from '@/domain/pagination';
import { fetchJson } from '@/lib/http/fetch-json';
import { apiRoutes } from '@/lib/routes';

/** Cliente da API interna de títulos (usado pelos hooks do TanStack Query). */

export function fetchDiscoverPage(filter: MediaFilter, page: number, signal?: AbortSignal) {
  const params = new URLSearchParams({ filter, page: String(page) });
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
