import type { Metadata } from 'next';

import { PersonDetailsPage } from '@/features/person/components/person-details-page';
import { buildPersonMetadata } from '@/features/person/load-person';

export function generateMetadata({ params }: PageProps<'/pessoa/[id]'>): Promise<Metadata> {
  return buildPersonMetadata(params);
}

export default function PersonPage({ params }: PageProps<'/pessoa/[id]'>) {
  return <PersonDetailsPage params={params} />;
}
