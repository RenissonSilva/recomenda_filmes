'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';

import { Button } from './button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
  onConfirm: () => void;
  onClose: () => void;
}

/** Diálogo de confirmação baseado no `<dialog>` nativo (foco, Esc e acessibilidade prontos). */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  tone = 'default',
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    // Ao sair da página (ou ocultá-la), o diálogo é fechado para não deixar a tela inerte.
    return () => dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-line bg-surface p-6 text-fg backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <h2 id={titleId} className="text-lg font-semibold">
        {title}
      </h2>
      <div className="mt-2 text-sm text-fg-muted">{description}</div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button
          variant={tone === 'danger' ? 'danger' : 'primary'}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
