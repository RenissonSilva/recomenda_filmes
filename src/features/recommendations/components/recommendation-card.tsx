'use client';

import { Ban } from 'lucide-react';
import { toast } from 'sonner';

import { MatchBadge } from '@/components/media/match-badge';
import { MediaCard } from '@/components/media/media-card';
import { Button } from '@/components/ui/button';
import { getMediaKey } from '@/domain/media';
import { RATING_LABELS, type RatingValue } from '@/domain/rating';
import type { Recommendation } from '@/domain/recommendation';
import { WatchlistButton } from '@/features/library/components/watchlist-button';
import { useLibraryActions } from '@/features/library/hooks';
import { RatingButtons } from '@/features/rating/components/rating-buttons';

import { RecommendationReason } from './recommendation-reason';

export function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const { media, matchPercent } = recommendation;
  const { dismiss, restoreDismissed, removeRating } = useLibraryActions();
  const key = getMediaKey(media);

  const handleDismiss = () => {
    dismiss(media);
    toast(`“${media.title}” não será mais recomendado.`, {
      action: { label: 'Desfazer', onClick: () => restoreDismissed(key) },
    });
  };

  const handleRated = (value: RatingValue | null) => {
    if (!value) return;
    toast(`Você avaliou “${media.title}” como ${RATING_LABELS[value]}.`, {
      description: 'Atualize as recomendações para levar essa nota em conta.',
      action: { label: 'Desfazer', onClick: () => removeRating(key) },
    });
  };

  return (
    <MediaCard
      media={media}
      badge={<MatchBadge percent={matchPercent} />}
      action={<WatchlistButton media={media} />}
    >
      <RecommendationReason recommendation={recommendation} />
      <div className="mt-auto flex flex-col gap-1">
        <RatingButtons media={media} onRated={handleRated} />
        <Button variant="ghost" size="sm" onClick={handleDismiss} className="w-full">
          <Ban aria-hidden />
          Não tenho interesse
        </Button>
      </div>
    </MediaCard>
  );
}
