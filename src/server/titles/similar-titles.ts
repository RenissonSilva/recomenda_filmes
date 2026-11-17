import 'server-only';

import { cacheLife } from 'next/cache';

import type { MediaSummary, MediaType } from '@/domain/media';

import { findSimilarTitles, type SimilarTitlesCatalog } from '../similar-titles/engine';
import {
  discoverByKeywords,
  discoverTopRatedByGenres,
  getKeywordFrequency,
  getTitleDetails,
  getTitleKeywords,
} from '../tmdb/catalog';

const catalog: SimilarTitlesCatalog = {
  getKeywordFrequency,
  getTitleKeywords,
  discoverByKeywords,
  discoverTopRatedByGenres,
};

/** Títulos parecidos (enredo e gênero) com o título informado, do mais para o menos parecido. */
export async function getSimilarTitles(mediaType: MediaType, id: number): Promise<MediaSummary[]> {
  'use cache';
  cacheLife('days');

  const details = await getTitleDetails(mediaType, id);
  return details ? findSimilarTitles(details, catalog) : [];
}
