'use client';

import { getMediaKey, type MediaSummary } from '@/domain/media';
import { RATING_OPTIONS, type RatingValue } from '@/domain/rating';
import { useLibraryActions, useRatingOf } from '@/features/library/hooks';
import { cn } from '@/lib/cn';

import { RATING_APPEARANCE } from '../rating-appearance';

interface RatingButtonsProps {
  media: MediaSummary;
  size?: 'sm' | 'md';
  /** Chamado após avaliar (`null` quando a avaliação é desfeita). */
  onRated?: (value: RatingValue | null) => void;
  className?: string;
}

/** Escala Odeio / Ruim / Bom / Ótimo. Clicar na nota atual desfaz a avaliação. */
export function RatingButtons({ media, size = 'sm', onRated, className }: RatingButtonsProps) {
  const key = getMediaKey(media);
  const current = useRatingOf(key);
  const { rate, removeRating } = useLibraryActions();

  const handleSelect = (value: RatingValue) => {
    if (current === value) {
      removeRating(key);
      onRated?.(null);
    } else {
      rate(media, value);
      onRated?.(value);
    }
  };

  return (
    <div
      role="group"
      aria-label={`Sua avaliação de ${media.title}`}
      className={cn('grid grid-cols-4 gap-1', size === 'md' && 'gap-2', className)}
    >
      {RATING_OPTIONS.map((option) => {
        const { icon: Icon, selectedClassName } = RATING_APPEARANCE[option.value];
        const selected = current === option.value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            title={selected ? `${option.label} — clique para desfazer` : option.label}
            onClick={() => handleSelect(option.value)}
            className={cn(
              'flex cursor-pointer flex-col items-center gap-0.5 rounded-lg font-medium focus-ring transition-colors',
              size === 'sm' ? 'py-1.5 text-[11px]' : 'py-2.5 text-xs',
              selected
                ? selectedClassName
                : 'bg-surface-2 text-fg-muted hover:bg-line hover:text-fg',
            )}
          >
            <Icon aria-hidden className={size === 'sm' ? 'size-4' : 'size-5'} />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
