import { Container } from '@/components/layout/container';
import { Skeleton } from '@/components/ui/skeleton';

export function TitleDetailsSkeleton() {
  return (
    <Container
      role="status"
      aria-label="Carregando título"
      className="grid gap-8 pt-8 sm:pt-16 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr] lg:gap-12"
    >
      <Skeleton className="mx-auto aspect-[2/3] w-48 rounded-xl md:w-full" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full max-w-3xl" />
        <Skeleton className="h-4 w-full max-w-3xl" />
        <Skeleton className="h-4 w-2/3 max-w-3xl" />
        <Skeleton className="mt-2 h-40 w-full max-w-xl rounded-2xl" />
      </div>
    </Container>
  );
}
