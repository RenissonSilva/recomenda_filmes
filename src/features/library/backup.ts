import { z } from 'zod';

import { libraryDataSchema } from './library-schema';
import type { LibraryData } from './library-state';

/**
 * Backup da biblioteca em arquivo JSON — como os dados ficam só no navegador,
 * é a forma de levá-los para outro dispositivo ou guardar uma cópia.
 */

const BACKUP_APP_ID = 'recomenda-filmes';
const BACKUP_VERSION = 1;

const backupSchema = z.object({
  app: z.literal(BACKUP_APP_ID),
  version: z.literal(BACKUP_VERSION),
  exportedAt: z.string(),
  data: libraryDataSchema,
});

export type LibraryBackup = z.infer<typeof backupSchema>;

export class InvalidBackupError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'InvalidBackupError';
  }
}

export function createBackup(data: LibraryData, exportedAt: Date): LibraryBackup {
  return {
    app: BACKUP_APP_ID,
    version: BACKUP_VERSION,
    exportedAt: exportedAt.toISOString(),
    data: {
      ratings: data.ratings,
      unseen: data.unseen,
      watchlist: data.watchlist,
      dismissed: data.dismissed,
    },
  };
}

export function parseBackup(content: string): LibraryData {
  let json: unknown;
  try {
    json = JSON.parse(content);
  } catch (error) {
    throw new InvalidBackupError('O arquivo selecionado não é um JSON válido.', { cause: error });
  }

  const result = backupSchema.safeParse(json);
  if (!result.success) {
    throw new InvalidBackupError('Este arquivo não é um backup válido do Recomenda Filmes.', {
      cause: result.error,
    });
  }
  return result.data.data;
}

/** Ex.: `recomenda-filmes-backup-2026-11-16.json`. */
export function backupFileName(date: Date): string {
  return `${BACKUP_APP_ID}-backup-${date.toISOString().slice(0, 10)}.json`;
}
