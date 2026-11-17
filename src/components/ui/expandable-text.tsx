'use client';

import { useState } from 'react';

import { cn } from '@/lib/cn';

interface ExpandableTextProps {
  text: string;
  /** Textos até este tamanho aparecem inteiros, sem o botão "Ler mais". */
  collapseAfter?: number;
  className?: string;
}

/** Texto longo (ex.: biografia) recolhido em poucas linhas, com "Ler mais". */
export function ExpandableText({ text, collapseAfter = 400, className }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const collapsible = text.length > collapseAfter;

  return (
    <div className={cn('flex flex-col items-start gap-1', className)}>
      <p
        className={cn(
          'leading-relaxed text-pretty whitespace-pre-line',
          collapsible && !expanded && 'line-clamp-5',
        )}
      >
        {text}
      </p>
      {collapsible && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          className="cursor-pointer rounded text-sm font-medium text-fg-muted focus-ring hover:text-fg"
        >
          {expanded ? 'Ler menos' : 'Ler mais'}
        </button>
      )}
    </div>
  );
}
