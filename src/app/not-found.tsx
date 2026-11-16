import { Clapperboard } from 'lucide-react';

import { Container } from '@/components/layout/container';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { routes } from '@/lib/routes';

export default function NotFound() {
  return (
    <Container className="py-16">
      <EmptyState
        icon={<Clapperboard aria-hidden />}
        title="Página não encontrada"
        description="O título ou a página que você procurou não existe (ou saiu de cartaz)."
        action={<ButtonLink href={routes.home}>Voltar ao início</ButtonLink>}
      />
    </Container>
  );
}
