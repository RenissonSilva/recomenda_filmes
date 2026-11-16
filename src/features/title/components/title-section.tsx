import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

interface TitleSectionProps {
  /** Identificador único na página (usado para ligar a seção ao seu título). */
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
}

/** Seção com título da página de detalhes (elenco, onde assistir, parecidos). */
export function TitleSection({ id, title, children, className }: TitleSectionProps) {
  const headingId = `${id}-heading`;
  return (
    <section aria-labelledby={headingId} className={cn('flex flex-col gap-4', className)}>
      <h2 id={headingId} className="text-xl font-semibold tracking-tight">
        {title}
      </h2>
      {children}
    </section>
  );
}
