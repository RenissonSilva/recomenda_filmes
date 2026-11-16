import { UserRound } from 'lucide-react';

import { TmdbImage } from '@/components/media/tmdb-image';
import type { Person } from '@/domain/media';

import { TitleSection } from './title-section';

export function CastList({ cast }: { cast: Person[] }) {
  if (cast.length === 0) return null;

  return (
    <TitleSection id="cast" title="Elenco principal">
      <ul className="-mx-4 no-scrollbar flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {cast.map((person) => (
          <li key={person.id} className="w-28 shrink-0">
            <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-surface-2">
              {person.profilePath ? (
                <TmdbImage
                  path={person.profilePath}
                  alt={person.name}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              ) : (
                <UserRound aria-hidden className="absolute inset-0 m-auto size-10 text-fg-subtle" />
              )}
            </div>
            <p className="mt-2 text-sm leading-tight font-medium">{person.name}</p>
            {person.role && (
              <p className="mt-0.5 line-clamp-2 text-xs text-fg-muted">{person.role}</p>
            )}
          </li>
        ))}
      </ul>
    </TitleSection>
  );
}
