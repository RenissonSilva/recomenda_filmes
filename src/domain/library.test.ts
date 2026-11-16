import { describe, expect, it } from 'vitest';

import { getMediaKey } from '@/domain/media';
import { buildMedia } from '@test/fixtures/media';

import {
  dismissTitle,
  EMPTY_LIBRARY,
  markUnseen,
  rateTitle,
  removeRating,
  sortedEntries,
  toggleWatchlist,
} from './library';

const NOW = '2026-11-16T12:00:00.000Z';
const LATER = '2026-11-16T13:00:00.000Z';

describe('library', () => {
  const media = buildMedia({ title: 'Duna' });
  const key = getMediaKey(media);

  it('avaliar tira o título de "Nunca vi", "Quero ver" e "Não tenho interesse"', () => {
    let data = markUnseen(EMPTY_LIBRARY, media, NOW);
    data = toggleWatchlist(data, media, NOW);
    data = dismissTitle(data, media, NOW);

    const rated = rateTitle(data, media, 'love', LATER);

    expect(rated.ratings[key]).toEqual({ media, value: 'love', ratedAt: LATER });
    expect(rated.unseen).toEqual({});
    expect(rated.watchlist).toEqual({});
    expect(rated.dismissed).toEqual({});
  });

  it('marcar "Nunca vi" remove a avaliação', () => {
    const data = markUnseen(rateTitle(EMPTY_LIBRARY, media, 'like', NOW), media, LATER);

    expect(data.ratings).toEqual({});
    expect(data.unseen[key]?.savedAt).toBe(LATER);
  });

  it('"Quero ver" alterna e desfaz um "Não tenho interesse"', () => {
    const dismissed = dismissTitle(EMPTY_LIBRARY, media, NOW);
    const saved = toggleWatchlist(dismissed, media, NOW);

    expect(saved.watchlist[key]).toBeDefined();
    expect(saved.dismissed).toEqual({});
    expect(toggleWatchlist(saved, media, NOW).watchlist).toEqual({});
  });

  it('não altera o estado original (imutabilidade)', () => {
    const data = rateTitle(EMPTY_LIBRARY, media, 'hate', NOW);
    const snapshot = structuredClone(data);

    removeRating(data, key);
    expect(data).toEqual(snapshot);
    expect(EMPTY_LIBRARY.ratings).toEqual({});
  });

  it('guarda apenas o resumo do título', () => {
    const data = rateTitle(
      EMPTY_LIBRARY,
      { ...media, overview: 'texto longo' } as never,
      'like',
      NOW,
    );
    expect(data.ratings[key]?.media).not.toHaveProperty('overview');
  });

  it('ordena as entradas da mais recente para a mais antiga', () => {
    const older = buildMedia({ title: 'Antigo' });
    let data = rateTitle(EMPTY_LIBRARY, older, 'like', NOW);
    data = rateTitle(data, media, 'love', LATER);

    expect(sortedEntries(data.ratings).map((entry) => entry.media.title)).toEqual([
      'Duna',
      'Antigo',
    ]);
  });
});
