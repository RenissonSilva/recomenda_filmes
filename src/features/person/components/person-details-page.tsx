import { Clapperboard } from 'lucide-react';

import { Container } from '@/components/layout/container';
import { EmptyState } from '@/components/ui/empty-state';
import { describeCredit } from '@/domain/person';
import { TitleCollection } from '@/features/catalog/components/title-collection';

import { loadPerson } from '../load-person';
import { PersonHeader } from './person-header';

/** Página `/pessoa/[id]`: dados da pessoa e filmografia separada em filmes, séries e animes. */
export async function PersonDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const person = await loadPerson(params);
  const items = person.credits.map((credit) => ({
    media: credit.media,
    note: describeCredit(credit),
  }));

  return (
    <Container className="flex flex-col gap-12">
      <PersonHeader person={person} />

      <section aria-labelledby="filmography-heading" className="flex flex-col gap-4">
        <h2 id="filmography-heading" className="text-xl font-semibold tracking-tight">
          Filmografia
        </h2>
        {items.length > 0 ? (
          <TitleCollection
            items={items}
            sorts={['rating', 'popularity', 'recent']}
            grouping="tabs"
            pageSize={24}
          />
        ) : (
          <EmptyState
            icon={<Clapperboard aria-hidden />}
            title="Nenhum título encontrado"
            description={`O TMDB ainda não tem filmes, séries ou animes de ${person.name}.`}
          />
        )}
      </section>
    </Container>
  );
}
