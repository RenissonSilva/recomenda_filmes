/**
 * Operações com vetores esparsos de características (ex.: `genre:drama`, `keyword:1612`).
 */

export type FeatureVector = ReadonlyMap<string, number>;

/** Vetor já ponderado pelo IDF e com a norma pré-calculada (evita recalcular a cada comparação). */
export interface WeightedVector {
  weights: FeatureVector;
  norm: number;
}

export type IdfTable = ReadonlyMap<string, number>;

/**
 * IDF (inverse document frequency): características raras (ex.: "viagem no tempo")
 * pesam mais do que as muito comuns (ex.: "drama").
 */
export function computeIdf(documents: Iterable<Iterable<string>>): IdfTable {
  const documentFrequency = new Map<string, number>();
  let documentCount = 0;

  for (const features of documents) {
    documentCount++;
    for (const feature of new Set(features)) {
      documentFrequency.set(feature, (documentFrequency.get(feature) ?? 0) + 1);
    }
  }

  const idf = new Map<string, number>();
  for (const [feature, frequency] of documentFrequency) {
    idf.set(feature, Math.log((documentCount + 1) / (frequency + 1)) + 1);
  }
  return idf;
}

export function toWeightedVector(features: FeatureVector, idf: IdfTable): WeightedVector {
  const weights = new Map<string, number>();
  let sumOfSquares = 0;

  for (const [feature, weight] of features) {
    const weighted = weight * (idf.get(feature) ?? 1);
    weights.set(feature, weighted);
    sumOfSquares += weighted * weighted;
  }

  return { weights, norm: Math.sqrt(sumOfSquares) };
}

/** Similaridade do cosseno entre 0 (nada em comum) e 1 (idênticos). */
export function cosineSimilarity(a: WeightedVector, b: WeightedVector): number {
  if (a.norm === 0 || b.norm === 0) return 0;

  const [smaller, larger] = a.weights.size <= b.weights.size ? [a, b] : [b, a];
  let dotProduct = 0;
  for (const [feature, weight] of smaller.weights) {
    dotProduct += weight * (larger.weights.get(feature) ?? 0);
  }

  return dotProduct / (a.norm * b.norm);
}
