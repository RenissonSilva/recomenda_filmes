import { cva, type VariantProps } from 'class-variance-authority';
import Link from 'next/link';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/cn';

export const buttonVariants = cva(
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap focus-ring transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-brand text-brand-fg hover:bg-brand-hover',
        secondary: 'bg-surface-2 text-fg hover:bg-line',
        outline: 'border border-line text-fg hover:bg-surface-2',
        ghost: 'text-fg-muted hover:bg-surface-2 hover:text-fg',
        danger: 'bg-red-500/15 text-red-300 hover:bg-red-500/25',
      },
      size: {
        sm: 'h-8 px-3 text-sm [&_svg]:size-4',
        md: 'h-10 px-4 text-sm [&_svg]:size-4',
        lg: 'h-12 px-6 text-base [&_svg]:size-5',
        icon: 'size-10 [&_svg]:size-5',
        'icon-sm': 'size-8 [&_svg]:size-4',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;

export function Button({
  className,
  variant,
  size,
  type = 'button',
  ...props
}: ComponentProps<'button'> & ButtonVariantProps) {
  return (
    <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}

/** Link de navegação com a aparência de botão. */
export function ButtonLink({
  className,
  variant,
  size,
  ...props
}: ComponentProps<typeof Link> & ButtonVariantProps) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
