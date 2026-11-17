import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

interface TitleSectionProps {
  /** Identificador único na página (usado para ligar a seção ao seu título). */
  id: string;
  title: ReactNode;
  /** Linha de apoio abaixo do título. */
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Seção com título da página de detalhes (elenco, onde assistir, outras obras, parecidos). */
export function TitleSection({ id, title, description, children, className }: TitleSectionProps) {
  const headingId = `${id}-heading`;
  return (
    <section aria-labelledby={headingId} className={cn('flex flex-col gap-4', className)}>
      <div className="flex flex-col gap-1">
        <h2 id={headingId} className="text-xl font-semibold tracking-tight text-balance">
          {title}
        </h2>
        {description && <p className="text-sm text-fg-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}
