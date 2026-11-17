import type { MediaType } from '@/domain/media';
import { TitleCollection } from '@/features/catalog/components/title-collection';
import { PersonLinkList } from '@/features/person/components/person-link-list';
import { getTitleAuthorWorks } from '@/server/titles/author-works';
import { withTmdbFallback } from '@/server/tmdb/fallback';

import { TitleSection } from './title-section';

interface AuthorWorksSectionProps {
  mediaType: MediaType;
  id: number;
}

/** "Outras obras de…": o que mais a direção, a criação ou o autor do mangá/livro fizeram. */
export async function AuthorWorksSection({ mediaType, id }: AuthorWorksSectionProps) {
  // Seção opcional: se o TMDB falhar, a página aparece sem ela.
  const result = await withTmdbFallback(() => getTitleAuthorWorks(mediaType, id), null);
  if (!result) return null;

  return (
    <TitleSection
      id="author-works"
      title={
        <>
          Outras obras de <PersonLinkList people={result.authors} />
        </>
      }
    >
      <TitleCollection
        items={result.works.map((media) => ({ media }))}
        sorts={['rating', 'popularity', 'recent']}
        grouping="filter"
      />
    </TitleSection>
  );
}
