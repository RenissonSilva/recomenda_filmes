import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/cn';

export const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums [&_svg]:size-3',
  {
    variants: {
      variant: {
        neutral: 'bg-surface-2 text-fg-muted',
        brand: 'bg-brand/20 text-violet-200',
        success: 'bg-emerald-500/15 text-emerald-300',
        warning: 'bg-amber-500/15 text-amber-200',
        danger: 'bg-red-500/15 text-red-300',
        solid: 'bg-black/75 text-white backdrop-blur-sm',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
