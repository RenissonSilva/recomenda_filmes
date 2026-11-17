import Link from 'next/link';

import { getMediaKey } from '@/domain/media';
import {
  describeCastCredit,
  type CreditRole,
  type CreditTimelineSection,
  type PersonCredit,
} from '@/domain/person';
import { routes } from '@/lib/routes';

/**
 * Filmografia em ordem cronológica, no estilo do TMDB: um bloco por papel (Atuação, Direção…)
 * e, em cada um, os títulos agrupados por ano.
 */
export function CreditTimeline({ sections }: { sections: readonly CreditTimelineSection[] }) {
  return (
    <div className="flex flex-col gap-8">
      {sections.map((section) => {
        const headingId = `timeline-${section.role}-heading`;
        return (
          <section key={section.role} aria-labelledby={headingId} className="flex flex-col gap-3">
            <h3 id={headingId} className="flex items-baseline gap-2 text-base font-semibold">
              {section.label}
              <span className="text-sm font-normal text-fg-subtle tabular-nums">
                {section.count}
              </span>
            </h3>

            <ol className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
              {section.years.map(({ year, credits }) => (
                <li
                  key={year ?? 'sem-data'}
                  className="grid grid-cols-[3rem_1fr] gap-x-4 px-4 py-3 sm:grid-cols-[4rem_1fr] sm:px-5"
                >
                  <p className="pt-px text-sm font-semibold text-fg-muted tabular-nums">
                    {year ?? (
                      <>
                        <span aria-hidden>—</span>
                        <span className="sr-only">Sem data</span>
                      </>
                    )}
                  </p>
                  <ol className="flex flex-col gap-3">
                    {credits.map((credit) => (
                      <TimelineEntry
                        key={getMediaKey(credit.media)}
                        credit={credit}
                        role={section.role}
                      />
                    ))}
                  </ol>
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

function TimelineEntry({ credit, role }: { credit: PersonCredit; role: CreditRole }) {
  const { media } = credit;
  // Personagens e episódios só fazem sentido no bloco de atuação.
  const note = role === 'cast' ? describeCastCredit(credit) : '';
  const originalTitleHint =
    media.originalTitle !== media.title ? `Título original: ${media.originalTitle}` : undefined;

  return (
    <li className="flex gap-3">
      <span
        aria-hidden
        className="mt-1.5 size-2.5 shrink-0 rounded-full border-2 border-fg-subtle"
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        <Link
          href={routes.title(media)}
          title={originalTitleHint}
          className="w-fit rounded text-sm leading-snug font-semibold focus-ring hover:underline"
        >
          {media.title}
        </Link>
        {note && <p className="text-sm text-fg-muted">{note}</p>}
      </div>
    </li>
  );
}
