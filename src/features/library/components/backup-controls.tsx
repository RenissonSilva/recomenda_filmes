'use client';

import { Download, Trash2, Upload } from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { pluralize } from '@/lib/format';

import { backupFileName, createBackup, InvalidBackupError, parseBackup } from '../backup';
import { useLibraryActions } from '../hooks';
import type { LibraryData } from '../library-state';
import { useLibraryStore } from '../store';

function downloadJson(fileName: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement('a'), { href: url, download: fileName });
  link.click();
  URL.revokeObjectURL(url);
}

type PendingAction = { kind: 'import'; data: LibraryData } | { kind: 'clear' } | null;

/** Exportar/importar a biblioteca em JSON e apagar todos os dados. */
export function BackupControls() {
  const { replaceAll, clear } = useLibraryActions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingAction>(null);

  const handleExport = () => {
    const now = new Date();
    downloadJson(backupFileName(now), createBackup(useLibraryStore.getState(), now));
    toast.success('Backup exportado.');
  };

  const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      setPending({ kind: 'import', data: parseBackup(await file.text()) });
    } catch (error) {
      toast.error(
        error instanceof InvalidBackupError ? error.message : 'Não foi possível ler o arquivo.',
      );
    }
  };

  const importedCount = pending?.kind === 'import' ? Object.keys(pending.data.ratings).length : 0;

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={handleExport}>
        <Download aria-hidden />
        Exportar backup
      </Button>
      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
        <Upload aria-hidden />
        Importar backup
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setPending({ kind: 'clear' })}>
        <Trash2 aria-hidden />
        Apagar tudo
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => void handleFileSelected(event)}
      />

      <ConfirmDialog
        open={pending?.kind === 'import'}
        title="Importar backup?"
        description={`O backup tem ${pluralize(importedCount, 'avaliação', 'avaliações')}. Ele vai substituir todos os dados atuais deste navegador.`}
        confirmLabel="Importar e substituir"
        onConfirm={() => {
          if (pending?.kind !== 'import') return;
          replaceAll(pending.data);
          toast.success('Backup importado.');
        }}
        onClose={() => setPending(null)}
      />

      <ConfirmDialog
        open={pending?.kind === 'clear'}
        title="Apagar todos os dados?"
        description="Suas avaliações, a lista Quero ver e os títulos dispensados serão apagados deste navegador. Considere exportar um backup antes."
        confirmLabel="Apagar tudo"
        tone="danger"
        onConfirm={() => {
          clear();
          toast.success('Dados apagados.');
        }}
        onClose={() => setPending(null)}
      />
    </div>
  );
}
