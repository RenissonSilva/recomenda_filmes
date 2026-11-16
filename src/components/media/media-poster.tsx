import { Clapperboard } from 'lucide-react';

import type { MediaSummary } from '@/domain/media';
import { cn } from '@/lib/cn';

import { TmdbImage } from './tmdb-image';

/** Valor do atributo `sizes` para pôsteres exibidos na grade padrão. */
export const GRID_POSTER_SIZES =
  '(min-width: 1280px) 200px, (min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw';

interface MediaPosterProps {
  media: Pick<MediaSummary, 'title' | 'posterPath'>;
  sizes: string;
  preload?: boolean;
  className?: string;
}

export function MediaPoster({ media, sizes, preload, className }: MediaPosterProps) {
  return (
    <div
      className={cn(
        'relative aspect-[2/3] overflow-hidden rounded-xl bg-surface-2 ring-1 ring-white/5',
        className,
      )}
    >
      {media.posterPath ? (
        <TmdbImage
          path={media.posterPath}
          alt={`Pôster de ${media.title}`}
          fill
          sizes={sizes}
          preload={preload}
          className="object-cover"
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center text-fg-subtle">
          <Clapperboard aria-hidden className="size-8" />
          <span className="line-clamp-3 text-xs">{media.title}</span>
        </div>
      )}
    </div>
  );
}
