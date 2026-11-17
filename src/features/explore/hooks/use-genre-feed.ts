'use client';

import { fetchDiscoverPage } from '@/features/catalog/api';
import { useInfiniteTitles } from '@/features/catalog/hooks/use-infinite-titles';
import { queryKeys } from '@/lib/query-keys';
import type { ExploreParams } from '@/lib/routes';

/** Títulos de um gênero na seção e na ordem escolhidas, página a página. */
export function useGenreFeed({ genre, filter, sort }: ExploreParams) {
  return useInfiniteTitles({
    queryKey: queryKeys.genre(genre, filter, sort),
    fetchPage: (page, signal) => fetchDiscoverPage({ filter, page, genre, sort }, signal),
  });
}
