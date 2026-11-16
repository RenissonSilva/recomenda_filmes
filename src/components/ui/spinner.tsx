import { LoaderCircle } from 'lucide-react';

import { cn } from '@/lib/cn';

export function Spinner({
  className,
  label = 'Carregando',
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span role="status" className="inline-flex">
      <LoaderCircle aria-hidden className={cn('size-5 animate-spin text-fg-muted', className)} />
      <span className="sr-only">{label}</span>
    </span>
  );
}
