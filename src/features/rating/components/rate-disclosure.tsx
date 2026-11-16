'use client';

import { Eye } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import type { MediaSummary } from '@/domain/media';
import type { RatingValue } from '@/domain/rating';

import { RatingButtons } from './rating-buttons';

interface RateDisclosureProps {
  media: MediaSummary;
  onRated?: (value: RatingValue | null) => void;
}

/** "Já vi — avaliar": mostra a escala de avaliação só quando o usuário pede. */
export function RateDisclosure({ media, onRated }: RateDisclosureProps) {
  const [open, setOpen] = useState(false);

  if (open) return <RatingButtons media={media} onRated={onRated} />;

  return (
    <Button variant="secondary" size="sm" onClick={() => setOpen(true)} className="w-full">
      <Eye aria-hidden />
      Já vi — avaliar
    </Button>
  );
}
