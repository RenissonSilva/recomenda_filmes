import { ApiError, isApiErrorBody } from './api-error';

const FALLBACK_ERROR_MESSAGE = 'Não foi possível carregar os dados. Tente novamente.';

type JsonRequestInit = Omit<RequestInit, 'body'> & { json?: unknown };

/**
 * `fetch` tipado para a API interna: serializa o corpo em JSON e converte
 * respostas de erro em `ApiError` com a mensagem enviada pelo servidor.
 */
export async function fetchJson<T>(
  input: string,
  { json, headers, ...init }: JsonRequestInit = {},
) {
  const response = await fetch(input, {
    ...init,
    headers: {
      accept: 'application/json',
      ...(json === undefined ? {} : { 'content-type': 'application/json' }),
      ...headers,
    },
    body: json === undefined ? undefined : JSON.stringify(json),
  });

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    if (isApiErrorBody(body)) {
      throw new ApiError(body.error.message, response.status, body.error.code);
    }
    throw new ApiError(FALLBACK_ERROR_MESSAGE, response.status, 'UNKNOWN_ERROR');
  }

  return body as T;
}
