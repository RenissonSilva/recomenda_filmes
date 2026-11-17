import { Container } from '@/components/layout/container';
import { MediaGridSkeleton } from '@/components/media/media-grid';
import { Skeleton } from '@/components/ui/skeleton';

export function ExploreSkeleton() {
  return (
    <Container>
      <div className="flex flex-col gap-3 pt-8 pb-6 sm:pt-12">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="mb-6 flex flex-wrap justify-between gap-3">
        <Skeleton className="h-9 w-72 max-w-full rounded-full" />
        <Skeleton className="h-9 w-48 rounded-full" />
      </div>
      <MediaGridSkeleton />
    </Container>
  );
}
