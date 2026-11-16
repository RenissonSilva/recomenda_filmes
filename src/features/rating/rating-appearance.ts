import { Angry, Frown, Heart, Smile, type LucideIcon } from 'lucide-react';

import type { RatingValue } from '@/domain/rating';

interface RatingAppearance {
  icon: LucideIcon;
  /** Classes do botão selecionado. */
  selectedClassName: string;
  /** Cor de destaque (texto/ícone). */
  accentClassName: string;
}

/** Aparência visual de cada nota — a escala em si (rótulos e pesos) fica em `domain/rating`. */
export const RATING_APPEARANCE: Record<RatingValue, RatingAppearance> = {
  hate: {
    icon: Angry,
    selectedClassName: 'bg-rating-hate text-white',
    accentClassName: 'text-rating-hate',
  },
  dislike: {
    icon: Frown,
    selectedClassName: 'bg-rating-dislike text-white',
    accentClassName: 'text-rating-dislike',
  },
  like: {
    icon: Smile,
    selectedClassName: 'bg-rating-like text-white',
    accentClassName: 'text-rating-like',
  },
  love: {
    icon: Heart,
    selectedClassName: 'bg-rating-love text-white',
    accentClassName: 'text-rating-love',
  },
};
