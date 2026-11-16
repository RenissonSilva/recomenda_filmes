import type { MediaSummary } from '@/domain/media';
import { RATING_OPTIONS } from '@/domain/rating';
import { clamp } from '@/lib/math';

import { RECOMMENDER_CONFIG } from './config';
import type { Neighbor } from './types';

/** Maior peso absoluto da escala (2 = Ótimo/Odeio). */
const MAX_SCORE = Math.max(...RATING_OPTIONS.map((option) => Math.abs(option.score)));

/** Média e votos "a priori" da média bayesiana usada para medir a qualidade de um título. */
const QUALITY_PRIOR_MEAN = 6.5;
const QUALITY_PRIOR_VOTES = 500;

export interface Prediction {
  /** Chance estimada de o usuário gostar do título (0 … 1). */
  match: number;
  /** Vizinhos usados na previsão, do mais parecido para o menos parecido. */
  neighbors: Neighbor[];
}

/**
 * Compatibilidade por k-vizinhos mais próximos (kNN item a item).
 *
 * Cada título avaliado parecido é um indício independente: de que o usuário vai gostar
 * (se gostou daquele) ou de que não vai (se não gostou). A força do indício é
 * `similaridade × peso da nota` (Ótimo/Odeio = 1; Bom/Ruim = 0,5). Os indícios são
 * combinados como um "OU ruidoso":
 *
 *   gostar          = 1 − Π (1 − força dos parecidos de que ele gostou)
 *   não gostar      = 1 − Π (1 − força dos parecidos de que ele não gostou)
 *   compatibilidade = gostar × (1 − não gostar)
 *
 * Assim, um único título muito parecido já é evidência forte, e vários pouco parecidos
 * se somam com retorno decrescente.
 */
export function predictMatch(neighbors: readonly Neighbor[]): Prediction {
  const { neighbors: k, minSimilarity } = RECOMMENDER_CONFIG;

  const nearest = neighbors
    .filter((neighbor) => neighbor.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k);

  let missesLike = 1;
  let missesDislike = 1;
  for (const { seed, similarity } of nearest) {
    const strength = similarity * (Math.abs(seed.score) / MAX_SCORE);
    if (seed.score > 0) missesLike *= 1 - strength;
    if (seed.score < 0) missesDislike *= 1 - strength;
  }

  return { match: (1 - missesLike) * missesDislike, neighbors: nearest };
}

/** Placar final: compatibilidade + um pequeno ajuste pela qualidade geral do título no TMDB. */
export function finalScore(
  match: number,
  media: Pick<MediaSummary, 'voteAverage' | 'voteCount'>,
): number {
  return match + RECOMMENDER_CONFIG.qualityWeight * qualityScore(media);
}

/** Converte o placar final em porcentagem de compatibilidade (1–99%). */
export function toMatchPercent(score: number): number {
  return Math.round(clamp(score * 100, 1, 99));
}

/** Qualidade geral do título no TMDB, entre −1 e 1 (média bayesiana: poucos votos pesam pouco). */
export function qualityScore(media: Pick<MediaSummary, 'voteAverage' | 'voteCount'>): number {
  const bayesianAverage =
    (media.voteCount * media.voteAverage + QUALITY_PRIOR_VOTES * QUALITY_PRIOR_MEAN) /
    (media.voteCount + QUALITY_PRIOR_VOTES);
  return clamp((bayesianAverage - QUALITY_PRIOR_MEAN) / 2, -1, 1);
}

/** Bônus de similaridade para um título na posição `rank` das recomendações do TMDB. */
export function linkStrength(rank: number, listSize: number): number {
  // 1 no topo da lista, caindo até ~0,5 no final.
  const position = 1 - rank / (2 * Math.max(listSize, 1));
  return RECOMMENDER_CONFIG.linkBoost * position;
}
