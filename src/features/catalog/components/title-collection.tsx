'use client';

import { useMemo, useState } from 'react';

import { MediaCard } from '@/components/media/media-card';
import { MediaGrid } from '@/components/media/media-grid';
import { TitleSortSelect } from '@/components/media/title-sort-select';
import { VoteBadge } from '@/components/media/vote-badge';
import { Button } from '@/components/ui/button';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { getMediaKey, matchesFilter, type MediaFilter, type MediaSummary } from '@/domain/media';
import { sortTitles, type TitleSort } from '@/domain/title-sort';
import { WatchlistButton } from '@/features/library/components/watchlist-button';

import { useMediaGroups, type MediaGrouping } from '../hooks/use-media-groups';

export interface TitleCollectionItem {
  media: MediaSummary;
  /** Linha abaixo do título no card (ex.: personagem e episódios). */
  note?: string;
}

interface TitleCollectionProps {
  items: readonly TitleCollectionItem[];
  /** Ordenações oferecidas; a primeira é a padrão. */
  sorts: readonly [TitleSort, ...TitleSort[]];
  grouping: MediaGrouping;
  /** Quantos títulos aparecem de início e a cada "Mostrar mais". */
  pageSize?: number;
  /**
   * Seção selecionada, quando quem controla é o componente pai (ex.: para mantê-la ao alternar
   * entre a grade e outra visualização). Sem isso, a própria grade guarda a seleção.
   */
  group?: MediaFilter;
  onGroupChange?: (group: MediaFilter) => void;
}

/** Grade de títulos com filtro por seção, ordenação e paginação no próprio navegador. */
export function TitleCollection({
  items,
  sorts,
  grouping,
  pageSize = 12,
  group: controlledGroup,
  onGroupChange,
}: TitleCollectionProps) {
  const { options: groups, group: ownGroup, setGroup } = useMediaGroups(items, grouping);
  const group = controlledGroup ?? ownGroup;

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
    (onGroupChange ?? setGroup)(value);
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
          {sorts.length > 1 && <TitleSortSelect sorts={sorts} value={sort} onChange={changeSort} />}
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
