/**
 * Parâmetros da busca de títulos parecidos (seção "Parecidos com…" da página do título).
 * Veja a explicação do algoritmo no README (seção "Títulos parecidos").
 */
export const SIMILAR_TITLES_CONFIG = {
  /** Palavras-chave do título levadas em conta. */
  maxKeywords: 20,
  /** Quantas das palavras-chave mais específicas (as mais raras no TMDB) buscam candidatos. */
  searchKeywords: 10,
  /** Quantos gêneros do título buscam candidatos bem avaliados (o título precisa ter todos). */
  searchGenres: 2,
  /** Requisições simultâneas ao TMDB. */
  concurrency: 8,
  /** Ignora títulos com poucos votos no TMDB (normalmente obscuros ou com dados incompletos). */
  minVoteCount: 100,

  /** Pré-selecionados de cada seção que têm as palavras-chave carregadas para a comparação final. */
  shortlistPerCategory: 15,
  /**
   * Bônus da pré-seleção para quem já tem um vínculo com o título: divide uma das palavras-chave
   * mais específicas ou está entre as recomendações do TMDB.
   */
  shortlistLinkBonus: 0.3,

  /** Peso de cada aspecto: o enredo (palavras-chave) pesa mais que o gênero; elenco fica de fora. */
  weights: { genres: 0.35, keywords: 0.65, people: 0 },
  /** Similaridade mínima (0 a 1) para o título aparecer. */
  minSimilarity: 0.25,
  /** Máximo de títulos devolvidos de cada seção (filmes, séries e animes). */
  maxPerCategory: 18,

  /** Ordem de grandeza do catálogo do TMDB, para converter a frequência em raridade (IDF). */
  catalogSize: 1_000_000,
  /** Frequência assumida para as palavras-chave dos candidatos que não foram consultadas. */
  defaultKeywordFrequency: 2_000,
} as const;
