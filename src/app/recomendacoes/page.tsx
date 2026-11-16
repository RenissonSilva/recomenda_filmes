import type { Metadata } from 'next';

import { Container } from '@/components/layout/container';
import { PageHeader } from '@/components/layout/page-header';
import { RecommendationsView } from '@/features/recommendations/components/recommendations-view';

export const metadata: Metadata = {
  title: 'Recomendações',
  description: 'Filmes, séries e animes recomendados com base nas suas avaliações.',
};

export default function RecommendationsPage() {
  return (
    <Container>
      <PageHeader
        title="Recomendações para você"
        description="Títulos escolhidos a partir das suas avaliações. A porcentagem indica o quanto cada um combina com o seu gosto."
      />
      <RecommendationsView />
    </Container>
  );
}
