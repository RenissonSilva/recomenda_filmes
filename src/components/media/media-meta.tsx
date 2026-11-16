import { getMediaLabel, type MediaSummary } from '@/domain/media';
import { cn } from '@/lib/cn';

interface MediaMetaProps {
  media: Pick<MediaSummary, 'mediaType' | 'releaseYear' | 'genreIds' | 'originalLanguage'>;
  className?: string;
}

/** Linha de metadados: "2014 · Filme", "2013 · Anime"… */
export function MediaMeta({ media, className }: MediaMetaProps) {
  const parts = [media.releaseYear, getMediaLabel(media)].filter(Boolean);
  return <p className={cn('text-xs text-fg-muted', className)}>{parts.join(' · ')}</p>;
}
