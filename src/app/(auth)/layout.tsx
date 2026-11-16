import type { ReactNode } from 'react';

import { Container } from '@/components/layout/container';

/** Layout das telas de autenticação: um cartão estreito e centralizado. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <Container className="flex justify-center py-10 sm:py-16">
      <div className="w-full max-w-md">{children}</div>
    </Container>
  );
}
