import type { Metadata } from 'next';

import { Container } from '@/components/layout/container';
import { PageHeader } from '@/components/layout/page-header';
import { WatchlistView } from '@/features/library/components/watchlist-view';

export const metadata: Metadata = {
  title: 'Quero ver',
};

export default function WatchlistPage() {
  return (
    <Container>
      <PageHeader
        title="Quero ver"
        description="Os títulos que você guardou para assistir depois. Já viu? Avalie para melhorar suas recomendações."
      />
      <WatchlistView />
    </Container>
  );
}
