import { Container } from '@/components/layout/container';
import { PageHeader } from '@/components/layout/page-header';
import { TextLink } from '@/components/ui/text-link';
import { CANONICAL_GENRE_LABELS } from '@/domain/genres';
import { parseExploreParams, routes, type SearchParams } from '@/lib/routes';

import { GenreDirectory } from './genre-directory';
import { GenreExploreView } from './genre-explore-view';

/**
 * Página `/explorar`: os títulos de um gênero (`?genero=acao`) ou, sem gênero válido,
 * a lista de gêneros para escolher.
 */
export async function ExplorePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { genre, filter, sort } = parseExploreParams(await searchParams);

  if (!genre) {
    return (
      <Container>
        <PageHeader
          title="Explorar"
          description="Escolha um gênero para ver filmes, séries e animes."
        />
        <GenreDirectory />
      </Container>
    );
  }

  return (
    <Container>
      <PageHeader
        title={CANONICAL_GENRE_LABELS[genre]}
        description={
          <>
            Filmes, séries e animes deste gênero.{' '}
            <TextLink href={routes.explore}>Ver outros gêneros</TextLink>
          </>
        }
      />
      {/* A chave recria a lista quando outro link do app abre esta página com outros filtros. */}
      <GenreExploreView
        key={`${genre}:${filter}:${sort}`}
        genre={genre}
        filter={filter}
        sort={sort}
      />
    </Container>
  );
}

export async function buildExploreMetadata(searchParams: Promise<SearchParams>) {
  const { genre } = parseExploreParams(await searchParams);
  if (!genre) {
    return { title: 'Explorar', description: 'Filmes, séries e animes por gênero.' };
  }

  const label = CANONICAL_GENRE_LABELS[genre];
  return { title: label, description: `Filmes, séries e animes do gênero ${label}.` };
}
