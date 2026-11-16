import { describe, expect, it } from 'vitest';

import { getMediaKey } from '@/domain/media';
import { EMPTY_LIBRARY, dismissTitle, rateTitle, toggleWatchlist } from '@/domain/library';
import { buildMedia } from '@test/fixtures/media';

import {
  createRecommendationSnapshot,
  getRecommendationProgress,
  isUnlocked,
  ratingsSignature,
} from './snapshot';

const first = buildMedia({ title: 'Primeiro' });
const second = buildMedia({ title: 'Segundo', mediaType: 'tv' });

describe('ratingsSignature', () => {
  it('não depende da ordem em que as avaliações foram feitas', () => {
    const a = rateTitle(rateTitle(EMPTY_LIBRARY, first, 'love', '1'), second, 'like', '2');
    const b = rateTitle(rateTitle(EMPTY_LIBRARY, second, 'like', '1'), first, 'love', '2');

    expect(ratingsSignature(a.ratings)).toBe(ratingsSignature(b.ratings));
  });

  it('muda quando uma nota muda', () => {
    const before = rateTitle(EMPTY_LIBRARY, first, 'love', '1');
    const after = rateTitle(before, first, 'hate', '2');

    expect(ratingsSignature(before.ratings)).not.toBe(ratingsSignature(after.ratings));
  });
});

describe('createRecommendationSnapshot', () => {
  it('envia as avaliações da mais recente para a mais antiga e as exclusões', () => {
    const watchlisted = buildMedia();
    const dismissed = buildMedia();
    let data = rateTitle(EMPTY_LIBRARY, first, 'love', '2026-01-01');
    data = rateTitle(data, second, 'dislike', '2026-02-01');
    data = toggleWatchlist(data, watchlisted, '2026-02-01');
    data = dismissTitle(data, dismissed, '2026-02-01');

    const snapshot = createRecommendationSnapshot(data);

    expect(snapshot.ratings).toEqual([
      { mediaType: 'tv', id: second.id, value: 'dislike' },
      { mediaType: 'movie', id: first.id, value: 'love' },
    ]);
    expect(snapshot.excludeKeys).toEqual([getMediaKey(watchlisted), getMediaKey(dismissed)]);
  });
});

describe('isUnlocked', () => {
  it('exige 5 avaliações com pelo menos uma positiva', () => {
    expect(isUnlocked({ ratingCount: 4, hasPositiveRating: true })).toBe(false);
    expect(isUnlocked({ ratingCount: 5, hasPositiveRating: false })).toBe(false);
    expect(isUnlocked({ ratingCount: 5, hasPositiveRating: true })).toBe(true);
  });

  it('calcula o progresso a partir da biblioteca', () => {
    const data = rateTitle(rateTitle(EMPTY_LIBRARY, first, 'hate', '1'), second, 'like', '2');
    expect(getRecommendationProgress(data)).toEqual({ ratingCount: 2, hasPositiveRating: true });
  });
});
