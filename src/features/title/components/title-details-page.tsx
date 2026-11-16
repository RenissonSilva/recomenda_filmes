import { Container } from '@/components/layout/container';
import type { MediaType } from '@/domain/media';

import { loadTitle } from '../load-title';
import { CastList } from './cast-list';
import { RelatedTitles } from './related-titles';
import { TitleHero } from './title-hero';
import { WatchProvidersSection } from './watch-providers-section';

interface TitleDetailsPageProps {
  mediaType: MediaType;
  params: Promise<{ id: string }>;
}

/** Página de detalhes compartilhada por `/filme/[id]` e `/serie/[id]`. */
export async function TitleDetailsPage({ mediaType, params }: TitleDetailsPageProps) {
  const details = await loadTitle(mediaType, params);

  return (
    <article>
      <TitleHero details={details} />
      <Container className="mt-12 flex flex-col gap-12">
        <WatchProvidersSection providers={details.watchProviders} />
        <CastList cast={details.cast} />
        <RelatedTitles title={details.title} items={details.recommendations} />
      </Container>
    </article>
  );
}
