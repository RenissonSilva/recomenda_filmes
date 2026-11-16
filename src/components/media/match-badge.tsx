import { cn } from '@/lib/cn';

interface MatchBadgeProps {
  percent: number;
  className?: string;
}

function matchTone(percent: number): string {
  if (percent >= 80) return 'text-match-high';
  if (percent >= 65) return 'text-match-medium';
  return 'text-match-low';
}

/** Porcentagem de compatibilidade do título com o gosto do usuário. */
export function MatchBadge({ percent, className }: MatchBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-baseline gap-0.5 rounded-full bg-black/75 px-2.5 py-1 text-sm font-bold tabular-nums backdrop-blur-sm',
        matchTone(percent),
        className,
      )}
    >
      {percent}%<span className="sr-only"> de compatibilidade</span>
    </span>
  );
}
