import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EMPTY_LIBRARY } from '@/domain/library';
import { requireUserId } from '@/server/auth/session';
import { UnauthorizedError } from '@/server/errors';
import { getLibrary, saveLibraryChanges } from '@/server/library/repository';

import { GET, PATCH } from './route';

vi.mock('@/server/auth/session', () => ({ requireUserId: vi.fn() }));
vi.mock('@/server/library/repository', () => ({
  getLibrary: vi.fn(),
  saveLibraryChanges: vi.fn(),
}));

const request = (method: string, body?: unknown) =>
  new Request('http://localhost/api/library', {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

describe('/api/library', () => {
  beforeEach(() => {
    vi.mocked(requireUserId).mockResolvedValue('user-1');
    vi.mocked(getLibrary).mockResolvedValue(EMPTY_LIBRARY);
    vi.mocked(saveLibraryChanges).mockResolvedValue();
  });

  it('responde 401 sem sessão, sem tocar no banco', async () => {
    vi.mocked(requireUserId).mockRejectedValue(new UnauthorizedError());

    const response = await GET(request('GET'));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'UNAUTHORIZED', message: expect.any(String) },
    });
    expect(getLibrary).not.toHaveBeenCalled();
  });

  it('devolve a biblioteca do usuário logado, sem cache compartilhado', async () => {
    const response = await GET(request('GET'));

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    await expect(response.json()).resolves.toEqual({ library: EMPTY_LIBRARY });
    expect(getLibrary).toHaveBeenCalledWith('user-1');
  });

  it('grava as alterações válidas e rejeita as inválidas com 400', async () => {
    const ok = await PATCH(request('PATCH', { changes: [{ key: 'movie:1', item: null }] }));
    expect(ok.status).toBe(204);
    expect(saveLibraryChanges).toHaveBeenCalledWith('user-1', [{ key: 'movie:1', item: null }]);

    const invalid = await PATCH(request('PATCH', { changes: [{ key: 'livro:1', item: null }] }));
    expect(invalid.status).toBe(400);
    expect(saveLibraryChanges).toHaveBeenCalledOnce();
  });
});
