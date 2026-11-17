import { MediaCard } from '@/components/media/media-card';
import { MediaGrid } from '@/components/media/media-grid';
import { VoteBadge } from '@/components/media/vote-badge';
import { getMediaKey, type MediaDetails, type MediaSummary } from '@/domain/media';
import { WatchlistButton } from '@/features/library/components/watchlist-button';

import { TitleSection } from './title-section';

const MAX_RELATED = 12;

/** Títulos exibidos em "Quem curte… também curte": as primeiras recomendações do TMDB. */
export function getRelatedTitles(details: Pick<MediaDetails, 'recommendations'>): MediaSummary[] {
  return details.recommendations.slice(0, MAX_RELATED);
}

export function RelatedTitles({ details }: { details: MediaDetails }) {
  const items = getRelatedTitles(details);
  if (items.length === 0) return null;

  return (
    <TitleSection id="related" title={`Quem curte ${details.title} também curte`}>
      <MediaGrid>
        {items.map((media) => (
          <li key={getMediaKey(media)}>
            <MediaCard
              media={media}
              badge={<VoteBadge media={media} />}
              action={<WatchlistButton media={media} />}
            />
          </li>
        ))}
      </MediaGrid>
    </TitleSection>
  );
}
