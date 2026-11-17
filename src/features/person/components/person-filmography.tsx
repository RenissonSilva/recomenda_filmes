'use client';

import { Clapperboard } from 'lucide-react';
import { useMemo, useState } from 'react';

import { EmptyState } from '@/components/ui/empty-state';
import { SegmentedControl, type SegmentedControlOption } from '@/components/ui/segmented-control';
import { matchesFilter } from '@/domain/media';
import { buildCreditTimeline, describeCredit, type PersonCredit } from '@/domain/person';
import { TitleCollection } from '@/features/catalog/components/title-collection';
import { useMediaGroups } from '@/features/catalog/hooks/use-media-groups';

import { CreditTimeline } from './credit-timeline';

type FilmographyView = 'grid' | 'timeline';

const VIEW_OPTIONS: SegmentedControlOption<FilmographyView>[] = [
  { value: 'grid', label: 'Grade' },
  { value: 'timeline', label: 'Linha do tempo' },
];

interface PersonFilmographyProps {
  personName: string;
  credits: readonly PersonCredit[];
}

/**
 * Filmografia da pessoa em duas visualizações: grade de pôsteres (com ordenação) ou linha do
 * tempo por ano. A seção aberta (Filmes, Séries, Animes) é a mesma nas duas.
 */
export function PersonFilmography({ personName, credits }: PersonFilmographyProps) {
  const { options: groups, group, setGroup } = useMediaGroups(credits, 'tabs');
  const [view, setView] = useState<FilmographyView>('grid');

  const gridItems = useMemo(
    () => credits.map((credit) => ({ media: credit.media, note: describeCredit(credit) })),
    [credits],
  );
  const timeline = useMemo(
    () => buildCreditTimeline(credits.filter((credit) => matchesFilter(credit.media, group))),
    [credits, group],
  );

  const hasCredits = credits.length > 0;

  return (
    <section aria-labelledby="filmography-heading" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="filmography-heading" className="text-xl font-semibold tracking-tight">
          Filmografia
        </h2>
        {hasCredits && (
          <SegmentedControl
            label="Visualização da filmografia"
            options={VIEW_OPTIONS}
            value={view}
            onChange={setView}
          />
        )}
      </div>

      {!hasCredits && (
        <EmptyState
          icon={<Clapperboard aria-hidden />}
          title="Nenhum título encontrado"
          description={`O TMDB ainda não tem filmes, séries ou animes de ${personName}.`}
        />
      )}

      {hasCredits && view === 'grid' && (
        <TitleCollection
          items={gridItems}
          sorts={['rating', 'popularity', 'recent']}
          grouping="tabs"
          pageSize={24}
          group={group}
          onGroupChange={setGroup}
        />
      )}

      {hasCredits && view === 'timeline' && (
        <div className="flex flex-col gap-5">
          <SegmentedControl
            label="Seção"
            options={groups}
            value={group}
            onChange={setGroup}
            className="self-start"
          />
          <CreditTimeline sections={timeline} />
        </div>
      )}
    </section>
  );
}
