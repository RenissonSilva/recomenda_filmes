import { ChevronDown } from 'lucide-react';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/cn';

/** Lista de opções nativa (acessível e com o seletor do próprio sistema no celular). */
export function Select({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <span className="relative inline-flex">
      <select
        className={cn(
          'h-9 cursor-pointer appearance-none rounded-full border border-line bg-surface pr-9 pl-4 text-sm font-medium text-fg focus-ring transition-colors hover:bg-surface-2',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-fg-muted"
      />
    </span>
  );
}
