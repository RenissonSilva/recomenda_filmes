'use client';

import { EyeOff, Undo2 } from 'lucide-react';

import { getMediaKey, type MediaSummary } from '@/domain/media';
import { UNSEEN_LABEL } from '@/domain/rating';
import { useIsUnseen, useLibraryActions } from '@/features/library/hooks';
import { cn } from '@/lib/cn';

/** Botão "Nunca vi" (alterna para "Desfazer" quando marcado). */
export function UnseenButton({ media, className }: { media: MediaSummary; className?: string }) {
  const key = getMediaKey(media);
  const unseen = useIsUnseen(key);
  const { markUnseen, unmarkUnseen } = useLibraryActions();

  return (
    <button
      type="button"
      aria-pressed={unseen}
      onClick={() => (unseen ? unmarkUnseen(key) : markUnseen(media))}
      className={cn(
        'inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium text-fg-subtle focus-ring transition-colors hover:bg-surface-2 hover:text-fg',
        unseen && 'text-fg-muted',
        className,
      )}
    >
      {unseen ? (
        <Undo2 aria-hidden className="size-3.5" />
      ) : (
        <EyeOff aria-hidden className="size-3.5" />
      )}
      {unseen ? 'Desfazer' : UNSEEN_LABEL}
    </button>
  );
}
