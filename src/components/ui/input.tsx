import type { ComponentProps } from 'react';

import { cn } from '@/lib/cn';

/** Campo de texto padrão dos formulários. O estado de erro vem de `aria-invalid`. */
export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-xl border border-line bg-surface px-4 text-base text-fg focus-ring transition-colors placeholder:text-fg-subtle',
        'disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-400/70',
        className,
      )}
      {...props}
    />
  );
}
