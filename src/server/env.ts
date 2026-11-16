import 'server-only';

import { z } from 'zod';

import { TmdbNotConfiguredError } from './errors';

const optionalSecret = z
  .string()
  .trim()
  .transform((value) => value || undefined)
  .optional();

const envSchema = z.object({
  TMDB_API_READ_TOKEN: optionalSecret,
  TMDB_API_KEY: optionalSecret,
});

export type TmdbCredentials = { kind: 'bearer'; token: string } | { kind: 'api-key'; key: string };

/**
 * Lê as credenciais do TMDB sob demanda (e não na importação do módulo),
 * para que o build funcione mesmo sem a chave configurada.
 */
export function getTmdbCredentials(): TmdbCredentials {
  const env = envSchema.parse(process.env);

  if (env.TMDB_API_READ_TOKEN) return { kind: 'bearer', token: env.TMDB_API_READ_TOKEN };
  if (env.TMDB_API_KEY) return { kind: 'api-key', key: env.TMDB_API_KEY };

  throw new TmdbNotConfiguredError();
}
