import { RATING_LABELS, type RatingValue } from '@/domain/rating';
import { cn } from '@/lib/cn';

import { RATING_APPEARANCE } from '../rating-appearance';

/** Selo redondo com a nota dada pelo usuário (exibido sobre o pôster). */
export function RatingBadge({ value, className }: { value: RatingValue; className?: string }) {
  const { icon: Icon, selectedClassName } = RATING_APPEARANCE[value];

  return (
    <span
      title={`Sua avaliação: ${RATING_LABELS[value]}`}
      className={cn(
        'flex size-8 items-center justify-center rounded-full shadow-lg ring-2 ring-black/40',
        selectedClassName,
        className,
      )}
    >
      <Icon aria-hidden className="size-4" />
      <span className="sr-only">Sua avaliação: {RATING_LABELS[value]}</span>
    </span>
  );
}
