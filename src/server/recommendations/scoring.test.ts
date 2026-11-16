import { describe, expect, it } from 'vitest';

import { buildDetails } from '@test/fixtures/media';

import { finalScore, linkStrength, predictMatch, qualityScore, toMatchPercent } from './scoring';
import type { Seed } from './types';

const seed = (score: number): Seed => {
  const media = buildDetails();
  return { key: `movie:${media.id}`, media, score };
};

const LOVE = 2;
const LIKE = 1;
const HATE = -2;

describe('predictMatch', () => {
  it('é zero sem títulos parecidos', () => {
    expect(predictMatch([]).match).toBe(0);
    expect(predictMatch([{ seed: seed(LOVE), similarity: 0.01 }]).match).toBe(0);
  });

  it('um único título muito parecido e amado já gera compatibilidade alta', () => {
    // Ex.: quem amou Breaking Bad e vê Better Call Saul.
    expect(predictMatch([{ seed: seed(LOVE), similarity: 0.95 }]).match).toBeCloseTo(0.95);
  });

  it('"Bom" pesa metade de "Ótimo"', () => {
    const loved = predictMatch([{ seed: seed(LOVE), similarity: 0.8 }]).match;
    const liked = predictMatch([{ seed: seed(LIKE), similarity: 0.8 }]).match;
    expect(liked).toBeCloseTo(loved / 2);
  });

  it('vários títulos pouco parecidos se somam, com retorno decrescente', () => {
    const one = predictMatch([{ seed: seed(LOVE), similarity: 0.4 }]).match;
    const three = predictMatch(
      [0.4, 0.4, 0.4].map((similarity) => ({ seed: seed(LOVE), similarity })),
    ).match;

    expect(three).toBeGreaterThan(one);
    expect(three).toBeLessThan(3 * one);
  });

  it('parecer com algo que o usuário odeia derruba a compatibilidade', () => {
    const alone = predictMatch([{ seed: seed(LOVE), similarity: 0.8 }]).match;
    const withHated = predictMatch([
      { seed: seed(LOVE), similarity: 0.8 },
      { seed: seed(HATE), similarity: 0.6 },
    ]).match;

    expect(withHated).toBeCloseTo(alone * 0.4);
    expect(predictMatch([{ seed: seed(HATE), similarity: 0.9 }]).match).toBe(0);
  });

  it('devolve os vizinhos do mais parecido para o menos parecido', () => {
    const { neighbors } = predictMatch([
      { seed: seed(LIKE), similarity: 0.3 },
      { seed: seed(LOVE), similarity: 0.9 },
    ]);
    expect(neighbors.map((neighbor) => neighbor.similarity)).toEqual([0.9, 0.3]);
  });
});

describe('finalScore / toMatchPercent', () => {
  it('converte a compatibilidade em porcentagem entre 1% e 99%', () => {
    expect(toMatchPercent(0.874)).toBe(87);
    expect(toMatchPercent(1.2)).toBe(99);
    expect(toMatchPercent(-0.1)).toBe(1);
  });

  it('ajusta levemente pela qualidade do título no TMDB', () => {
    const acclaimed = finalScore(0.8, { voteAverage: 8.8, voteCount: 20000 });
    const panned = finalScore(0.8, { voteAverage: 4.5, voteCount: 20000 });

    expect(acclaimed).toBeGreaterThan(0.8);
    expect(panned).toBeLessThan(0.8);
    expect(acclaimed - panned).toBeLessThanOrEqual(0.12);
  });
});

describe('qualityScore', () => {
  it('favorece títulos bem avaliados por muita gente', () => {
    const acclaimed = qualityScore({ voteAverage: 8.5, voteCount: 20000 });
    const fewVotes = qualityScore({ voteAverage: 9.5, voteCount: 3 });

    expect(acclaimed).toBeGreaterThan(fewVotes);
    expect(qualityScore({ voteAverage: 4, voteCount: 20000 })).toBeLessThan(0);
  });
});

describe('linkStrength', () => {
  it('é maior no topo da lista de recomendações do TMDB', () => {
    expect(linkStrength(0, 20)).toBeGreaterThan(linkStrength(19, 20));
    expect(linkStrength(19, 20)).toBeGreaterThan(linkStrength(0, 20) / 2);
  });
});
