import { MediaGridSkeleton } from '@/components/media/media-grid';
import { Skeleton } from '@/components/ui/skeleton';

/** Espaço reservado das seções carregadas depois do restante da página. */
export function TitleSectionSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-7 w-64 max-w-full" />
      <MediaGridSkeleton count={6} />
    </div>
  );
}
