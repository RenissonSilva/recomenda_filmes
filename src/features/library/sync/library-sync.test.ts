import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EMPTY_LIBRARY, rateTitle, toggleWatchlist, type LibraryData } from '@/domain/library';
import {
  libraryFromItems,
  mergeLibraries,
  overlayLibraryItems,
  type LibraryChange,
  type LibraryItem,
} from '@/domain/library-items';
import { getMediaKey, type MediaKey } from '@/domain/media';
import { ApiError } from '@/lib/http/api-error';
import { buildMedia } from '@test/fixtures/media';

import { useLibraryStore } from '../store';
import type { LibrarySyncApi } from './api';
import { createLibrarySync, type LibrarySync } from './library-sync';
import { LOCAL_SYNC_STATE } from './sync-state';

const T1 = '2026-11-16T10:00:00.000Z';
const USER = 'user-1';

/** Servidor falso: guarda a biblioteca da conta em memória. */
function createFakeServer(initial: LibraryData = EMPTY_LIBRARY) {
  const server = { library: initial };

  const api = {
    fetchLibrary: vi.fn(async () => server.library),
    pushChanges: vi.fn(async (changes: LibraryChange[]) => {
      const items = changes.flatMap(({ key, item }) =>
        item ? [[key, item] as [MediaKey, LibraryItem]] : [],
      );
      server.library = overlayLibraryItems(
        server.library,
        libraryFromItems(items),
        changes.map((change) => change.key),
      );
    }),
    mergeLibrary: vi.fn(async (library: LibraryData) => {
      server.library = mergeLibraries(server.library, library);
      return server.library;
    }),
  } satisfies LibrarySyncApi;

  return { server, api };
}

