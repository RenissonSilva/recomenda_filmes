import Link from 'next/link';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/cn';

/** Link no meio de um texto, na cor da marca. */
export function TextLink({ className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn('rounded font-medium text-brand focus-ring hover:underline', className)}
      {...props}
    />
  );
}
