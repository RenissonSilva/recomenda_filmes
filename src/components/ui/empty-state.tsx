import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/** Mensagem centralizada para listas vazias, estados bloqueados e afins. */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-4 rounded-2xl border border-dashed border-line px-6 py-14 text-center',
        className,
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-surface-2 text-fg-muted [&_svg]:size-7">
        {icon}
      </div>
      <div className="flex max-w-md flex-col gap-1.5">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <div className="text-sm text-pretty text-fg-muted">{description}</div>}
      </div>
      {action}
    </div>
  );
}
