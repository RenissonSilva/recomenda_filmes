'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Fecha um elemento flutuante (menu, popover) ao clicar fora dele ou apertar Esc.
 * No Esc, o foco volta para `returnFocusRef` (normalmente o botão que abriu o menu).
 */
export function useDismiss(
  containerRef: RefObject<HTMLElement | null>,
  open: boolean,
  onDismiss: () => void,
  returnFocusRef?: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) onDismiss();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      onDismiss();
      returnFocusRef?.current?.focus();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onDismiss, containerRef, returnFocusRef]);
}
