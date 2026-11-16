import type { Metadata } from 'next';

import { buildTitleMetadata } from '@/features/title/load-title';
import { TitleDetailsPage } from '@/features/title/components/title-details-page';

export function generateMetadata({ params }: PageProps<'/filme/[id]'>): Promise<Metadata> {
  return buildTitleMetadata('movie', params);
}

export default function MoviePage({ params }: PageProps<'/filme/[id]'>) {
  return <TitleDetailsPage mediaType="movie" params={params} />;
}
