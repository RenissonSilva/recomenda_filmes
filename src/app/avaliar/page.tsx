import type { Metadata } from 'next';

import { Container } from '@/components/layout/container';
import { PageHeader } from '@/components/layout/page-header';
import { RateTitlesView } from '@/features/rating/components/rate-titles-view';

export const metadata: Metadata = {
  title: 'Avaliar',
  description: 'Avalie filmes, séries e animes que você já assistiu para receber recomendações.',
};

export default function RatePage() {
  return (
    <Container>
      <PageHeader
        title="Avaliar"
        description="Diga o que achou dos filmes, séries e animes que você já viu. Quanto mais avaliações, mais certeiras ficam as recomendações."
      />
      <RateTitlesView />
    </Container>
  );
}
