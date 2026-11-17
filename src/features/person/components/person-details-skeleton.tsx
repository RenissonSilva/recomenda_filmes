import { Container } from '@/components/layout/container';
import { MediaGridSkeleton } from '@/components/media/media-grid';
import { Skeleton } from '@/components/ui/skeleton';

export function PersonDetailsSkeleton() {
  return (
    <Container role="status" aria-label="Carregando pessoa" className="flex flex-col gap-12">
      <div className="grid gap-8 pt-8 sm:pt-16 md:grid-cols-[220px_1fr] lg:gap-12">
        <Skeleton className="mx-auto aspect-[2/3] w-44 rounded-xl md:w-full" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-72 max-w-full" />
          <Skeleton className="h-4 w-full max-w-3xl" />
          <Skeleton className="h-4 w-full max-w-3xl" />
          <Skeleton className="h-4 w-2/3 max-w-3xl" />
        </div>
      </div>
      <div className="flex flex-col gap-5">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-10 w-80 max-w-full rounded-full" />
        <MediaGridSkeleton count={12} />
      </div>
    </Container>
  );
}
