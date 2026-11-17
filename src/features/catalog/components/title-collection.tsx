'use client';

import { useMemo, useState } from 'react';

import { MediaCard } from '@/components/media/media-card';
import { MediaGrid } from '@/components/media/media-grid';
import { VoteBadge } from '@/components/media/vote-badge';
import { Button } from '@/components/ui/button';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Select } from '@/components/ui/select';
import {
  getMediaCategory,
  getMediaKey,
  MEDIA_CATEGORIES,
  MEDIA_FILTER_LABELS,
  matchesFilter,
  type MediaCategory,
  type MediaFilter,
  type MediaSummary,
} from '@/domain/media';
import { sortTitles, TITLE_SORT_LABELS, type TitleSort } from '@/domain/title-sort';
import { WatchlistButton } from '@/features/library/components/watchlist-button';

export interface TitleCollectionItem {
  media: MediaSummary;
  /** Linha abaixo do título no card (ex.: personagem e episódios). */
  note?: string;
}

interface TitleCollectionProps {
  items: readonly TitleCollectionItem[];
  /** Ordenações oferecidas; a primeira é a padrão. */
  sorts: readonly [TitleSort, ...TitleSort[]];
  /**
   * `filter`: "Tudo" + as seções presentes (o filtro some quando há uma seção só).
   * `tabs`: uma aba por seção presente, com contagem; começa aberta na que tem mais títulos.
   */
  grouping: 'filter' | 'tabs';
  /** Quantos títulos aparecem de início e a cada "Mostrar mais". */
  pageSize?: number;
}

/** Grade de títulos com filtro por seção, ordenação e paginação no próprio navegador. */
export function TitleCollection({ items, sorts, grouping, pageSize = 12 }: TitleCollectionProps) {
  const counts = useMemo(() => countByCategory(items), [items]);
  const groups = useMemo(() => buildGroups(counts, grouping), [counts, grouping]);

  const [group, setGroup] = useState<MediaFilter>(() => initialGroup(counts, grouping));
  const [sort, setSort] = useState<TitleSort>(sorts[0]);
  const [visibleCount, setVisibleCount] = useState(pageSize);

  const sorted = useMemo(
    () =>
      sortTitles(
        items.filter((item) => matchesFilter(item.media, group)),
        sort,
        (item) => item.media,
      ),
    [items, group, sort],
  );
  const visible = sorted.slice(0, visibleCount);

  const changeGroup = (value: MediaFilter) => {
    setGroup(value);
    setVisibleCount(pageSize);
  };
  const changeSort = (value: TitleSort) => {
    setSort(value);
    setVisibleCount(pageSize);
  };

  return (
    <div className="flex flex-col gap-5">
      {(groups.length > 0 || sorts.length > 1) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {groups.length > 0 ? (
            <SegmentedControl
              label={grouping === 'tabs' ? 'Seção' : 'Filtrar por seção'}
              options={groups}
              value={group}
              onChange={changeGroup}
            />
          ) : (
            <span />
          )}
          {sorts.length > 1 && (
            <label className="flex items-center gap-2 text-sm text-fg-muted">
              Ordenar por
              <Select
                value={sort}
                onChange={(event) => changeSort(event.target.value as TitleSort)}
              >
                {sorts.map((option) => (
                  <option key={option} value={option}>
                    {TITLE_SORT_LABELS[option]}
                  </option>
                ))}
              </Select>
            </label>
          )}
        </div>
      )}

      <MediaGrid>
        {visible.map(({ media, note }) => (
          <li key={getMediaKey(media)}>
            <MediaCard
              media={media}
              badge={<VoteBadge media={media} />}
              action={<WatchlistButton media={media} />}
            >
              {note && <p className="line-clamp-2 text-xs text-fg-subtle">{note}</p>}
            </MediaCard>
          </li>
        ))}
      </MediaGrid>

      {sorted.length > visibleCount && (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={() => setVisibleCount((count) => count + pageSize)}>
            Mostrar mais ({sorted.length - visibleCount})
          </Button>
        </div>
      )}
    </div>
  );
}

function countByCategory(items: readonly TitleCollectionItem[]): Map<MediaCategory, number> {
  const counts = new Map<MediaCategory, number>();
  for (const { media } of items) {
    const category = getMediaCategory(media);
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  return counts;
}

/** Opções de seção, na ordem fixa Filmes · Séries · Animes (só as que têm títulos). */
function buildGroups(
  counts: ReadonlyMap<MediaCategory, number>,
  grouping: TitleCollectionProps['grouping'],
) {
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
function initialGroup(
  counts: ReadonlyMap<MediaCategory, number>,
  grouping: TitleCollectionProps['grouping'],
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
