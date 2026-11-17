import { describe, expect, it } from 'vitest';

import { buildMedia } from '@test/fixtures/media';

import type { MediaSummary } from './media';
import { hasReliableRating, MIN_VOTES_FOR_RATING, sortTitles } from './title-sort';

const titleOf = (media: MediaSummary) => media.title;
const identity = (media: MediaSummary) => media;

const classic = buildMedia({
  title: 'Clássico',
  voteAverage: 8.7,
  voteCount: 20_000,
  releaseYear: 1972,
});
const good = buildMedia({ title: 'Bom', voteAverage: 7.9, voteCount: 900, releaseYear: 2020 });
const hyped = buildMedia({
  title: 'Dois votos 10',
  voteAverage: 10,
  voteCount: 2,
  releaseYear: 2024,
});
const unknown = buildMedia({ title: 'Sem votos', voteAverage: 0, voteCount: 0, releaseYear: null });
const items = [hyped, good, unknown, classic];

describe('sortTitles', () => {
  it('por nota: maior primeiro, e os sem votos suficientes no fim', () => {
    expect(sortTitles(items, 'rating', identity).map(titleOf)).toEqual([
      'Clássico',
      'Bom',
      'Dois votos 10',
      'Sem votos',
    ]);
  });

  it('por popularidade: mais votados primeiro', () => {
    expect(sortTitles(items, 'popularity', identity).map(titleOf)).toEqual([
      'Clássico',
      'Bom',
      'Dois votos 10',
      'Sem votos',
    ]);
  });

  it('mais recentes primeiro, sem data no fim', () => {
    expect(sortTitles(items, 'recent', identity).map(titleOf)).toEqual([
      'Dois votos 10',
      'Bom',
      'Clássico',
      'Sem votos',
    ]);
  });

  it('em "mais parecidos" mantém a ordem recebida, sem alterar a lista original', () => {
    const sorted = sortTitles(items, 'similarity', identity);
    expect(sorted).toEqual(items);
    expect(sorted).not.toBe(items);
  });

  it('ordena itens que contêm um título', () => {
    const credits = items.map((media) => ({ media }));
    expect(sortTitles(credits, 'rating', (credit) => credit.media)[0]?.media).toBe(classic);
  });
});

describe('hasReliableRating', () => {
  it(`exige pelo menos ${MIN_VOTES_FOR_RATING} votos e uma nota`, () => {
    expect(hasReliableRating(good)).toBe(true);
    expect(hasReliableRating(hyped)).toBe(false);
    expect(hasReliableRating({ voteAverage: 0, voteCount: 500 })).toBe(false);
  });
});
