import 'server-only';

import { and, eq, getTableColumns, inArray, sql, type Column } from 'drizzle-orm';

import type { LibraryData } from '@/domain/library';
import {
  changedLibraryKeys,
  getLibraryItem,
  libraryFromItems,
  mergeLibraries,
  type LibraryChange,
} from '@/domain/library-items';
import type { MediaKey } from '@/domain/media';
import { chunk } from '@/lib/array';

import { getDb, type Database } from '../db/client';
import { libraryItem } from '../db/schema';
import { libraryItemToRow, rowToLibraryItem } from './mappers';

/**
 * Acesso à biblioteca sincronizada de cada usuário.
 * Toda função recebe o `userId` já autenticado (ver `requireUserId`).
 */

type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];

/** Linhas por `INSERT` (o PostgreSQL aceita no máximo 65.535 parâmetros por comando). */
const INSERT_CHUNK_SIZE = 1000;

/** Colunas atualizadas quando o título já existe na biblioteca. */
const { userId: _userId, mediaKey: _mediaKey, ...updatableColumns } = getTableColumns(libraryItem);

/** Valor que seria inserido (`excluded.coluna`), para o `ON CONFLICT DO UPDATE`. */
const excluded = (column: Column) => sql.raw(`excluded."${column.name}"`);

const UPSERT_SET = Object.fromEntries(
  Object.entries(updatableColumns).map(([property, column]) => [
    property,
    property === 'updatedAt' ? sql`now()` : excluded(column),
  ]),
);

/**
 * Serializa as escritas de um mesmo usuário (ex.: juntar bibliotecas enquanto outro
 * dispositivo envia alterações), sem bloquear os demais usuários.
 */
async function lockUserLibrary(tx: Transaction, userId: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`library:${userId}`}))`);
}

async function loadLibrary(executor: Database | Transaction, userId: string): Promise<LibraryData> {
  const rows = await executor.select().from(libraryItem).where(eq(libraryItem.userId, userId));
  return libraryFromItems(
    rows.flatMap((row) => {
      const entry = rowToLibraryItem(row);
      return entry ? [entry] : [];
    }),
  );
}

async function writeChanges(tx: Transaction, userId: string, changes: readonly LibraryChange[]) {
  // Se o mesmo título aparecer mais de uma vez, vale a última alteração.
  const latest = new Map<MediaKey, LibraryChange>(changes.map((change) => [change.key, change]));
  const removals: MediaKey[] = [];
  const upserts = [];

  for (const { key, item } of latest.values()) {
    if (item) upserts.push(libraryItemToRow(userId, key, item));
    else removals.push(key);
  }

  for (const keys of chunk(removals, INSERT_CHUNK_SIZE)) {
    await tx
      .delete(libraryItem)
      .where(and(eq(libraryItem.userId, userId), inArray(libraryItem.mediaKey, keys)));
  }

  for (const rows of chunk(upserts, INSERT_CHUNK_SIZE)) {
    await tx
      .insert(libraryItem)
      .values(rows)
      .onConflictDoUpdate({ target: [libraryItem.userId, libraryItem.mediaKey], set: UPSERT_SET });
  }
}

export async function getLibrary(userId: string): Promise<LibraryData> {
  return loadLibrary(getDb(), userId);
}

/** Aplica as alterações enviadas pelo navegador (cada uma substitui a situação do título). */
export async function saveLibraryChanges(
  userId: string,
  changes: readonly LibraryChange[],
): Promise<void> {
  await getDb().transaction(async (tx) => {
    await lockUserLibrary(tx, userId);
    await writeChanges(tx, userId, changes);
  });
}

/**
 * Junta a biblioteca do navegador com a da conta (vale a ação mais recente de cada título)
 * e devolve o resultado.
 */
export async function mergeIntoLibrary(
  userId: string,
  incoming: LibraryData,
): Promise<LibraryData> {
  return getDb().transaction(async (tx) => {
    await lockUserLibrary(tx, userId);

    const current = await loadLibrary(tx, userId);
    const merged = mergeLibraries(current, incoming);
    const changes = changedLibraryKeys(current, merged).map((key) => ({
      key,
      item: getLibraryItem(merged, key),
    }));

    await writeChanges(tx, userId, changes);
    return merged;
  });
}
