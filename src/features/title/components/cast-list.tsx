import { UserRound } from 'lucide-react';
import Link from 'next/link';

import { TmdbImage } from '@/components/media/tmdb-image';
import type { Person } from '@/domain/media';
import { routes } from '@/lib/routes';

import { TitleSection } from './title-section';

export function CastList({ cast }: { cast: Person[] }) {
  if (cast.length === 0) return null;

  return (
    <TitleSection id="cast" title="Elenco principal">
      <ul className="-mx-4 no-scrollbar flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {cast.map((person) => (
          <li key={person.id} className="w-28 shrink-0">
            <Link href={routes.person(person)} className="group block rounded-xl focus-ring">
              <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-surface-2 ring-1 ring-white/5 transition group-hover:ring-white/20">
                {person.profilePath ? (
                  <TmdbImage
                    path={person.profilePath}
                    alt=""
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                ) : (
                  <UserRound
                    aria-hidden
                    className="absolute inset-0 m-auto size-10 text-fg-subtle"
                  />
                )}
              </div>
              <p className="mt-2 text-sm leading-tight font-medium group-hover:underline">
                {person.name}
              </p>
              {person.role && (
                <p className="mt-0.5 line-clamp-2 text-xs text-fg-muted">{person.role}</p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </TitleSection>
  );
}
