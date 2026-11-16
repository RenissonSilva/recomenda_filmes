'use client';

import { MEDIA_FILTERS, MEDIA_FILTER_LABELS, type MediaFilter } from '@/domain/media';

import { SegmentedControl } from '../ui/segmented-control';

const OPTIONS = MEDIA_FILTERS.map((filter) => ({
  value: filter,
  label: MEDIA_FILTER_LABELS[filter],
}));

interface MediaFilterControlProps {
  value: MediaFilter;
  onChange: (value: MediaFilter) => void;
  className?: string;
}

/** Filtro "Tudo / Filmes / Séries / Animes". */
export function MediaFilterControl({ value, onChange, className }: MediaFilterControlProps) {
  return (
    <SegmentedControl
      label="Filtrar por seção"
      options={OPTIONS}
      value={value}
      onChange={onChange}
      className={className}
    />
  );
}
