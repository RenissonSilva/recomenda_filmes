'use client';

import { skipToken, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { getMediaKey, type MediaFilter } from '@/domain/media';
import { useLibraryHydrated } from '@/features/library/hooks';
import { useLibraryStore } from '@/features/library/store';
import { queryKeys } from '@/lib/query-keys';

import { fetchRecommendations } from '../api';
import {
  createRecommendationSnapshot,
  getRecommendationProgress,
  isUnlocked,
  ratingsSignature,
  type RecommendationSnapshot,
} from '../snapshot';

/**
 * Recomendações do usuário para o filtro escolhido.
 *
 * As recomendações são calculadas sobre uma "foto" das avaliações: avaliar um título
 * não reorganiza a lista na hora (o título só some dela). Quando há avaliações novas,
 * `isOutdated` fica `true` e `refresh()` recalcula.
 */
export function useRecommendations(filter: MediaFilter) {
  const hydrated = useLibraryHydrated();
  const progress = useLibraryStore(useShallow(getRecommendationProgress));
  const currentSignature = useLibraryStore((state) => ratingsSignature(state.ratings));
  const unlocked = isUnlocked(progress);

  const [snapshot, setSnapshot] = useState<RecommendationSnapshot | null>(null);
  const takeSnapshot = () => setSnapshot(createRecommendationSnapshot(useLibraryStore.getState()));

  // Primeira "foto" assim que as recomendações são liberadas.
  if (hydrated && unlocked && snapshot === null) takeSnapshot();

  const request =
    snapshot && unlocked
      ? { ratings: snapshot.ratings, excludeKeys: snapshot.excludeKeys, filter }
      : null;

  const query = useQuery({
    queryKey: queryKeys.recommendations(filter, snapshot?.signature ?? 'none'),
    queryFn: request ? ({ signal }) => fetchRecommendations(request, signal) : skipToken,
    staleTime: Infinity,
    gcTime: 30 * 60_000,
  });

  // Títulos avaliados ou dispensados depois da "foto" somem da lista imediatamente.
  const hiddenKeys = useLibraryStore(
    useShallow((state) => [...Object.keys(state.ratings), ...Object.keys(state.dismissed)]),
  );
  const items = useMemo(() => {
    const hidden = new Set<string>(hiddenKeys);
    return (query.data?.items ?? []).filter((item) => !hidden.has(getMediaKey(item.media)));
  }, [query.data, hiddenKeys]);

  return {
    hydrated,
    unlocked,
    progress,
    items,
    status: query.status,
    error: query.error,
    isFetching: query.isFetching,
    isOutdated: snapshot !== null && snapshot.signature !== currentSignature,
    refresh: takeSnapshot,
    retry: query.refetch,
  };
}
