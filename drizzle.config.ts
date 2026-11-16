import { loadEnvConfig } from '@next/env';
import { defineConfig } from 'drizzle-kit';

// Carrega o .env da mesma forma que o Next.js.
loadEnvConfig(process.cwd());

/**
 * Migrações usam a conexão direta quando existe (`DATABASE_URL_UNPOOLED`, criada pela integração
 * Neon da Vercel): o pooler em modo transação não é indicado para alterar o schema.
 */
const migrationUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || '';

/** Configuração do Drizzle Kit: gera e aplica as migrações do banco (`npm run db:*`). */
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/server/db/schema/index.ts',
  out: './drizzle',
  dbCredentials: {
    url: migrationUrl,
  },
  strict: true,
  verbose: true,
});
