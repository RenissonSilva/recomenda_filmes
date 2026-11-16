import { MediaCard } from '@/components/media/media-card';
import { MediaGrid } from '@/components/media/media-grid';
import { getMediaKey, type MediaSummary } from '@/domain/media';
import { WatchlistButton } from '@/features/library/components/watchlist-button';

import { TitleSection } from './title-section';

const MAX_RELATED = 12;

export function RelatedTitles({ title, items }: { title: string; items: MediaSummary[] }) {
  if (items.length === 0) return null;

  return (
    <TitleSection id="related" title={`Quem curte ${title} também curte`}>
      <MediaGrid>
        {items.slice(0, MAX_RELATED).map((media) => (
          <li key={getMediaKey(media)}>
            <MediaCard media={media} action={<WatchlistButton media={media} />} />
          </li>
        ))}
      </MediaGrid>
    </TitleSection>
  );
}
