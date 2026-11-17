import { Star } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { MediaSummary } from '@/domain/media';
import { hasReliableRating } from '@/domain/title-sort';
import { formatVoteAverage } from '@/lib/format';

interface VoteBadgeProps {
  media: Pick<MediaSummary, 'voteAverage' | 'voteCount'>;
  className?: string;
}

/**
 * Nota do TMDB sobre o pôster. Títulos com poucos votos ficam sem nota — os mesmos que a
 * ordenação por nota manda para o fim da lista.
 */
export function VoteBadge({ media, className }: VoteBadgeProps) {
  if (!hasReliableRating(media)) return null;

  return (
    <Badge variant="solid" className={className}>
      <Star aria-hidden fill="currentColor" className="text-amber-300" />
      {formatVoteAverage(media.voteAverage)}
      <span className="sr-only"> de nota no TMDB</span>
    </Badge>
  );
}
