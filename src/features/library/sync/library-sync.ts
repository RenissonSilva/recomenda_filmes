import type { StoreApi } from 'zustand';

import type { LibraryData } from '@/domain/library';
import {
  changedLibraryKeys,
  countItemsMissingFrom,
  getLibraryItem,
  isLibraryEmpty,
  LIBRARY_CHANGES_BATCH_SIZE,
} from '@/domain/library-items';
import { ApiError } from '@/lib/http/api-error';

import { selectLibraryData, type LibraryState } from '../store';
import type { LibrarySyncApi } from './api';

/**
 * Sincronização da biblioteca do navegador com a conta do usuário.
 *
 * - Com login, o `localStorage` vira uma cópia local da conta: a tela continua instantânea
 *   e cada alteração é enviada em segundo plano (agrupada e com novas tentativas).
 * - Ao entrar, os dados feitos sem login são levados para a conta: automaticamente se ela
 *   estiver vazia, ou após a escolha do usuário (`needs-decision` → `resolve`).
 * - As operações rodam em fila, uma de cada vez, para que leituras e envios não se cruzem.
 */

export type LibrarySyncChoice = 'merge' | 'discard-local';

export type ConnectResult =
  /** A biblioteca exibida é a da conta. `importedCount` = títulos levados deste navegador. */
  | { status: 'synced'; importedCount: number }
  /** O navegador e a conta têm dados diferentes: o usuário precisa escolher (ver `resolve`). */
  | { status: 'needs-decision'; localCount: number }
  /** O usuário saiu (ou trocou de conta) antes do fim da operação. */
  | { status: 'cancelled' };

export interface LibrarySync {
  /** Começa a sincronizar com a conta do usuário (ao entrar ou ao abrir o app já logado). */
  connect: (userId: string) => Promise<ConnectResult>;
  /** Conclui um `connect` que terminou em `needs-decision`, com a escolha do usuário. */
  resolve: (userId: string, choice: LibrarySyncChoice) => Promise<void>;
  /** Envia já as alterações pendentes. */
  flush: (options?: { keepalive?: boolean }) => Promise<void>;
  /** Envia as pendências e busca o que mudou em outros dispositivos (no máximo uma vez por minuto). */
  refresh: () => Promise<void>;
  /** Para de sincronizar (ao sair da conta). */
  disconnect: () => void;
}

interface LibrarySyncOptions {
  store: StoreApi<LibraryState>;
  api: LibrarySyncApi;
  /** Espera após uma alteração antes de enviá-la — agrupa cliques seguidos numa requisição. */
  flushDelayMs?: number;
  /** Intervalo mínimo entre duas atualizações vindas da conta (`refresh`). */
  refreshIntervalMs?: number;
  /** Chamado quando o servidor responde 401 (sessão expirada ou encerrada em outro lugar). */
  onUnauthorized?: () => void;
}

const MAX_RETRY_DELAY_MS = 60_000;

export const isUnauthorizedError = (error: unknown) =>
  error instanceof ApiError && error.status === 401;

