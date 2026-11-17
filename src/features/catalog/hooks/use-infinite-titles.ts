'use client';

import { useInfiniteQuery, type QueryKey } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getMediaKey, type MediaSummary } from '@/domain/media';
import type { Paginated } from '@/domain/pagination';
import { uniqueBy } from '@/lib/array';

interface UseInfiniteTitlesOptions {
  queryKey: QueryKey;
  fetchPage: (page: number, signal: AbortSignal) => Promise<Paginated<MediaSummary>>;
}

/**
 * Lista de títulos paginada pela API ("Carregar mais"). O TMDB às vezes repete um título em
 * páginas vizinhas: as repetições são descartadas.
 */
export function useInfiniteTitles({ queryKey, fetchPage }: UseInfiniteTitlesOptions) {
  const feed = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam, signal }) => fetchPage(pageParam, signal),
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
    status: feed.status,
    error: feed.error,
    refetch: feed.refetch,
    fetchNextPage: feed.fetchNextPage,
    hasNextPage: feed.hasNextPage,
    isFetchingNextPage: feed.isFetchingNextPage,
  };
}
