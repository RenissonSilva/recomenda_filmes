import Link from 'next/link';

import { badgeVariants } from '@/components/ui/badge';
import { CANONICAL_GENRE_LABELS, toCanonicalGenres } from '@/domain/genres';
import { getMediaCategory, type MediaSummary } from '@/domain/media';
import { cn } from '@/lib/cn';
import { routes } from '@/lib/routes';

/**
 * Gêneros do título, cada um levando à página "Explorar" já filtrada na seção do título
 * (ex.: "Ação" em um anime → animes de ação). Usa os gêneros canônicos: o TMDB manda alguns
 * gêneros de série em inglês e agrupados ("Action & Adventure" → "Ação" e "Aventura").
 */
export function TitleGenreLinks({ media }: { media: MediaSummary }) {
  const filter = getMediaCategory(media);

  return toCanonicalGenres(media.genreIds).map((genre) => {
    const label = CANONICAL_GENRE_LABELS[genre];
    return (
      <Link
        key={genre}
        href={routes.exploreGenre({ genre, filter })}
        title={`Ver mais títulos de ${label}`}
        className={cn(
          badgeVariants({ variant: 'neutral' }),
          'focus-ring transition-colors hover:bg-line hover:text-fg',
        )}
      >
        {label}
      </Link>
    );
  });
}
