'use client';

import { useEffect } from 'react';

import { Container } from '@/components/layout/container';
import { ErrorState } from '@/components/ui/error-state';

const GENERIC_MESSAGE =
  'Não foi possível carregar esta página. Verifique sua conexão e tente novamente.';

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  // Em produção, erros vindos do servidor chegam com mensagem genérica (sem detalhes sensíveis).
  const message =
    process.env.NODE_ENV === 'development' && error instanceof Error
      ? error.message
      : GENERIC_MESSAGE;

  return (
    <Container className="py-16">
      <ErrorState message={message} onRetry={retry} />
    </Container>
  );
}