export function createLibrarySync({
  store,
  api,
  flushDelayMs = 1000,
  refreshIntervalMs = 60_000,
  onUnauthorized,
}: LibrarySyncOptions): LibrarySync {
  let userId: string | null = null;
  let queue: Promise<unknown> = Promise.resolve();
  let flushTimer: ReturnType<typeof setTimeout> | undefined;
  let failedFlushes = 0;
  let lastPulledAt = 0;
  let unsubscribe: (() => void) | undefined;

  /** Executa as operações uma de cada vez, na ordem em que foram pedidas. */
  function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const result = queue.then(task);
    queue = result.catch(() => undefined);
    return result;
  }

  /** `true` se a sincronização ainda é com `id` e o navegador guarda os dados dessa conta. */
  const isSyncing = (id: string) => userId === id && store.getState().sync.ownerId === id;

  function reportError(error: unknown) {
    if (isUnauthorizedError(error)) onUnauthorized?.();
  }

  function scheduleFlush(delayMs: number) {
    clearTimeout(flushTimer);
    if (userId === null) return;
    flushTimer = setTimeout(() => void flush().catch(() => undefined), delayMs);
  }

  /** Passa a exibir a biblioteca da conta, preservando o que mudou localmente desde `snapshot`. */
  function adopt(id: string, account: LibraryData, snapshot: LibraryData) {
    const state = store.getState();
    state.applyAccountLibrary(id, account, changedLibraryKeys(snapshot, state));
    lastPulledAt = Date.now();
  }

  async function pushPending(id: string, keepalive: boolean) {
    for (;;) {
      const state = store.getState();
      if (!isSyncing(id)) return;

      const keys = state.sync.pendingKeys.slice(0, LIBRARY_CHANGES_BATCH_SIZE);
      if (keys.length === 0) return;

      const changes = keys.map((key) => ({ key, item: getLibraryItem(state, key) }));
      await api.pushChanges(changes, { keepalive });
      store.getState().acknowledgeChanges(changes);

      // Sem progresso (todos mudaram de novo durante o envio): o envio agendado cuida deles.
      const stillPending = new Set(store.getState().sync.pendingKeys);
      if (keys.every((key) => stillPending.has(key))) return;
    }
  }

  async function pullAccount(id: string) {
    const account = await api.fetchLibrary();
    if (!isSyncing(id)) return;
    store.getState().applyAccountLibrary(id, account, []);
    lastPulledAt = Date.now();
  }

  function flush({ keepalive = false } = {}) {
    return enqueue(async () => {
      clearTimeout(flushTimer);
      const id = userId;
      if (id === null) return;

      try {
        await pushPending(id, keepalive);
        failedFlushes = 0;
      } catch (error) {
        reportError(error);
        if (!isUnauthorizedError(error)) {
          failedFlushes++;
          scheduleFlush(Math.min(MAX_RETRY_DELAY_MS, 2000 * 2 ** (failedFlushes - 1)));
        }
        throw error;
      }
    });
  }

  function refresh() {
    const id = userId;
    if (id === null || Date.now() - lastPulledAt < refreshIntervalMs) return Promise.resolve();

    return flush()
      .catch(() => undefined)
      .then(() => enqueue(() => pullAccount(id)))
      .catch(reportError);
  }

  function disconnect() {
    userId = null;
    clearTimeout(flushTimer);
    unsubscribe?.();
    unsubscribe = undefined;
    failedFlushes = 0;
    lastPulledAt = 0;
  }

  function connect(id: string): Promise<ConnectResult> {
    if (userId !== id) {
      disconnect();
      userId = id;
      // Toda alteração pendente agenda um envio.
      unsubscribe = store.subscribe((state, previous) => {
        const pending = state.sync.pendingKeys;
        if (pending !== previous.sync.pendingKeys && pending.length > 0)
          scheduleFlush(flushDelayMs);
      });
    }

    return enqueue(async (): Promise<ConnectResult> => {
      if (userId !== id) return { status: 'cancelled' };

      try {
        const { ownerId } = store.getState().sync;

        // O navegador já guarda os dados desta conta: envia o que ficou pendente e atualiza.
        if (ownerId === id) {
          await pushPending(id, false).catch((error: unknown) => {
            reportError(error);
            scheduleFlush(flushDelayMs);
          });
          await pullAccount(id);
          return { status: 'synced', importedCount: 0 };
        }

        // Dados de outra conta (ex.: a sessão expirou sem sair): não pertencem a este usuário.
        if (ownerId !== null) store.getState().resetLocal();

        const local = selectLibraryData(store.getState());
        const account = await api.fetchLibrary();
        if (userId !== id) return { status: 'cancelled' };

        const localCount = countItemsMissingFrom(account, local);
        if (localCount === 0) {
          adopt(id, account, local);
          return { status: 'synced', importedCount: 0 };
        }
        if (!isLibraryEmpty(account)) return { status: 'needs-decision', localCount };

        // Conta nova (vazia): leva os dados do navegador sem perguntar.
        const merged = await api.mergeLibrary(local);
        if (userId !== id) return { status: 'cancelled' };
        adopt(id, merged, local);
        return { status: 'synced', importedCount: localCount };
      } catch (error) {
        reportError(error);
        throw error;
      }
    });
  }

  function resolve(id: string, choice: LibrarySyncChoice): Promise<void> {
    return enqueue(async () => {
      if (userId !== id) return;

      try {
        if (choice === 'merge') {
          const local = selectLibraryData(store.getState());
          const merged = await api.mergeLibrary(local);
          if (userId === id) adopt(id, merged, local);
        } else {
          const account = await api.fetchLibrary();
          if (userId === id) adopt(id, account, selectLibraryData(store.getState()));
        }
      } catch (error) {
        reportError(error);
        throw error;
      }
    });
  }

  return { connect, resolve, flush, refresh, disconnect };
}
