'use client';

import type { MediaFilter } from '@/domain/media';
import { queryKeys } from '@/lib/query-keys';

import { fetchDiscoverPage, fetchSearchPage } from '../api';
import { useInfiniteTitles } from './use-infinite-titles';

/** A busca só começa a partir deste número de caracteres. */
export const MIN_SEARCH_LENGTH = 2;

interface UseTitleFeedOptions {
  query: string;
  filter: MediaFilter;
}

/**
 * Lista paginada de títulos para avaliar: resultados da busca quando há texto,
 * ou os títulos mais populares do TMDB quando não há.
 */
export function useTitleFeed({ query, filter }: UseTitleFeedOptions) {
  const searchTerm = query.trim();
  const isSearch = searchTerm.length >= MIN_SEARCH_LENGTH;

  const feed = useInfiniteTitles({
    queryKey: isSearch ? queryKeys.search(searchTerm, filter) : queryKeys.discover(filter),
    fetchPage: (page, signal) =>
      isSearch
        ? fetchSearchPage(searchTerm, filter, page, signal)
        : fetchDiscoverPage({ filter, page }, signal),
  });

  return { ...feed, isSearch, searchTerm };
}
