import { describe, expect, it } from 'vitest';

import { buildMedia } from '@test/fixtures/media';

import { backupFileName, createBackup, InvalidBackupError, parseBackup } from './backup';
import { EMPTY_LIBRARY, rateTitle, toggleWatchlist } from './library-state';

describe('backup', () => {
  const date = new Date('2026-11-16T10:30:00.000Z');

  it('exporta e importa a biblioteca sem perder dados', () => {
    let data = rateTitle(EMPTY_LIBRARY, buildMedia(), 'love', date.toISOString());
    data = toggleWatchlist(data, buildMedia({ mediaType: 'tv' }), date.toISOString());

    const content = JSON.stringify(createBackup(data, date));

    expect(parseBackup(content)).toEqual(data);
  });

  it('rejeita arquivos que não são JSON ou não são backups do app', () => {
    expect(() => parseBackup('isto não é json')).toThrow(InvalidBackupError);
    expect(() => parseBackup(JSON.stringify({ app: 'outro-app', version: 1 }))).toThrow(
      'Este arquivo não é um backup válido do Recomenda Filmes.',
    );
  });

  it('gera o nome do arquivo com a data', () => {
    expect(backupFileName(date)).toBe('recomenda-filmes-backup-2026-11-16.json');
  });
});
