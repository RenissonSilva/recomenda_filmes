import type { CanonicalGenre } from '@/domain/genres';
import type {
  MediaCategory,
  MediaDetails,
  MediaKey,
  MediaSummary,
  MediaType,
} from '@/domain/media';

/** Título avaliado pelo usuário, usado como referência ("semente") do gosto dele. */
export interface Seed {
  key: MediaKey;
  media: MediaDetails;
  /** Nota convertida em peso: −2 (Odeio) … +2 (Ótimo). */
  score: number;
}

/** Título que pode ser recomendado. */
export interface Candidate {
  key: MediaKey;
  media: MediaSummary | MediaDetails;
  /**
   * Bônus de similaridade por semente quando há um vínculo direto entre os dois títulos
   * (o TMDB recomenda um a partir do outro, ou ambos são do mesmo diretor/criador).
   */
  linkBoosts: Map<MediaKey, number>;
}

export interface Neighbor {
  seed: Seed;
  similarity: number;
}

export interface ScoredCandidate extends Candidate {
  /** Chance estimada de o usuário gostar do título (0 … 1). */
  match: number;
  /** Sementes mais parecidas que sustentam a previsão. */
  neighbors: Neighbor[];
  /** Placar final (compatibilidade + ajuste de qualidade): define a ordem e a %. */
  score: number;
}

/**
 * Nível de detalhe usado na comparação: `basic` usa só o que vem nas listagens
 * (gêneros, idioma, ano); `full` inclui palavras-chave, elenco e direção.
 */
export type FeatureLevel = 'basic' | 'full';

/** Dependências externas do recomendador (implementadas pelo catálogo do TMDB). */
export interface RecommenderCatalog {
  getTitleDetails(mediaType: MediaType, id: number): Promise<MediaDetails | null>;
  /** Títulos bem avaliados da seção que têm todos os gêneros informados. */
  discoverTopRatedByGenres(
    category: MediaCategory,
    genres: readonly CanonicalGenre[],
  ): Promise<MediaSummary[]>;
  /** Filmes dirigidos e séries criadas pela pessoa. */
  getCreatorWorks(personId: number): Promise<MediaSummary[]>;
}
