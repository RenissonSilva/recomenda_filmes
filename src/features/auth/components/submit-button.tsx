import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

/** Botão principal dos formulários de autenticação, com indicador de envio. */
export function SubmitButton({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <Button type="submit" size="lg" className="mt-2 w-full" disabled={pending}>
      {pending && <Spinner label="Enviando" className="text-brand-fg" />}
      {children}
    </Button>
  );
}
