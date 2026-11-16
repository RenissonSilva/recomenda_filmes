import { toCanonicalGenres } from '@/domain/genres';
import type { MediaDetails, MediaSummary } from '@/domain/media';

import { RECOMMENDER_CONFIG } from './config';
import type { FeatureLevel } from './types';
import {
  cosineSimilarity,
  toWeightedVector,
  type FeatureVector,
  type IdfTable,
  type WeightedVector,
} from './vector';

/** Características de um título, agrupadas por natureza. */
export interface TitleFeatures {
  genres: FeatureVector;
  keywords: FeatureVector;
  people: FeatureVector;
  language: string;
  year: number | null;
}

export interface TitleVectors {
  genres: WeightedVector;
  keywords: WeightedVector;
  people: WeightedVector;
  language: string;
  year: number | null;
}

export function isDetailed(media: MediaSummary | MediaDetails): media is MediaDetails {
  return 'keywords' in media && 'cast' in media;
}

export function extractFeatures(
  media: MediaSummary | MediaDetails,
  level: FeatureLevel,
): TitleFeatures {
  const { maxKeywords, maxCast, creatorWeight } = RECOMMENDER_CONFIG;

  const genres = new Map(toCanonicalGenres(media.genreIds).map((genre) => [`genre:${genre}`, 1]));
  const keywords = new Map<string, number>();
  const people = new Map<string, number>();

  if (level === 'full' && isDetailed(media)) {
    for (const keyword of media.keywords.slice(0, maxKeywords)) {
      keywords.set(`keyword:${keyword.id}`, 1);
    }
    for (const person of media.cast.slice(0, maxCast)) {
      people.set(`person:${person.id}`, 1);
    }
    for (const person of media.creators) {
      people.set(`person:${person.id}`, creatorWeight);
    }
  }

  return { genres, keywords, people, language: media.originalLanguage, year: media.releaseYear };
}

export function featureKeys(features: TitleFeatures): string[] {
  return [...features.genres.keys(), ...features.keywords.keys(), ...features.people.keys()];
}

export function vectorize(features: TitleFeatures, idf: IdfTable): TitleVectors {
  return {
    genres: toWeightedVector(features.genres, idf),
    keywords: toWeightedVector(features.keywords, idf),
    people: toWeightedVector(features.people, idf),
    language: features.language,
    year: features.year,
  };
}

/**
 * Similaridade de conteúdo entre dois títulos (0 a 1).
 * Gêneros, palavras-chave e pessoas definem a semelhança; idioma e época apenas a modulam,
 * para que dois títulos sem nada em comum não pareçam parecidos só por serem do mesmo ano.
 */
export function contentSimilarity(a: TitleVectors, b: TitleVectors, level: FeatureLevel): number {
  const weights = RECOMMENDER_CONFIG.similarityWeights;

  const content =
    level === 'basic'
      ? RECOMMENDER_CONFIG.basicSimilarityWeight * cosineSimilarity(a.genres, b.genres)
      : (weights.genres * cosineSimilarity(a.genres, b.genres) +
          weights.keywords * cosineSimilarity(a.keywords, b.keywords) +
          weights.people * cosineSimilarity(a.people, b.people)) /
        (weights.genres + weights.keywords + weights.people);

  return content * languageFactor(a.language, b.language) * eraFactor(a.year, b.year);
}

function languageFactor(a: string, b: string): number {
  return a && a === b ? 1 : RECOMMENDER_CONFIG.differentLanguageFactor;
}

function eraFactor(a: number | null, b: number | null): number {
  if (a === null || b === null) return 1;
  const { maxEraPenalty, eraSpanYears } = RECOMMENDER_CONFIG;
  return 1 - maxEraPenalty * Math.min(Math.abs(a - b) / eraSpanYears, 1);
}
