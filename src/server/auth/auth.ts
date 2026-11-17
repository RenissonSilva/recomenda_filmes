import 'server-only';

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { eq } from 'drizzle-orm';
import { after } from 'next/server';

import { authConfig } from '@/config/auth';
import { siteConfig } from '@/config/site';

import { getDb } from '../db/client';
import * as schema from '../db/schema';
import { sendEmail } from '../email/mailer';
import { passwordResetEmail } from '../email/templates';
import { getAuthEnv, getGoogleCredentials } from '../env';

const DAY_IN_SECONDS = 60 * 60 * 24;

function createAuth() {
  const { secret, baseURL, trustedOrigins } = getAuthEnv();
  const google = getGoogleCredentials();
  const db = getDb();

  return betterAuth({
    appName: siteConfig.name,
    secret,
    baseURL,
    trustedOrigins,
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
      transaction: true,
    }),
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      minPasswordLength: authConfig.password.minLength,
      maxPasswordLength: authConfig.password.maxLength,
      resetPasswordTokenExpiresIn: authConfig.passwordResetExpiresInMinutes * 60,
      // Quem redefiniu a senha precisa entrar de novo em todos os dispositivos.
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        await sendEmail({
          to: user.email,
          ...passwordResetEmail({
            name: user.name,
            url,
            expiresInMinutes: authConfig.passwordResetExpiresInMinutes,
          }),
        });
      },
      // Abrir o link enviado por e-mail comprova que o e-mail é da pessoa. Com o e-mail
      // verificado, um login com Google desse mesmo e-mail passa a entrar nesta conta.
      onPasswordReset: async ({ user }) => {
        await db
          .update(schema.user)
          .set({ emailVerified: true })
          .where(eq(schema.user.id, user.id));
      },
    },
    socialProviders: google
      ? {
          google: {
            clientId: google.clientId,
            clientSecret: google.clientSecret,
            prompt: 'select_account',
          },
        }
      : {},
    session: {
      expiresIn: authConfig.sessionExpiresInDays * DAY_IN_SECONDS,
      updateAge: DAY_IN_SECONDS,
      // Evita uma consulta ao banco a cada requisição: a sessão fica num cookie assinado por 5 min.
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    advanced: {
      // E-mails são enviados depois da resposta: o tempo de resposta não revela se o e-mail existe.
      backgroundTasks: { handler: (task) => after(task) },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;

let instance: Auth | undefined;

/**
 * Instância do Better Auth, criada sob demanda: o build não precisa de banco nem de segredos.
 */
export function getAuth(): Auth {
  instance ??= createAuth();
  return instance;
}
