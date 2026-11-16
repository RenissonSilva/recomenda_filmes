import { cn } from '@/lib/cn';
import { clamp } from '@/lib/math';

interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
  className?: string;
}

export function ProgressBar({ value, max, label, className }: ProgressBarProps) {
  const percent = max > 0 ? clamp((value / max) * 100, 0, 100) : 0;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-surface-2', className)}
    >
      <div
        className="h-full rounded-full bg-brand transition-[width] duration-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
