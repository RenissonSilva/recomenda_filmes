'use client';

import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
  /** Conteúdo extra ao lado do rótulo, ex.: contador. */
  suffix?: ReactNode;
}

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Descrição acessível do grupo, ex.: "Filtrar por tipo". */
  label: string;
  className?: string;
}

/** Grupo de botões de escolha única (filtros e abas simples). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'no-scrollbar inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1',
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium focus-ring transition-colors',
              selected ? 'bg-fg text-canvas' : 'text-fg-muted hover:text-fg',
            )}
          >
            {option.label}
            {option.suffix}
          </button>
        );
      })}
    </div>
  );
}