describe('createLibrarySync', () => {
  const dune = buildMedia({ title: 'Duna' });
  const dark = buildMedia({ title: 'Dark', mediaType: 'tv' });
  const duneKey = getMediaKey(dune);
  const darkKey = getMediaKey(dark);
  const store = () => useLibraryStore.getState();

  let sync: LibrarySync;

  const setup = (account: LibraryData = EMPTY_LIBRARY, onUnauthorized = vi.fn()) => {
    const fake = createFakeServer(account);
    sync = createLibrarySync({ store: useLibraryStore, api: fake.api, onUnauthorized });
    return { ...fake, onUnauthorized };
  };

  beforeEach(() => {
    vi.useFakeTimers();
    useLibraryStore.setState({ ...EMPTY_LIBRARY, sync: LOCAL_SYNC_STATE });
  });

  afterEach(() => {
    sync.disconnect();
    vi.useRealTimers();
  });

  describe('ao entrar', () => {
    it('sem dados no navegador, passa a exibir a biblioteca da conta', async () => {
      setup(rateTitle(EMPTY_LIBRARY, dune, 'love', T1));

      await expect(sync.connect(USER)).resolves.toEqual({ status: 'synced', importedCount: 0 });
      expect(store().ratings[duneKey]?.value).toBe('love');
      expect(store().sync.ownerId).toBe(USER);
    });

    it('com a conta vazia, leva os dados do navegador sem perguntar', async () => {
      const { server, api } = setup();
      store().rate(dune, 'like');
      store().toggleWatchlist(dark);

      await expect(sync.connect(USER)).resolves.toEqual({ status: 'synced', importedCount: 2 });
      expect(api.mergeLibrary).toHaveBeenCalledOnce();
      expect(server.library.ratings[duneKey]?.value).toBe('like');
      expect(store().sync).toEqual({ ownerId: USER, pendingKeys: [] });
    });

    it('se o navegador só tem o que já está na conta, não pergunta nada', async () => {
      const account = rateTitle(EMPTY_LIBRARY, dune, 'like', T1);
      const { api } = setup(account);
      useLibraryStore.setState(account);

      await expect(sync.connect(USER)).resolves.toEqual({ status: 'synced', importedCount: 0 });
      expect(api.mergeLibrary).not.toHaveBeenCalled();
    });

    it('com dados diferentes nos dois lados, pede a decisão e junta se o usuário escolher', async () => {
      const { server } = setup(rateTitle(EMPTY_LIBRARY, dark, 'love', T1));
      store().rate(dune, 'like');

      await expect(sync.connect(USER)).resolves.toEqual({
        status: 'needs-decision',
        localCount: 1,
      });
      expect(store().sync.ownerId).toBeNull(); // nada muda até a escolha

      await sync.resolve(USER, 'merge');
      expect(Object.keys(store().ratings).sort()).toEqual([darkKey, duneKey].sort());
      expect(Object.keys(server.library.ratings)).toHaveLength(2);
      expect(store().sync.ownerId).toBe(USER);
    });

    it('descarta os dados do navegador se o usuário escolher', async () => {
      const { server } = setup(rateTitle(EMPTY_LIBRARY, dark, 'love', T1));
      store().rate(dune, 'like');
      await sync.connect(USER);

      await sync.resolve(USER, 'discard-local');

      expect(Object.keys(store().ratings)).toEqual([darkKey]);
      expect(Object.keys(server.library.ratings)).toEqual([darkKey]);
    });

    it('ao reabrir o app logado, envia o que ficou pendente antes de atualizar', async () => {
      const { server } = setup(rateTitle(EMPTY_LIBRARY, dune, 'hate', T1));
      useLibraryStore.setState({
        ...rateTitle(EMPTY_LIBRARY, dune, 'love', T1),
        sync: { ownerId: USER, pendingKeys: [duneKey] },
      });

      await sync.connect(USER);

      expect(server.library.ratings[duneKey]?.value).toBe('love');
      expect(store().ratings[duneKey]?.value).toBe('love');
      expect(store().sync.pendingKeys).toEqual([]);
    });

    it('descarta dados de outra conta deixados no navegador', async () => {
      setup(toggleWatchlist(EMPTY_LIBRARY, dark, T1));
      useLibraryStore.setState({
        ...rateTitle(EMPTY_LIBRARY, dune, 'love', T1),
        sync: { ownerId: 'outra-conta', pendingKeys: [] },
      });

      await expect(sync.connect(USER)).resolves.toEqual({ status: 'synced', importedCount: 0 });
      expect(store().ratings).toEqual({});
      expect(store().watchlist[darkKey]).toBeDefined();
    });
  });

  describe('depois de conectado', () => {
    it('agrupa as alterações e as envia em segundo plano', async () => {
      const { server, api } = setup();
      await sync.connect(USER);

      store().rate(dune, 'like');
      store().rate(dark, 'love');
      expect(api.pushChanges).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(1000);

      expect(api.pushChanges).toHaveBeenCalledOnce();
      expect(server.library.ratings[darkKey]?.value).toBe('love');
      expect(store().sync.pendingKeys).toEqual([]);
    });

    it('envia remoções e tenta de novo quando o envio falha', async () => {
      const { server, api } = setup(rateTitle(EMPTY_LIBRARY, dune, 'like', T1));
      await sync.connect(USER);
      api.pushChanges.mockRejectedValueOnce(new ApiError('Falhou', 502, 'TMDB_REQUEST_FAILED'));

      store().removeRating(duneKey);
      await vi.advanceTimersByTimeAsync(1000);
      expect(store().sync.pendingKeys).toEqual([duneKey]); // falhou: continua pendente

      await vi.advanceTimersByTimeAsync(2000);
      expect(server.library.ratings[duneKey]).toBeUndefined();
      expect(store().sync.pendingKeys).toEqual([]);
    });

    it('avisa quando a sessão expirou (401)', async () => {
      const { api, onUnauthorized } = setup();
      await sync.connect(USER);
      api.pushChanges.mockRejectedValue(new ApiError('Sessão expirada', 401, 'UNAUTHORIZED'));

      store().rate(dune, 'like');
      await expect(sync.flush()).rejects.toThrow('Sessão expirada');

      expect(onUnauthorized).toHaveBeenCalled();
    });

    it('para de enviar depois de desconectado', async () => {
      const { api } = setup();
      await sync.connect(USER);

      store().rate(dune, 'like');
      sync.disconnect();
      await vi.advanceTimersByTimeAsync(5000);

      expect(api.pushChanges).not.toHaveBeenCalled();
    });
  });
});
