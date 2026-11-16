import { beforeEach, describe, expect, it } from 'vitest';

import { EMPTY_LIBRARY, rateTitle } from '@/domain/library';
import { getLibraryItem } from '@/domain/library-items';
import { getMediaKey } from '@/domain/media';
import { buildMedia } from '@test/fixtures/media';

import { LIBRARY_STORAGE_KEY, useLibraryStore } from './store';
import { LOCAL_SYNC_STATE } from './sync/sync-state';

const T1 = '2026-11-16T10:00:00.000Z';

describe('useLibraryStore — sincronização', () => {
  const dune = buildMedia({ title: 'Duna' });
  const dark = buildMedia({ title: 'Dark', mediaType: 'tv' });
  const duneKey = getMediaKey(dune);
  const darkKey = getMediaKey(dark);
  const store = () => useLibraryStore.getState();

  beforeEach(() => {
    useLibraryStore.setState({ ...EMPTY_LIBRARY, sync: LOCAL_SYNC_STATE });
  });

  it('sem login, as alterações ficam só no navegador', () => {
    store().rate(dune, 'love');
    expect(store().ratings[duneKey]?.value).toBe('love');
    expect(store().sync.pendingKeys).toEqual([]);
  });

  it('com login, cada título alterado entra (uma vez) na fila de envio', () => {
    useLibraryStore.setState({ sync: { ownerId: 'user-1', pendingKeys: [] } });

    store().rate(dune, 'like');
    store().rate(dune, 'love');
    store().toggleWatchlist(dark);
    store().removeRating('movie:999999'); // título fora da biblioteca: nada muda

    expect(store().sync.pendingKeys).toEqual([duneKey, darkKey]);
  });

  it('"Apagar tudo" com login envia a remoção de todos os títulos', () => {
    useLibraryStore.setState({
      ...rateTitle(EMPTY_LIBRARY, dune, 'love', T1),
      sync: { ownerId: 'user-1', pendingKeys: [] },
    });

    store().clear();
    expect(store().sync.pendingKeys).toEqual([duneKey]);
  });

  it('ao aplicar a biblioteca da conta, preserva as alterações ainda não enviadas', () => {
    useLibraryStore.setState({ sync: { ownerId: 'user-1', pendingKeys: [] } });
    store().rate(dune, 'love');

    const account = rateTitle(rateTitle(EMPTY_LIBRARY, dune, 'hate', T1), dark, 'like', T1);
    store().applyAccountLibrary('user-1', account, []);

    expect(store().ratings[duneKey]?.value).toBe('love'); // pendente: vale a versão local
    expect(store().ratings[darkKey]?.value).toBe('like'); // veio da conta
    expect(store().sync).toEqual({ ownerId: 'user-1', pendingKeys: [duneKey] });
  });

  it('só marca como salvo o que não mudou de novo durante o envio', () => {
    useLibraryStore.setState({ sync: { ownerId: 'user-1', pendingKeys: [] } });
    store().rate(dune, 'like');
    store().rate(dark, 'like');
    const sent = [duneKey, darkKey].map((key) => ({ key, item: getLibraryItem(store(), key) }));

    store().rate(dark, 'love'); // mudou enquanto o envio acontecia
    store().acknowledgeChanges(sent);

    expect(store().sync.pendingKeys).toEqual([darkKey]);
  });

  it('ao sair da conta, esvazia o navegador', () => {
    useLibraryStore.setState({ sync: { ownerId: 'user-1', pendingKeys: [] } });
    store().rate(dune, 'love');

    store().resetLocal();

    expect(store().ratings).toEqual({});
    expect(store().sync).toEqual(LOCAL_SYNC_STATE);
  });

  it('lê dados salvos antes das contas (versão 1) como dados locais', async () => {
    const legacy = rateTitle(EMPTY_LIBRARY, dune, 'love', T1);
    localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify({ state: legacy, version: 1 }));

    await useLibraryStore.persist.rehydrate();

    expect(store().ratings[duneKey]?.value).toBe('love');
    expect(store().sync).toEqual(LOCAL_SYNC_STATE);
  });
});
