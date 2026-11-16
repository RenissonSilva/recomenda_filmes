'use client';

import { ListChecks } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { MediaFilterControl } from '@/components/media/media-filter-control';
import { MediaGrid, MediaGridSkeleton } from '@/components/media/media-grid';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { getMediaKey, matchesFilter, type MediaFilter } from '@/domain/media';
import { RATING_OPTIONS, UNSEEN_LABEL, type RatingValue } from '@/domain/rating';
import { RateableMediaCard } from '@/features/rating/components/rateable-media-card';
import { routes } from '@/lib/routes';

import { useLibraryHydrated } from '../hooks';
import { sortedEntries } from '../library-state';
import { useLibraryStore } from '../store';
import { BackupControls } from './backup-controls';

type RatingTab = 'all' | RatingValue | 'unseen';

/** Abas: Todas, Ótimo, Bom, Ruim, Odeio, Nunca vi. */
const TABS: ReadonlyArray<{ value: RatingTab; label: string }> = [
  { value: 'all', label: 'Todas' },
  ...[...RATING_OPTIONS].reverse().map((option) => ({ value: option.value, label: option.label })),
  { value: 'unseen', label: UNSEEN_LABEL },
];

function TabCount({ count }: { count: number }) {
  return <span className="text-xs tabular-nums opacity-60">{count}</span>;
}

/** Tela "Minhas avaliações". */
export function RatedTitlesView() {
  const hydrated = useLibraryHydrated();
  const [tab, setTab] = useState<RatingTab>('all');
  const [filter, setFilter] = useState<MediaFilter>('all');

  const { ratings, unseen } = useLibraryStore(
    useShallow((state) => ({ ratings: state.ratings, unseen: state.unseen })),
  );

  const ratedEntries = useMemo(() => sortedEntries(ratings), [ratings]);
  const unseenEntries = useMemo(() => sortedEntries(unseen), [unseen]);

  const counts = useMemo(() => {
    const byTab: Record<RatingTab, number> = {
      all: ratedEntries.length,
      unseen: unseenEntries.length,
      hate: 0,
      dislike: 0,
      like: 0,
      love: 0,
    };
    for (const entry of ratedEntries) byTab[entry.value]++;
    return byTab;
  }, [ratedEntries, unseenEntries]);

  const visibleMedia = useMemo(() => {
    const entries =
      tab === 'unseen'
        ? unseenEntries
        : ratedEntries.filter((entry) => tab === 'all' || entry.value === tab);
    return entries.map((entry) => entry.media).filter((media) => matchesFilter(media, filter));
  }, [tab, filter, ratedEntries, unseenEntries]);

  if (!hydrated) return <MediaGridSkeleton />;

  if (ratedEntries.length === 0 && unseenEntries.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <EmptyState
          icon={<ListChecks aria-hidden />}
          title="Você ainda não avaliou nenhum título"
          description="Avalie filmes, séries e animes que você já assistiu para receber recomendações personalizadas."
          action={<ButtonLink href={routes.rate}>Começar a avaliar</ButtonLink>}
        />
        <BackupControls />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SegmentedControl
          label="Filtrar por avaliação"
          options={TABS.map((option) => ({
            ...option,
            suffix: <TabCount count={counts[option.value]} />,
          }))}
          value={tab}
          onChange={setTab}
        />
        <MediaFilterControl value={filter} onChange={setFilter} className="self-start" />
      </div>

      {visibleMedia.length === 0 ? (
        <EmptyState
          icon={<ListChecks aria-hidden />}
          title="Nenhum título neste filtro"
          description="Troque a aba ou a seção para ver outros títulos."
        />
      ) : (
        <MediaGrid>
          {visibleMedia.map((media) => (
            <li key={getMediaKey(media)}>
              <RateableMediaCard media={media} showUnseen={false} />
            </li>
          ))}
        </MediaGrid>
      )}

      <section aria-labelledby="backup-title" className="mt-6 border-t border-line pt-6">
        <h2 id="backup-title" className="font-semibold">
          Seus dados
        </h2>
        <p className="mt-1 mb-4 max-w-2xl text-sm text-fg-muted">
          Suas avaliações ficam salvas apenas neste navegador. Exporte um backup para guardar uma
          cópia ou levá-las para outro dispositivo.
        </p>
        <BackupControls />
      </section>
    </div>
  );
}
