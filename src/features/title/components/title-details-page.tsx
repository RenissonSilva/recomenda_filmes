import { io } from 'next/cache';
import { Suspense } from 'react';

import { Container } from '@/components/layout/container';
import type { MediaType } from '@/domain/media';
import { getTodayIsoDate } from '@/lib/format';

import { loadTitle } from '../load-title';
import { AuthorWorksSection } from './author-works-section';
import { CastList } from './cast-list';
import { RelatedTitles } from './related-titles';
import { SimilarTitlesSection } from './similar-titles-section';
import { TitleHero } from './title-hero';
import { TitleSectionSkeleton } from './title-section-skeleton';
import { WatchProvidersSection } from './watch-providers-section';

interface TitleDetailsPageProps {
  mediaType: MediaType;
  params: Promise<{ id: string }>;
}

/**
 * Página de detalhes compartilhada por `/filme/[id]` e `/serie/[id]`.
 * "Outras obras" e "Parecidos" dependem de várias consultas ao TMDB: chegam depois,
 * sem atrasar o restante da página.
 */
export async function TitleDetailsPage({ mediaType, params }: TitleDetailsPageProps) {
  const details = await loadTitle(mediaType, params);
  // A situação (ex.: "Renovada") e a agenda de episódios dependem do dia de hoje:
  // `io()` deixa esse cálculo fora do prerender.
  await io();
  const today = getTodayIsoDate();

  return (
    <article>
      <TitleHero details={details} today={today} />
      <Container className="mt-12 flex flex-col gap-12">
        <WatchProvidersSection providers={details.watchProviders} />
        <CastList cast={details.cast} />
        <Suspense fallback={<TitleSectionSkeleton />}>
          <AuthorWorksSection mediaType={details.mediaType} id={details.id} />
        </Suspense>
        <Suspense fallback={<TitleSectionSkeleton />}>
          <SimilarTitlesSection details={details} />
        </Suspense>
        <RelatedTitles details={details} />
      </Container>
    </article>
  );
}
