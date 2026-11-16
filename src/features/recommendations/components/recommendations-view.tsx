'use client';

import { RefreshCw, Sparkles } from 'lucide-react';
import { useState } from 'react';

import { MediaFilterControl } from '@/components/media/media-filter-control';
import { MediaGrid, MediaGridSkeleton } from '@/components/media/media-grid';
import { Button, ButtonLink } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { getMediaKey, type MediaFilter } from '@/domain/media';
import { routes } from '@/lib/routes';

import { useRecommendations } from '../hooks/use-recommendations';
import { RecommendationCard } from './recommendation-card';
import { RecommendationsLocked } from './recommendations-locked';

/** Tela "Recomendações". */
export function RecommendationsView() {
  const [filter, setFilter] = useState<MediaFilter>('all');
  const recommendations = useRecommendations(filter);

  if (!recommendations.hydrated) return <MediaGridSkeleton />;
  if (!recommendations.unlocked)
    return <RecommendationsLocked progress={recommendations.progress} />;

  const renderContent = () => {
    if (recommendations.status === 'pending') {
      return (
        <div className="flex flex-col gap-4">
          <p role="status" className="flex items-center gap-2 text-sm text-fg-muted">
            <Sparkles aria-hidden className="size-4 animate-pulse text-brand" />
            Analisando seu gosto e procurando títulos para você…
          </p>
          <MediaGridSkeleton />
        </div>
      );
    }

    if (recommendations.status === 'error') {
      return (
        <ErrorState
          message={recommendations.error?.message ?? 'Não foi possível carregar as recomendações.'}
          onRetry={() => void recommendations.retry()}
        />
      );
    }

    if (recommendations.items.length === 0) {
      return (
        <EmptyState
          icon={<Sparkles aria-hidden />}
          title="Nenhuma recomendação por aqui"
          description="Avalie mais títulos de que você gosta (ou troque o filtro) para encontrarmos novas sugestões."
          action={<ButtonLink href={routes.rate}>Avaliar mais títulos</ButtonLink>}
        />
      );
    }

    return (
      <MediaGrid>
        {recommendations.items.map((recommendation) => (
          <li key={getMediaKey(recommendation.media)}>
            <RecommendationCard recommendation={recommendation} />
          </li>
        ))}
      </MediaGrid>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <MediaFilterControl value={filter} onChange={setFilter} className="self-start" />

      {recommendations.isOutdated && (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-2xl border border-brand/40 bg-brand/10 p-4 sm:flex-row sm:items-center"
        >
          <p className="flex-1 text-sm">
            Você tem avaliações novas. Atualize para receber recomendações que levam elas em conta.
          </p>
          <Button size="sm" onClick={recommendations.refresh} disabled={recommendations.isFetching}>
            <RefreshCw
              aria-hidden
              className={recommendations.isFetching ? 'animate-spin' : undefined}
            />
            Atualizar recomendações
          </Button>
        </div>
      )}

      {renderContent()}
    </div>
  );
}
