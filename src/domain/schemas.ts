import { z } from 'zod';

import { CANONICAL_GENRES } from './genres';
import {
  MEDIA_FILTERS,
  MEDIA_TYPES,
  parseMediaKey,
  type MediaKey,
  type MediaSummary,
} from './media';
import { RATING_VALUES } from './rating';
import type { RecommendationRequest } from './recommendation';
import { DISCOVER_SORTS } from './title-sort';

/**
 * Schemas de validação (Zod) dos contratos do domínio.
 * Usados para validar entradas da API e arquivos de backup importados pelo usuário.
 */

export const mediaTypeSchema = z.enum(MEDIA_TYPES);
export const mediaFilterSchema = z.enum(MEDIA_FILTERS);
export const ratingValueSchema = z.enum(RATING_VALUES);
export const canonicalGenreSchema = z.enum(CANONICAL_GENRES);
export const discoverSortSchema = z.enum(DISCOVER_SORTS);

export const mediaKeySchema = z.custom<MediaKey>(
  (value) => typeof value === 'string' && parseMediaKey(value) !== null,
  { message: 'Identificador de título inválido.' },
);

export const mediaSummarySchema = z.object({
  id: z.number().int().positive(),
  mediaType: mediaTypeSchema,
  title: z.string(),
  originalTitle: z.string(),
  posterPath: z.string().nullable(),
  backdropPath: z.string().nullable(),
  releaseYear: z.number().int().nullable(),
  genreIds: z.array(z.number().int()),
  originalLanguage: z.string(),
  voteAverage: z.number(),
  voteCount: z.number(),
  popularity: z.number(),
}) satisfies z.ZodType<MediaSummary>;

export const recommendationRequestSchema = z.object({
  ratings: z
    .array(
      z.object({
        mediaType: mediaTypeSchema,
        id: z.number().int().positive(),
        value: ratingValueSchema,
      }),
    )
    .max(5000),
  excludeKeys: z.array(mediaKeySchema).max(10000).default([]),
  filter: mediaFilterSchema.default('all'),
  limit: z.number().int().min(1).max(60).optional(),
}) satisfies z.ZodType<RecommendationRequest, unknown>;
