import type { Metadata } from 'next';

import { buildExploreMetadata, ExplorePage } from '@/features/explore/components/explore-page';

export function generateMetadata({ searchParams }: PageProps<'/explorar'>): Promise<Metadata> {
  return buildExploreMetadata(searchParams);
}

export default function ExploreRoute({ searchParams }: PageProps<'/explorar'>) {
  return <ExplorePage searchParams={searchParams} />;
}
