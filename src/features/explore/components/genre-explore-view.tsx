'use client';

import { SearchX } from 'lucide-react';
import { useState } from 'react';

import { MediaCard } from '@/components/media/media-card';
import { MediaFilterControl } from '@/components/media/media-filter-control';
import { MediaGrid, MediaGridSkeleton } from '@/components/media/media-grid';
import { TitleSortSelect } from '@/components/media/title-sort-select';
import { VoteBadge } from '@/components/media/vote-badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadMore } from '@/components/ui/load-more';
import { CANONICAL_GENRE_LABELS } from '@/domain/genres';
import { getMediaKey, MEDIA_FILTER_LABELS } from '@/domain/media';
import { DISCOVER_SORTS } from '@/domain/title-sort';
import { WatchlistButton } from '@/features/library/components/watchlist-button';
import { routes, type ExploreParams } from '@/lib/routes';

import { useGenreFeed } from '../hooks/use-genre-feed';

type ExploreOptions = Omit<ExploreParams, 'genre'>;

/**
 * Títulos de um gênero, com filtro por seção, ordenação e rolagem infinita. A seção e a ordem
 * escolhidas vão para a URL: o link pode ser compartilhado e, ao voltar, a lista é a mesma.
 */
export function GenreExploreView({ genre, ...initialOptions }: ExploreParams) {
  const [options, setOptions] = useState<ExploreOptions>(initialOptions);
  const { filter, sort } = options;
  const feed = useGenreFeed({ genre, filter, sort });
  const genreLabel = CANONICAL_GENRE_LABELS[genre];

  const changeOptions = (changes: Partial<ExploreOptions>) => {
    const next = { ...options, ...changes };
    setOptions(next);
    // Atualiza a URL sem recarregar a página (o Next.js integra o `replaceState` ao roteador).
    window.history.replaceState(null, '', routes.exploreGenre({ genre, ...next }));
  };

  const renderContent = () => {
    if (feed.status === 'pending') return <MediaGridSkeleton />;

    if (feed.status === 'error') {
      return (
        <ErrorState
          message={feed.error?.message ?? 'Não foi possível carregar os títulos.'}
          onRetry={() => void feed.refetch()}
        />
      );
    }

    if (feed.items.length === 0) {
      const section = filter === 'all' ? 'títulos' : MEDIA_FILTER_LABELS[filter].toLowerCase();
      return (
        <EmptyState
          icon={<SearchX aria-hidden />}
          title="Nenhum título encontrado"
          description={`Não encontramos ${section} do gênero “${genreLabel}”.`}
          action={
            filter !== 'all' && (
              <Button variant="secondary" onClick={() => changeOptions({ filter: 'all' })}>
                Ver em {MEDIA_FILTER_LABELS.all}
              </Button>
            )
          }
        />
      );
    }

    return (
      <>
        <MediaGrid>
          {feed.items.map((media) => (
            <li key={getMediaKey(media)}>
              <MediaCard
                media={media}
                badge={<VoteBadge media={media} />}
                action={<WatchlistButton media={media} />}
              />
            </li>
          ))}
        </MediaGrid>
        <LoadMore
          hasMore={feed.hasNextPage}
          loading={feed.isFetchingNextPage}
          onLoadMore={feed.fetchNextPage}
        />
      </>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MediaFilterControl value={filter} onChange={(value) => changeOptions({ filter: value })} />
        <TitleSortSelect
          sorts={DISCOVER_SORTS}
          value={sort}
          onChange={(value) => changeOptions({ sort: value })}
        />
      </div>

      {renderContent()}
    </div>
  );
}
