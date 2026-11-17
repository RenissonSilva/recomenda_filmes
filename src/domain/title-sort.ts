/**
 * Ordenações das listas de títulos (outras obras, parecidos e filmografia).
 */

import type { MediaSummary } from './media';

export const TITLE_SORTS = ['rating', 'popularity', 'recent', 'similarity'] as const;
export type TitleSort = (typeof TITLE_SORTS)[number];

export const TITLE_SORT_LABELS: Record<TitleSort, string> = {
  rating: 'Nota',
  popularity: 'Popularidade',
  recent: 'Mais recentes',
  similarity: 'Mais parecidos',
};

/**
 * Mínimo de votos para a nota do TMDB ser levada em conta. Sem isso, um título com dois votos
 * 10 passaria à frente dos clássicos: abaixo do mínimo ele vai para o fim da ordenação por nota
 * (e o card não exibe a nota).
 */
export const MIN_VOTES_FOR_RATING = 50;

type RatedMedia = Pick<MediaSummary, 'voteAverage' | 'voteCount'>;
type SortableMedia = Pick<MediaSummary, 'voteAverage' | 'voteCount' | 'releaseYear'>;
type Comparator = (a: SortableMedia, b: SortableMedia) => number;

export function hasReliableRating(media: RatedMedia): boolean {
  return media.voteCount >= MIN_VOTES_FOR_RATING && media.voteAverage > 0;
}

const byVoteCount: Comparator = (a, b) => b.voteCount - a.voteCount;

const COMPARATORS: Record<Exclude<TitleSort, 'similarity'>, Comparator> = {
  // Nota maior primeiro; títulos sem votos suficientes no fim, dos mais aos menos votados.
  rating: (a, b) => {
    const reliableA = hasReliableRating(a);
    const reliableB = hasReliableRating(b);
    if (reliableA !== reliableB) return reliableA ? -1 : 1;
    return (reliableA ? b.voteAverage - a.voteAverage : 0) || byVoteCount(a, b);
  },
  // Total de votos: mede quantas pessoas assistiram, e não o que está em alta hoje.
  popularity: byVoteCount,
  // Sem data de lançamento vai para o fim.
  recent: (a, b) => (b.releaseYear ?? 0) - (a.releaseYear ?? 0) || byVoteCount(a, b),
};

/**
 * Devolve uma cópia ordenada. Em `similarity` a ordem recebida é mantida
 * (a lista já chega do servidor do mais para o menos parecido).
 */
export function sortTitles<T>(
  items: readonly T[],
  sort: TitleSort,
  getMedia: (item: T) => SortableMedia,
): T[] {
  if (sort === 'similarity') return [...items];
  const compare = COMPARATORS[sort];
  return [...items].sort((a, b) => compare(getMedia(a), getMedia(b)));
}
