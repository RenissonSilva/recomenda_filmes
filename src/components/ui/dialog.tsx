'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';

interface DialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  /** Botões de ação, alinhados à direita. */
  actions: ReactNode;
  onClose?: () => void;
  /**
   * `false` para decisões obrigatórias: Esc e o fechamento pelo navegador não fecham o diálogo,
   * só as ações (que devem mudar `open`).
   */
  dismissible?: boolean;
}

/** Diálogo modal baseado no `<dialog>` nativo (foco, Esc e acessibilidade prontos). */
export function Dialog({
  open,
  title,
  description,
  actions,
  onClose,
  dismissible = true,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    // Ao sair da página (ou ocultá-la), o diálogo é fechado para não deixar a tela inerte.
    return () => dialog.close();
  }, [open]);

  const handleClose = () => {
    const dialog = dialogRef.current;
    // O navegador pode forçar o fechamento (ex.: Esc repetido); uma decisão obrigatória reabre.
    if (!dismissible && open) {
      if (dialog && !dialog.open) dialog.showModal();
      return;
    }
    onClose?.();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        if (!dismissible) event.preventDefault();
      }}
      onClose={handleClose}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-line bg-surface p-6 text-fg backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <h2 id={titleId} className="text-lg font-semibold">
        {title}
      </h2>
      <div id={descriptionId} className="mt-2 text-sm text-pretty text-fg-muted">
        {description}
      </div>
      <div className="mt-6 flex flex-wrap justify-end gap-2">{actions}</div>
    </dialog>
  );
}
