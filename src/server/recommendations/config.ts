/**
 * Parâmetros do recomendador, centralizados para facilitar a calibragem.
 * Veja a explicação do algoritmo no README (seção "Como a recomendação funciona").
 */
export const RECOMMENDER_CONFIG = {
  /** Máximo de títulos avaliados usados como referência (as notas mais fortes primeiro). */
  maxSeeds: 30,
  /** Requisições simultâneas ao TMDB. */
  concurrency: 10,
  /**
   * Quantos candidatos de cada seção (filmes, séries e animes) passam para a 2ª etapa, com detalhes
   * completos. Na prática a cota de animes só enche para quem avalia animes.
   */
  detailedCandidatesPerCategory: 25,
  /** Quantidade padrão de recomendações devolvidas. */
  defaultLimit: 24,
  /** Ignora títulos com poucos votos no TMDB (normalmente obscuros ou com dados incompletos). */
  minVoteCount: 100,

  /** Peso de cada grupo de características na similaridade de conteúdo (etapa 2). */
  similarityWeights: { genres: 0.45, keywords: 0.4, people: 0.15 },
  /**
   * Na etapa 1 só há gêneros, um sinal fraco: a similaridade vale menos,
   * para que os vínculos do próprio TMDB (sinal colaborativo) pesem mais na pré-seleção.
   */
  basicSimilarityWeight: 0.5,
  /** Direção/criação pesa mais do que elenco no grupo "pessoas". */
  creatorWeight: 1.5,
  maxKeywords: 25,
  maxCast: 6,
  /** Multiplicador quando os títulos têm idiomas originais diferentes. */
  differentLanguageFactor: 0.8,
  /** Penalidade máxima por distância de lançamento, atingida a partir de `eraSpanYears`. */
  maxEraPenalty: 0.15,
  eraSpanYears: 40,
  /**
   * Bônus de similaridade quando o TMDB recomenda um título a partir de outro
   * (com base no comportamento dos usuários dele). Vale integralmente no topo da lista
   * e cai até a metade no fim dela.
   */
  linkBoost: 0.35,
  /** Bônus de similaridade entre obras do mesmo diretor (filmes) ou criador (séries). */
  creatorLinkBoost: 0.3,

  /** k do kNN: quantos títulos avaliados mais parecidos entram na previsão. */
  neighbors: 12,
  /** Similaridade mínima para um título avaliado influenciar a previsão. */
  minSimilarity: 0.15,
  /** Ajuste máximo, em pontos percentuais, pela qualidade geral do título no TMDB (±6%). */
  qualityWeight: 0.06,
  /** Compatibilidade mínima para um título ser recomendado. */
  minMatch: 0.3,

  /** Quantos gêneros favoritos usar para buscar títulos bem avaliados extras. */
  discoverGenres: 2,
  /** Quantos diretores/criadores favoritos usar para buscar outras obras deles. */
  discoverCreators: 4,
  /** Obras mais votadas de cada diretor/criador favorito que entram como candidatas. */
  maxWorksPerCreator: 20,
  /** Títulos citados em "Porque você curtiu…" e similaridade mínima para citar um título. */
  maxReasons: 2,
  minReasonSimilarity: 0.3,
  /** Gêneros citados quando não há título específico para explicar a recomendação. */
  maxMatchedGenres: 2,
} as const;
