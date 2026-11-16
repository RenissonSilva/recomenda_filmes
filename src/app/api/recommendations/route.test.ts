import { describe, expect, it } from 'vitest';

import { POST } from './route';

const post = (body: string) =>
  POST(
    new Request('http://localhost/api/recommendations', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    }),
  );

describe('POST /api/recommendations', () => {
  it('responde 400 com mensagem amigável para um corpo inválido', async () => {
    const response = await post(JSON.stringify({ ratings: [{ mediaType: 'book', id: 1 }] }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'INVALID_REQUEST', message: expect.any(String) },
    });
  });

  it('responde 400 para JSON malformado', async () => {
    const response = await post('{ isto não é json');
    expect(response.status).toBe(400);
  });

  it('responde lista vazia quando não há avaliações', async () => {
    const response = await post(JSON.stringify({ ratings: [], excludeKeys: [], filter: 'all' }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ items: [] });
  });
});
