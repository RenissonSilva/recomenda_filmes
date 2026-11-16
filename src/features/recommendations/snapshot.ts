import type { MediaKey } from '@/domain/media';
import { isPositiveRating } from '@/domain/rating';
import { MIN_RATINGS_FOR_RECOMMENDATIONS, type RatedTitleInput } from '@/domain/recommendation';
import {
  sortedEntries,
  type EntryMap,
  type LibraryData,
  type RatedEntry,
} from '@/features/library/library-state';
import { hashString } from '@/lib/hash';

/** "Foto" das avaliações usada para pedir recomendações ao servidor. */
export interface RecommendationSnapshot {
  /** Identifica o conjunto de avaliações — muda quando qualquer nota muda. */
  signature: string;
  /** Das mais recentes para as mais antigas. */
  ratings: RatedTitleInput[];
  excludeKeys: MediaKey[];
}

export function createRecommendationSnapshot(data: LibraryData): RecommendationSnapshot {
  return {
    signature: ratingsSignature(data.ratings),
    ratings: sortedEntries(data.ratings).map(({ media, value }) => ({
      mediaType: media.mediaType,
      id: media.id,
      value,
    })),
    excludeKeys: [...Object.keys(data.watchlist), ...Object.keys(data.dismissed)] as MediaKey[],
  };
}

/** Assinatura independente da ordem das avaliações. */
export function ratingsSignature(ratings: EntryMap<RatedEntry>): string {
  const parts = Object.entries(ratings)
    .flatMap(([key, entry]) => (entry ? [`${key}=${entry.value}`] : []))
    .sort();
  return hashString(parts.join('|'));
}

export interface RecommendationProgress {
  ratingCount: number;
  hasPositiveRating: boolean;
}

export function getRecommendationProgress(
  data: Pick<LibraryData, 'ratings'>,
): RecommendationProgress {
  const entries = Object.values(data.ratings);
  return {
    ratingCount: entries.length,
    hasPositiveRating: entries.some(
      (entry) => entry !== undefined && isPositiveRating(entry.value),
    ),
  };
}

/** As recomendações exigem um mínimo de avaliações, sendo ao menos uma positiva. */
export function isUnlocked(progress: RecommendationProgress): boolean {
  return progress.ratingCount >= MIN_RATINGS_FOR_RECOMMENDATIONS && progress.hasPositiveRating;
}
