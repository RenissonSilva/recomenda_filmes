'use client';

import { EyeOff } from 'lucide-react';

import { MediaCard } from '@/components/media/media-card';
import { Badge } from '@/components/ui/badge';
import { getMediaKey, type MediaSummary } from '@/domain/media';
import { UNSEEN_LABEL } from '@/domain/rating';
import { useIsUnseen, useRatingOf } from '@/features/library/hooks';

import { RatingBadge } from './rating-badge';
import { RatingButtons } from './rating-buttons';
import { UnseenButton } from './unseen-button';

interface RateableMediaCardProps {
  media: MediaSummary;
  /** Exibe o botão "Nunca vi" abaixo da escala. */
  showUnseen?: boolean;
}

/** Card com a escala de avaliação — usado na tela "Avaliar" e em "Minhas avaliações". */
export function RateableMediaCard({ media, showUnseen = true }: RateableMediaCardProps) {
  const key = getMediaKey(media);
  const rating = useRatingOf(key);
  const unseen = useIsUnseen(key);

  return (
    <MediaCard
      media={media}
      dimmed={unseen}
      action={rating && <RatingBadge value={rating} />}
      overlay={
        unseen && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Badge variant="solid" className="px-3 py-1 text-sm">
              <EyeOff aria-hidden />
              {UNSEEN_LABEL}
            </Badge>
          </div>
        )
      }
    >
      <div className="mt-auto flex flex-col gap-1">
        <RatingButtons media={media} />
        {(showUnseen || unseen) && !rating && <UnseenButton media={media} />}
      </div>
    </MediaCard>
  );
}
