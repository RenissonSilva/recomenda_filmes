import 'server-only';

import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { getDatabaseUrl } from '../env';
import * as schema from './schema';

export type Database = NodePgDatabase<typeof schema>;

// Guardado no `globalThis` para não abrir um pool novo a cada recarga do servidor de desenvolvimento.
const globalForDb = globalThis as typeof globalThis & { recomendaFilmesDb?: Database };

/**
 * Conexão com o PostgreSQL, criada sob demanda (o build funciona sem banco configurado).
 */
export function getDb(): Database {
  globalForDb.recomendaFilmesDb ??= drizzle({
    client: new Pool({ connectionString: getDatabaseUrl(), max: 10 }),
    schema,
  });
  return globalForDb.recomendaFilmesDb;
}
