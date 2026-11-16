import type { Metadata } from 'next';

import { buildTitleMetadata } from '@/features/title/load-title';
import { TitleDetailsPage } from '@/features/title/components/title-details-page';

export function generateMetadata({ params }: PageProps<'/serie/[id]'>): Promise<Metadata> {
  return buildTitleMetadata('tv', params);
}

export default function SeriesPage({ params }: PageProps<'/serie/[id]'>) {
  return <TitleDetailsPage mediaType="tv" params={params} />;
}
