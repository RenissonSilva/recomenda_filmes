import { describe, expect, it } from 'vitest';

import { buildMedia } from '@test/fixtures/media';

import {
  dismissTitle,
  EMPTY_LIBRARY,
  markUnseen,
  rateTitle,
  toggleWatchlist,
  type LibraryData,
} from './library';
import {
  changedLibraryKeys,
  countItemsMissingFrom,
  getLibraryItem,
  isLibraryEmpty,
  libraryFromItems,
  libraryItems,
  mergeLibraries,
  overlayLibraryItems,
  sameLibraryItem,
} from './library-items';
import { getMediaKey } from './media';

const T1 = '2026-11-16T10:00:00.000Z';
const T2 = '2026-11-16T11:00:00.000Z';
const T3 = '2026-11-16T12:00:00.000Z';

describe('library-items', () => {
  const dune = buildMedia({ title: 'Duna' });
  const dark = buildMedia({ title: 'Dark', mediaType: 'tv' });
  const duneKey = getMediaKey(dune);
  const darkKey = getMediaKey(dark);

  it('converte a biblioteca em títulos e de volta sem perder dados', () => {
    let data: LibraryData = rateTitle(EMPTY_LIBRARY, dune, 'love', T1);
    data = toggleWatchlist(data, dark, T2);
    data = markUnseen(data, buildMedia(), T3);

    expect(getLibraryItem(data, duneKey)).toEqual({
      media: dune,
      rating: { value: 'love', ratedAt: T1 },
      unseenAt: null,
      watchlistAt: null,
      dismissedAt: null,
    });
    expect(libraryFromItems(libraryItems(data))).toEqual(data);
  });

  it('identifica bibliotecas vazias e títulos ausentes', () => {
    expect(isLibraryEmpty(EMPTY_LIBRARY)).toBe(true);
    expect(isLibraryEmpty(toggleWatchlist(EMPTY_LIBRARY, dune, T1))).toBe(false);
    expect(getLibraryItem(EMPTY_LIBRARY, duneKey)).toBeNull();
  });

  it('compara a situação dos títulos ignorando o formato da data e os dados do título', () => {
    const item = getLibraryItem(rateTitle(EMPTY_LIBRARY, dune, 'like', T1), duneKey);
    const sameInstant = getLibraryItem(
      rateTitle(
        EMPTY_LIBRARY,
        { ...dune, title: 'Duna (novo pôster)' },
        'like',
        '2026-11-16T10:00:00Z',
      ),
      duneKey,
    );
    const otherValue = getLibraryItem(rateTitle(EMPTY_LIBRARY, dune, 'love', T1), duneKey);

    expect(sameLibraryItem(item, sameInstant)).toBe(true);
    expect(sameLibraryItem(item, otherValue)).toBe(false);
    expect(sameLibraryItem(item, null)).toBe(false);
    expect(sameLibraryItem(null, null)).toBe(true);
  });

  it('lista só os títulos que realmente mudaram', () => {
    const before = rateTitle(toggleWatchlist(EMPTY_LIBRARY, dark, T1), dune, 'like', T1);

    expect(changedLibraryKeys(before, before)).toEqual([]);
    // Avaliar Dark tira o título de "Quero ver" — é uma única alteração.
    expect(changedLibraryKeys(before, rateTitle(before, dark, 'love', T2))).toEqual([darkKey]);
    expect(changedLibraryKeys(before, EMPTY_LIBRARY).sort()).toEqual([darkKey, duneKey].sort());
  });

  it('sobrepõe a situação local de alguns títulos (inclusive a remoção)', () => {
    const account = rateTitle(rateTitle(EMPTY_LIBRARY, dune, 'like', T1), dark, 'hate', T1);
    const local = rateTitle(EMPTY_LIBRARY, dune, 'love', T2); // Dark foi desfeito localmente

    const result = overlayLibraryItems(account, local, [duneKey, darkKey]);

    expect(result.ratings[duneKey]?.value).toBe('love');
    expect(result.ratings[darkKey]).toBeUndefined();
    expect(account.ratings[darkKey]?.value).toBe('hate'); // sem mutar a original
  });

  it('conta os títulos locais que não estão iguais na conta', () => {
    const account = rateTitle(EMPTY_LIBRARY, dune, 'like', T1);
    const local = toggleWatchlist(rateTitle(EMPTY_LIBRARY, dune, 'like', T1), dark, T2);

    expect(countItemsMissingFrom(account, local)).toBe(1);
    expect(countItemsMissingFrom(account, rateTitle(local, dune, 'love', T3))).toBe(2);
    expect(countItemsMissingFrom(account, EMPTY_LIBRARY)).toBe(0);
  });

  it('junta bibliotecas título a título, valendo a ação mais recente', () => {
    const account = dismissTitle(rateTitle(EMPTY_LIBRARY, dune, 'like', T3), dark, T1);
    const local = toggleWatchlist(rateTitle(EMPTY_LIBRARY, dune, 'hate', T1), dark, T2);
    const extra = buildMedia({ title: 'Só no navegador' });

    const merged = mergeLibraries(account, markUnseen(local, extra, T1));

    expect(merged.ratings[duneKey]?.value).toBe('like'); // a conta é mais recente
    expect(merged.watchlist[darkKey]?.savedAt).toBe(T2); // o navegador é mais recente…
    expect(merged.dismissed[darkKey]).toBeUndefined(); // …e a situação vem inteira dele
    expect(merged.unseen[getMediaKey(extra)]?.savedAt).toBe(T1);
  });
});
