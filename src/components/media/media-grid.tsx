import type { ComponentProps } from 'react';

import { cn } from '@/lib/cn';

import { Skeleton } from '../ui/skeleton';

const GRID_CLASS_NAME =
  'grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';

/** Grade responsiva de títulos. Os filhos devem ser `<li>`. */
export function MediaGrid({ className, ...props }: ComponentProps<'ul'>) {
  return <ul className={cn(GRID_CLASS_NAME, className)} {...props} />;
}

export function MediaGridSkeleton({
  count = 12,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div role="status" aria-label="Carregando títulos" className={cn(GRID_CLASS_NAME, className)}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex flex-col gap-3">
          <Skeleton className="aspect-[2/3] rounded-xl" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
