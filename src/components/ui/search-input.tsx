'use client';

import { Search, X } from 'lucide-react';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/cn';

interface SearchInputProps extends Omit<ComponentProps<'input'>, 'value' | 'onChange' | 'type'> {
  value: string;
  onValueChange: (value: string) => void;
}

export function SearchInput({ value, onValueChange, className, ...props }: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-fg-subtle"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        className="h-12 w-full rounded-full border border-line bg-surface px-12 text-base text-fg focus-ring placeholder:text-fg-subtle"
        {...props}
      />
      {value && (
        <button
          type="button"
          aria-label="Limpar busca"
          onClick={() => onValueChange('')}
          className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-fg-muted focus-ring hover:bg-surface-2 hover:text-fg"
        >
          <X aria-hidden className="size-4" />
        </button>
      )}
    </div>
  );
}
