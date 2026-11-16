import 'server-only';

import { z } from 'zod';

import { MissingEnvError, TmdbNotConfiguredError } from './errors';

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

const appEnvSchema = z.object({
  DATABASE_URL: optionalSecret,
  BETTER_AUTH_SECRET: optionalSecret,
  BETTER_AUTH_URL: optionalSecret,
  GOOGLE_CLIENT_ID: optionalSecret,
  GOOGLE_CLIENT_SECRET: optionalSecret,
  SMTP_URL: optionalSecret,
  EMAIL_FROM: optionalSecret,
});

const readAppEnv = () => appEnvSchema.parse(process.env);

/** Conexão com o PostgreSQL (contas e avaliações sincronizadas). */
export function getDatabaseUrl(): string {
  const { DATABASE_URL } = readAppEnv();
  if (!DATABASE_URL) throw new MissingEnvError('DATABASE_URL');
  return DATABASE_URL;
}

export interface AuthEnv {
  secret: string;
  /** URL pública do app; sem ela, o Better Auth usa a origem de cada requisição. */
  baseURL: string | undefined;
}

export function getAuthEnv(): AuthEnv {
  const { BETTER_AUTH_SECRET, BETTER_AUTH_URL } = readAppEnv();
  if (!BETTER_AUTH_SECRET) throw new MissingEnvError('BETTER_AUTH_SECRET');
  return { secret: BETTER_AUTH_SECRET, baseURL: BETTER_AUTH_URL };
}

/** Credenciais do login com Google, ou `null` se ele não estiver configurado (é opcional). */
export function getGoogleCredentials(): { clientId: string; clientSecret: string } | null {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = readAppEnv();
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) return null;
  return { clientId: GOOGLE_CLIENT_ID, clientSecret: GOOGLE_CLIENT_SECRET };
}

const DEFAULT_EMAIL_FROM = 'Recomenda Filmes <nao-responda@localhost>';

/** Servidor SMTP para envio de e-mails, ou `null` se não configurado. */
export function getSmtpConfig(): { url: string; from: string } | null {
  const { SMTP_URL, EMAIL_FROM } = readAppEnv();
  if (!SMTP_URL) return null;
  return { url: SMTP_URL, from: EMAIL_FROM ?? DEFAULT_EMAIL_FROM };
}
