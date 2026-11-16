'use client';

import { Bookmark, BookmarkCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getMediaKey, type MediaSummary } from '@/domain/media';
import { cn } from '@/lib/cn';

import { useIsInWatchlist, useLibraryActions } from '../hooks';

interface WatchlistButtonProps {
  media: MediaSummary;
  /** `icon`: botão redondo sobre o pôster; `full`: botão com texto. */
  appearance?: 'icon' | 'full';
  className?: string;
}

export function WatchlistButton({ media, appearance = 'icon', className }: WatchlistButtonProps) {
  const saved = useIsInWatchlist(getMediaKey(media));
  const { toggleWatchlist } = useLibraryActions();

  const label = saved ? 'Remover de Quero ver' : 'Adicionar a Quero ver';
  const Icon = saved ? BookmarkCheck : Bookmark;

  if (appearance === 'full') {
    return (
      <Button
        variant={saved ? 'secondary' : 'outline'}
        aria-pressed={saved}
        onClick={() => toggleWatchlist(media)}
        className={className}
      >
        <Icon aria-hidden className={cn(saved && 'text-brand')} />
        {saved ? 'Na lista Quero ver' : 'Quero ver'}
      </Button>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={label}
      title={label}
      onClick={() => toggleWatchlist(media)}
      className={cn(
        'flex size-9 cursor-pointer items-center justify-center rounded-full bg-black/70 text-white focus-ring backdrop-blur-sm transition-colors hover:bg-black/90',
        saved && 'text-violet-300',
        className,
      )}
    >
      <Icon aria-hidden className="size-4.5" fill={saved ? 'currentColor' : 'none'} />
    </button>
  );
}
