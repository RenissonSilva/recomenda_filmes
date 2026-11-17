import Link from 'next/link';

import { CANONICAL_GENRE_LABELS, CANONICAL_GENRES } from '@/domain/genres';
import { routes } from '@/lib/routes';

const GENRES_BY_LABEL = [...CANONICAL_GENRES].sort((a, b) =>
  CANONICAL_GENRE_LABELS[a].localeCompare(CANONICAL_GENRE_LABELS[b], 'pt-BR'),
);

/** Todos os gêneros, em ordem alfabética, cada um levando à sua lista de títulos. */
export function GenreDirectory() {
  return (
    <ul aria-label="Gêneros" className="flex flex-wrap gap-3">
      {GENRES_BY_LABEL.map((genre) => (
        <li key={genre}>
          <Link
            href={routes.exploreGenre({ genre })}
            className="inline-flex h-10 items-center rounded-full border border-line bg-surface px-4 text-sm font-medium focus-ring transition-colors hover:bg-surface-2"
          >
            {CANONICAL_GENRE_LABELS[genre]}
          </Link>
        </li>
      ))}
    </ul>
  );
}
