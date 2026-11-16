import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-2 pt-8 pb-6 sm:pt-12', className)}>
      <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">{title}</h1>
      {description && <p className="max-w-2xl text-pretty text-fg-muted">{description}</p>}
    </header>
  );
}
