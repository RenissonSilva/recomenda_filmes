'use client';

import { TITLE_SORT_LABELS, type TitleSort } from '@/domain/title-sort';

import { Select } from '../ui/select';

interface TitleSortSelectProps<T extends TitleSort> {
  /** Ordenações oferecidas, na ordem em que aparecem. */
  sorts: readonly T[];
  value: T;
  onChange: (value: T) => void;
}

/** Seletor "Ordenar por" das listas de títulos. */
export function TitleSortSelect<T extends TitleSort>({
  sorts,
  value,
  onChange,
}: TitleSortSelectProps<T>) {
  return (
    <label className="flex items-center gap-2 text-sm text-fg-muted">
      Ordenar por
      <Select value={value} onChange={(event) => onChange(event.target.value as T)}>
        {sorts.map((option) => (
          <option key={option} value={option}>
            {TITLE_SORT_LABELS[option]}
          </option>
        ))}
      </Select>
    </label>
  );
}
