import { describe, expect, it } from 'vitest';

import { computeIdf, cosineSimilarity, toWeightedVector } from './vector';

const vector = (features: string[], idf = new Map<string, number>()) =>
  toWeightedVector(new Map(features.map((feature) => [feature, 1])), idf);

describe('computeIdf', () => {
  it('dá mais peso às características raras', () => {
    const idf = computeIdf([['genre:drama', 'keyword:space'], ['genre:drama'], ['genre:drama']]);

    expect(idf.get('keyword:space')).toBeGreaterThan(idf.get('genre:drama') ?? Infinity);
  });
});

describe('cosineSimilarity', () => {
  it('é 1 para vetores iguais e 0 para vetores sem nada em comum', () => {
    expect(cosineSimilarity(vector(['a', 'b']), vector(['a', 'b']))).toBeCloseTo(1);
    expect(cosineSimilarity(vector(['a']), vector(['b']))).toBe(0);
  });

  it('é 0 quando um dos vetores está vazio', () => {
    expect(cosineSimilarity(vector([]), vector(['a']))).toBe(0);
  });

  it('fica entre 0 e 1 quando há sobreposição parcial', () => {
    const similarity = cosineSimilarity(vector(['a', 'b']), vector(['b', 'c']));
    expect(similarity).toBeGreaterThan(0);
    expect(similarity).toBeLessThan(1);
  });
});
