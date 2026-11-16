import 'server-only';

import { getTmdbCredentials } from '../env';
import { TmdbRequestError } from '../errors';
import {
  TMDB_API_BASE_URL,
  TMDB_LANGUAGE,
  TMDB_MAX_ATTEMPTS,
  TMDB_REQUEST_TIMEOUT_MS,
} from './config';

type QueryValue = string | number | boolean | undefined;
export type TmdbQuery = Record<string, QueryValue>;

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const MAX_RETRY_DELAY_MS = 2_000;

/**
 * Faz um GET na API v3 do TMDB, já com idioma pt-BR, autenticação e
 * uma nova tentativa em caso de limite de requisições (429) ou instabilidade (5xx).
 */
export async function tmdbGet<T>(path: string, query: TmdbQuery = {}): Promise<T> {
  const credentials = getTmdbCredentials();
  const url = new URL(`${TMDB_API_BASE_URL}${path}`);

  for (const [name, value] of Object.entries({ language: TMDB_LANGUAGE, ...query })) {
    if (value !== undefined) url.searchParams.set(name, String(value));
  }

  const headers: Record<string, string> = { accept: 'application/json' };
  if (credentials.kind === 'bearer') {
    headers.authorization = `Bearer ${credentials.token}`;
  } else {
    url.searchParams.set('api_key', credentials.key);
  }

  for (let attempt = 1; ; attempt++) {
    let response: Response;
    try {
      response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(TMDB_REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      // Falha de rede ou timeout.
      if (attempt < TMDB_MAX_ATTEMPTS) continue;
      throw new TmdbRequestError(0, path, { cause: error });
    }

    if (response.ok) return (await response.json()) as T;

    if (attempt < TMDB_MAX_ATTEMPTS && RETRYABLE_STATUS.has(response.status)) {
      await sleep(retryDelayMs(response));
      continue;
    }

    throw new TmdbRequestError(response.status, path);
  }
}

function retryDelayMs(response: Response): number {
  const retryAfterSeconds = Number(response.headers.get('retry-after'));
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return Math.min(retryAfterSeconds * 1000, MAX_RETRY_DELAY_MS);
  }
  return 500;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
