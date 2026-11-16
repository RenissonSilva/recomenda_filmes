'use client';

import { Bookmark } from 'lucide-react';
import { useMemo, useState } from 'react';

import { MediaCard } from '@/components/media/media-card';
import { MediaFilterControl } from '@/components/media/media-filter-control';
import { MediaGrid, MediaGridSkeleton } from '@/components/media/media-grid';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { getMediaKey, matchesFilter, type MediaFilter } from '@/domain/media';
import { RateDisclosure } from '@/features/rating/components/rate-disclosure';
import { routes } from '@/lib/routes';

import { useLibraryHydrated } from '../hooks';
import { sortedEntries } from '../library-state';
import { useLibraryStore } from '../store';
import { WatchlistButton } from './watchlist-button';

/** Tela "Quero ver". */
export function WatchlistView() {
  const hydrated = useLibraryHydrated();
  const [filter, setFilter] = useState<MediaFilter>('all');
  const watchlist = useLibraryStore((state) => state.watchlist);

  const entries = useMemo(() => sortedEntries(watchlist), [watchlist]);
  const visibleMedia = entries
    .map((entry) => entry.media)
    .filter((media) => matchesFilter(media, filter));

  if (!hydrated) return <MediaGridSkeleton />;

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<Bookmark aria-hidden />}
        title="Sua lista está vazia"
        description="Toque no marcador de um título (nas recomendações ou na página dele) para guardá-lo aqui."
        action={<ButtonLink href={routes.recommendations}>Ver recomendações</ButtonLink>}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <MediaFilterControl value={filter} onChange={setFilter} className="self-start" />

      {visibleMedia.length === 0 ? (
        <EmptyState
          icon={<Bookmark aria-hidden />}
          title="Nenhum título desta seção na lista"
          description="Troque o filtro para ver os outros títulos salvos."
        />
      ) : (
        <MediaGrid>
          {visibleMedia.map((media) => (
            <li key={getMediaKey(media)}>
              <MediaCard media={media} action={<WatchlistButton media={media} />}>
                <div className="mt-auto">
                  <RateDisclosure media={media} />
                </div>
              </MediaCard>
            </li>
          ))}
        </MediaGrid>
      )}
    </div>
  );
}
