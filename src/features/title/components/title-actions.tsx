'use client';

import { Play } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import { getMediaKey, type MediaSummary } from '@/domain/media';
import { WatchlistButton } from '@/features/library/components/watchlist-button';
import { useRatingOf } from '@/features/library/hooks';
import { RatingButtons } from '@/features/rating/components/rating-buttons';
import { UnseenButton } from '@/features/rating/components/unseen-button';

interface TitleActionsProps {
  media: MediaSummary;
  trailerYoutubeKey: string | null;
}

/** Painel de ações da página de detalhes: avaliação, "Nunca vi", "Quero ver" e trailer. */
export function TitleActions({ media, trailerYoutubeKey }: TitleActionsProps) {
  const rating = useRatingOf(getMediaKey(media));

  return (
    <div className="flex max-w-xl flex-col gap-4 rounded-2xl border border-line bg-surface/80 p-4 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">
          {rating ? 'Sua avaliação' : 'Já assistiu? Avalie'}
        </h2>
        {!rating && <UnseenButton media={media} className="w-auto px-3" />}
      </div>

      <RatingButtons media={media} size="md" />

      <div className="flex flex-wrap gap-2">
        <WatchlistButton media={media} appearance="full" />
        {trailerYoutubeKey && (
          <a
            href={`https://www.youtube.com/watch?v=${trailerYoutubeKey}`}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: 'outline' })}
          >
            <Play aria-hidden className="size-4" />
            Assistir trailer
          </a>
        )}
      </div>
    </div>
  );
}
