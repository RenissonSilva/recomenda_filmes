'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getMediaKey, type MediaFilter } from '@/domain/media';
import { uniqueBy } from '@/lib/array';
import { queryKeys } from '@/lib/query-keys';

import { fetchDiscoverPage, fetchSearchPage } from '../api';

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

  const feed = useInfiniteQuery({
    queryKey: isSearch ? queryKeys.search(searchTerm, filter) : queryKeys.discover(filter),
    queryFn: ({ pageParam, signal }) =>
      isSearch
        ? fetchSearchPage(searchTerm, filter, pageParam, signal)
        : fetchDiscoverPage(filter, pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    staleTime: 10 * 60_000,
  });

  const items = useMemo(
    () => uniqueBy(feed.data?.pages.flatMap((page) => page.items) ?? [], getMediaKey),
    [feed.data],
  );

  return {
    items,
    isSearch,
    searchTerm,
    status: feed.status,
    error: feed.error,
    refetch: feed.refetch,
    fetchNextPage: feed.fetchNextPage,
    hasNextPage: feed.hasNextPage,
    isFetchingNextPage: feed.isFetchingNextPage,
  };
}
