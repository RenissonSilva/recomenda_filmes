'use client';

import { useMemo, useState } from 'react';

import type { SegmentedControlOption } from '@/components/ui/segmented-control';
import {
  getMediaCategory,
  MEDIA_CATEGORIES,
  MEDIA_FILTER_LABELS,
  type MediaCategory,
  type MediaFilter,
  type MediaSummary,
} from '@/domain/media';

/**
 * `filter`: "Tudo" + as seções presentes (o filtro some quando há uma seção só).
 * `tabs`: uma aba por seção presente, com contagem; começa aberta na que tem mais títulos.
 */
export type MediaGrouping = 'filter' | 'tabs';

type GroupableItem = { media: Pick<MediaSummary, 'mediaType' | 'genreIds' | 'originalLanguage'> };

/** Seções (Filmes · Séries · Animes) de uma lista de títulos e a seção selecionada. */
export function useMediaGroups(items: readonly GroupableItem[], grouping: MediaGrouping) {
  const counts = useMemo(() => countByCategory(items), [items]);
  const options = useMemo(() => buildGroupOptions(counts, grouping), [counts, grouping]);
  const [group, setGroup] = useState<MediaFilter>(() => getInitialGroup(counts, grouping));

  return { options, group, setGroup };
}

function countByCategory(items: readonly GroupableItem[]): Map<MediaCategory, number> {
  const counts = new Map<MediaCategory, number>();
  for (const { media } of items) {
    const category = getMediaCategory(media);
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  return counts;
}

/** Opções de seção, na ordem fixa Filmes · Séries · Animes (só as que têm títulos). */
function buildGroupOptions(
  counts: ReadonlyMap<MediaCategory, number>,
  grouping: MediaGrouping,
): SegmentedControlOption<MediaFilter>[] {
  const option = (value: MediaFilter, count: number) => ({
    value,
    label: MEDIA_FILTER_LABELS[value],
    count,
  });

  const options = MEDIA_CATEGORIES.filter((category) => counts.has(category)).map((category) =>
    option(category, counts.get(category) ?? 0),
  );

  if (grouping === 'tabs') return options;
  // O filtro só faz sentido quando há mais de uma seção.
  if (options.length < 2) return [];
  const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
  return [option('all', total), ...options];
}

/** Abas: começa na seção com mais títulos (ex.: "Animes" para dubladores japoneses). */
function getInitialGroup(
  counts: ReadonlyMap<MediaCategory, number>,
  grouping: MediaGrouping,
): MediaFilter {
  if (grouping === 'filter') return 'all';
  let largest: MediaCategory | null = null;
  for (const category of MEDIA_CATEGORIES) {
    if ((counts.get(category) ?? 0) > (largest ? (counts.get(largest) ?? 0) : 0)) {
      largest = category;
    }
  }
  return largest ?? 'all';
}
