import { UserRound } from 'lucide-react';

import { TmdbImage } from '@/components/media/tmdb-image';
import { ExpandableText } from '@/components/ui/expandable-text';
import type { PersonDetails } from '@/domain/person';
import { formatDate, pluralize } from '@/lib/format';

function buildLifeFacts(person: PersonDetails): Array<{ label: string; value: string }> {
  const birthday = person.birthday && formatDate(person.birthday);
  const deathday = person.deathday && formatDate(person.deathday);
  const birth = [birthday, person.placeOfBirth].filter(Boolean).join(' em ');

  return [
    { label: 'Nascimento', value: birth },
    { label: 'Falecimento', value: deathday || '' },
  ].filter((fact) => fact.value);
}

export function PersonHeader({ person }: { person: PersonDetails }) {
  const summary = [person.knownFor, pluralize(person.credits.length, 'título', 'títulos')]
    .filter(Boolean)
    .join(' · ');
  const lifeFacts = buildLifeFacts(person);

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
          {person.originalName && (
            <p className="text-sm text-fg-muted">Nome original: {person.originalName}</p>
          )}
        </div>

        {lifeFacts.length > 0 && (
          <dl className="flex flex-col gap-1 text-sm">
            {lifeFacts.map((fact) => (
              <div key={fact.label}>
                <dt className="inline text-fg-muted">{fact.label}: </dt>
                <dd className="inline">{fact.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {person.biography && <ExpandableText text={person.biography} className="max-w-3xl" />}
      </div>
    </header>
  );
}
