'use client';

import { SearchX } from 'lucide-react';
import { useState } from 'react';

import { MediaFilterControl } from '@/components/media/media-filter-control';
import { MediaGrid, MediaGridSkeleton } from '@/components/media/media-grid';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadMore } from '@/components/ui/load-more';
import { SearchInput } from '@/components/ui/search-input';
import { getMediaKey, MEDIA_FILTER_LABELS, type MediaFilter, type MediaKey } from '@/domain/media';
import { useTitleFeed } from '@/features/catalog/hooks/use-title-feed';
import type { LibraryData } from '@/features/library/library-state';
import { useLibrarySnapshot } from '@/features/library/use-library-snapshot';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

import { RateableMediaCard } from './rateable-media-card';
import { RatingProgress } from './rating-progress';

const SEARCH_DEBOUNCE_MS = 350;

/** Títulos que já foram avaliados/marcados ao abrir a tela não voltam para a lista de sugestões. */
function selectHandledKeys(data: LibraryData): ReadonlySet<MediaKey> {
  return new Set(
    [data.ratings, data.unseen, data.dismissed].flatMap((entries) => Object.keys(entries)),
  ) as ReadonlySet<MediaKey>;
}

/** Tela "Avaliar": títulos populares (ou resultados da busca) com a escala de avaliação. */
export function RateTitlesView() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<MediaFilter>('all');
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);

  const feed = useTitleFeed({ query: debouncedQuery, filter });
  // Tirado uma vez: o que for avaliado agora continua visível (com a nota) até sair da tela.
  const { snapshot: handledKeys } = useLibrarySnapshot(selectHandledKeys);

  const items = feed.isSearch
    ? feed.items
    : feed.items.filter((media) => !handledKeys?.has(getMediaKey(media)));

  const renderContent = () => {
    if (feed.status === 'pending' || handledKeys === null) return <MediaGridSkeleton />;

    if (feed.status === 'error') {
      return (
        <ErrorState
          message={feed.error?.message ?? 'Não foi possível carregar os títulos.'}
          onRetry={() => void feed.refetch()}
        />
      );
    }

    if (items.length === 0) {
      return (
        <EmptyState
          icon={<SearchX aria-hidden />}
          title={feed.isSearch ? 'Nenhum título encontrado' : 'Nada para avaliar por aqui'}
          description={
            feed.isSearch
              ? `Não encontramos resultados para “${feed.searchTerm}”${
                  filter === 'all' ? '' : ` em ${MEDIA_FILTER_LABELS[filter]}`
                }. Tente outro nome, confira a grafia${filter === 'all' ? '' : ' ou busque em Tudo'}.`
              : 'Use a busca para encontrar outros títulos.'
          }
        />
      );
    }

    return (
      <>
        <MediaGrid>
          {items.map((media) => (
            <li key={getMediaKey(media)}>
              <RateableMediaCard media={media} />
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={query}
          onValueChange={setQuery}
          placeholder="Buscar filme, série ou anime…"
          aria-label="Buscar filme, série ou anime"
          className="flex-1"
        />
        <MediaFilterControl value={filter} onChange={setFilter} />
      </div>

      <h2 className="text-sm font-medium text-fg-muted">
        {feed.isSearch
          ? `Resultados para “${feed.searchTerm}”`
          : 'Os mais assistidos — avalie os que você já viu'}
      </h2>

      {renderContent()}

      <RatingProgress />
    </div>
  );
}
