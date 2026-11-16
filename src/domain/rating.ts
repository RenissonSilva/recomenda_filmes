/**
 * Escala de avaliação do usuário: Odeio, Ruim, Bom e Ótimo.
 * "Nunca vi" não é uma nota: é um marcador à parte (ver `features/library`).
 */

export const RATING_VALUES = ['hate', 'dislike', 'like', 'love'] as const;
export type RatingValue = (typeof RATING_VALUES)[number];

export interface RatingOption {
  value: RatingValue;
  label: string;
  /** Peso usado pelo recomendador: negativo = afasta, positivo = aproxima. */
  score: number;
}

/** Ordem de exibição: do mais negativo ao mais positivo. */
export const RATING_OPTIONS: readonly RatingOption[] = [
  { value: 'hate', label: 'Odeio', score: -2 },
  { value: 'dislike', label: 'Ruim', score: -1 },
  { value: 'like', label: 'Bom', score: 1 },
  { value: 'love', label: 'Ótimo', score: 2 },
];

export const RATING_SCORES = Object.fromEntries(
  RATING_OPTIONS.map((option) => [option.value, option.score]),
) as Record<RatingValue, number>;

export const RATING_LABELS = Object.fromEntries(
  RATING_OPTIONS.map((option) => [option.value, option.label]),
) as Record<RatingValue, string>;

/** Rótulo do marcador "não assisti", exibido junto da escala. */
export const UNSEEN_LABEL = 'Nunca vi';

export function isPositiveRating(value: RatingValue): boolean {
  return RATING_SCORES[value] > 0;
}
