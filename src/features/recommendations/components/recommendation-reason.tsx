import type { Recommendation } from '@/domain/recommendation';
import { cn } from '@/lib/cn';
import { formatList } from '@/lib/format';

/** "Porque você curtiu X e Y" — ou, sem um título específico, os gêneros em comum. */
export function RecommendationReason({
  recommendation,
  className,
}: {
  recommendation: Recommendation;
  className?: string;
}) {
  const { becauseOf, matchedGenres } = recommendation;

  let text: string | null = null;
  if (becauseOf.length > 0) {
    text = `Porque você curtiu ${formatList(becauseOf.map((reason) => reason.title))}`;
  } else if (matchedGenres.length > 0) {
    text = `Combina com seu gosto por ${formatList(matchedGenres).toLowerCase()}`;
  }

  if (!text) return null;

  return <p className={cn('line-clamp-2 text-xs text-fg-muted', className)}>{text}</p>;
}
