import type { LibraryData } from '@/domain/library';
import type { LibraryChange, LibraryResponse } from '@/domain/library-items';
import { fetchJson } from '@/lib/http/fetch-json';
import { apiRoutes } from '@/lib/routes';

/** Operações da API da biblioteca da conta usadas pela sincronização. */
export interface LibrarySyncApi {
  fetchLibrary: () => Promise<LibraryData>;
  /** `keepalive` permite concluir o envio mesmo se a página for fechada. */
  pushChanges: (changes: LibraryChange[], options?: { keepalive?: boolean }) => Promise<void>;
  mergeLibrary: (library: LibraryData) => Promise<LibraryData>;
}

export const librarySyncApi: LibrarySyncApi = {
  async fetchLibrary() {
    const { library } = await fetchJson<LibraryResponse>(apiRoutes.library, { cache: 'no-store' });
    return library;
  },
  async pushChanges(changes, { keepalive = false } = {}) {
    await fetchJson<null>(apiRoutes.library, { method: 'PATCH', json: { changes }, keepalive });
  },
  async mergeLibrary(library) {
    const response = await fetchJson<LibraryResponse>(apiRoutes.libraryMerge, {
      method: 'POST',
      json: { library },
    });
    return response.library;
  },
};
