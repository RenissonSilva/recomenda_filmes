import type { MediaFilter, MediaKey, MediaSummary, MediaType } from './media';
import type { RatingValue } from './rating';

/** Quantidade mínima de avaliações para liberar as recomendações. */
export const MIN_RATINGS_FOR_RECOMMENDATIONS = 5;

/** Título avaliado pelo usuário que ajudou a gerar a recomendação. */
export interface RecommendationReason {
  key: MediaKey;
  title: string;
}

export interface Recommendation {
  media: MediaSummary;
  /** Compatibilidade estimada com o gosto do usuário (1–99). */
  matchPercent: number;
  /** "Porque você curtiu X e Y". */
  becauseOf: RecommendationReason[];
  /** Gêneros em comum com o perfil — usados quando não há um título específico para citar. */
  matchedGenres: string[];
}

export interface RatedTitleInput {
  mediaType: MediaType;
  id: number;
  value: RatingValue;
}

export interface RecommendationRequest {
  /** Avaliações do usuário, das mais recentes para as mais antigas. */
  ratings: RatedTitleInput[];
  /** Títulos que não devem ser recomendados (ex.: "Quero ver" e "Não tenho interesse"). */
  excludeKeys: MediaKey[];
  filter: MediaFilter;
  limit?: number;
}

export interface RecommendationResponse {
  items: Recommendation[];
}
