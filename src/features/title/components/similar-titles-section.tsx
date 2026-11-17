import { getMediaKey, type MediaDetails } from '@/domain/media';
import { TitleCollection } from '@/features/catalog/components/title-collection';
import { getSimilarTitles } from '@/server/titles/similar-titles';
import { withTmdbFallback } from '@/server/tmdb/fallback';

import { getRelatedTitles } from './related-titles';
import { TitleSection } from './title-section';

/** "Parecidos com…": filmes, séries e animes com enredo e gênero semelhantes. */
export async function SimilarTitlesSection({ details }: { details: MediaDetails }) {
  // Seção opcional: se o TMDB falhar, a página aparece sem ela.
  const similar = await withTmdbFallback(() => getSimilarTitles(details.mediaType, details.id), []);

  // O que já aparece em "Quem curte… também curte" não se repete aqui.
  const related = new Set(getRelatedTitles(details).map(getMediaKey));
  const items = similar
    .filter((media) => !related.has(getMediaKey(media)))
    .map((media) => ({ media }));

  if (items.length === 0) return null;

  return (
    <TitleSection
      id="similar"
      title={`Parecidos com ${details.title}`}
      description="Filmes, séries e animes com enredo e gênero semelhantes."
    >
      <TitleCollection
        items={items}
        sorts={['rating', 'similarity', 'popularity', 'recent']}
        grouping="filter"
      />
    </TitleSection>
  );
}
