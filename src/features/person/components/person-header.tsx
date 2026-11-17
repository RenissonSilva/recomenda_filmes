import { UserRound } from 'lucide-react';

import { TmdbImage } from '@/components/media/tmdb-image';
import { ExpandableText } from '@/components/ui/expandable-text';
import type { PersonDetails } from '@/domain/person';
import { pluralize } from '@/lib/format';

import { PersonFacts } from './person-facts';

interface PersonHeaderProps {
  person: PersonDetails;
  /** Data de hoje ("2026-11-17"), usada para calcular a idade. */
  today: string;
}

export function PersonHeader({ person, today }: PersonHeaderProps) {
  const summary = [person.knownFor, pluralize(person.credits.length, 'título', 'títulos')]
    .filter(Boolean)
    .join(' · ');

  return (
    <header className="grid gap-8 pt-8 sm:pt-16 md:grid-cols-[220px_1fr] lg:gap-12">
      <div className="relative mx-auto aspect-[2/3] w-44 overflow-hidden rounded-xl bg-surface-2 shadow-2xl ring-1 shadow-black/60 ring-white/5 md:w-full">
        {person.profilePath ? (
          <TmdbImage
            path={person.profilePath}
            alt={`Foto de ${person.name}`}
            fill
            preload
            sizes="(min-width: 768px) 220px, 176px"
            className="object-cover"
          />
        ) : (
          <UserRound aria-hidden className="absolute inset-0 m-auto size-16 text-fg-subtle" />
        )}
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-fg-muted">{summary}</p>
          <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-5xl">
            {person.name}
          </h1>
        </div>

        <PersonFacts person={person} today={today} />

        {person.biography && <ExpandableText text={person.biography} className="max-w-3xl" />}
      </div>
    </header>
  );
}
