import type { Metadata } from 'next';

import { Container } from '@/components/layout/container';
import { PageHeader } from '@/components/layout/page-header';
import { RatedTitlesView } from '@/features/library/components/rated-titles-view';

export const metadata: Metadata = {
  title: 'Minhas avaliações',
};

export default function MyRatingsPage() {
  return (
    <Container>
      <PageHeader
        title="Minhas avaliações"
        description="Tudo o que você já avaliou. Mudou de ideia? É só escolher outra nota — ou clicar na atual para desfazer."
      />
      <RatedTitlesView />
    </Container>
  );
}
