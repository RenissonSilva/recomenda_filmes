import { Star } from 'lucide-react';

import { Container } from '@/components/layout/container';
import { MediaPoster } from '@/components/media/media-poster';
import { TmdbImage } from '@/components/media/tmdb-image';
import { Badge } from '@/components/ui/badge';
import { getMediaLabel, toMediaSummary, type MediaDetails } from '@/domain/media';
import { getTitleStatusBadge } from '@/domain/title-status';
import { PersonLinkList } from '@/features/person/components/person-link-list';
import { formatRuntime, formatVoteAverage, pluralize } from '@/lib/format';

import { TitleActions } from './title-actions';
import { TitleGenreLinks } from './title-genre-links';
import { buildTitleStatusDetails, TitleStatusBadge } from './title-status';

function buildFacts(details: MediaDetails): string[] {
  const duration =
    details.mediaType === 'tv'
      ? details.seasonCount && pluralize(details.seasonCount, 'temporada', 'temporadas')
      : formatRuntime(details.runtimeMinutes);

  return [getMediaLabel(details), details.releaseYear, duration].filter(Boolean).map(String);
}

interface TitleHeroProps {
  details: MediaDetails;
  /** Data de hoje ("2026-11-17"): define a situação de séries e a agenda de episódios. */
  today: string;
}

export function TitleHero({ details, today }: TitleHeroProps) {
  const creatorsLabel = details.mediaType === 'movie' ? 'Direção' : 'Criação';
  const statusBadge = getTitleStatusBadge(details, today);
  const statusDetails = buildTitleStatusDetails(details, today);

  return (
    <section className="relative isolate">
      {details.backdropPath && (
        <div className="absolute inset-x-0 top-0 -z-10 h-[420px] overflow-hidden sm:h-[560px]">
          <TmdbImage
            path={details.backdropPath}
            alt=""
            fill
            preload
            sizes="100vw"
            className="object-cover object-top opacity-35"
          />
          <div className="absolute inset-0 bg-linear-to-b from-canvas/20 via-canvas/70 to-canvas" />
        </div>
      )}

      <Container className="grid gap-8 pt-8 sm:pt-16 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr] lg:gap-12">
        <MediaPoster
          media={details}
          sizes="(min-width: 1024px) 280px, (min-width: 768px) 240px, 192px"
          preload
          className="mx-auto w-48 shadow-2xl shadow-black/60 md:w-full"
        />

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-fg-muted">{buildFacts(details).join(' · ')}</p>
            <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-5xl">
              {details.title}
            </h1>
            {details.originalTitle !== details.title && (
              <p className="text-sm text-fg-muted">Título original: {details.originalTitle}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              {details.voteAverage > 0 && (
                <Badge variant="brand">
                  <Star aria-hidden fill="currentColor" />
                  {formatVoteAverage(details.voteAverage)} no TMDB
                </Badge>
              )}
              {statusBadge && <TitleStatusBadge badge={statusBadge} />}
              <TitleGenreLinks media={details} />
            </div>
            {statusDetails.length > 0 && (
              <p className="text-sm text-fg-muted">{statusDetails.join(' · ')}</p>
            )}
          </div>

          {details.tagline && <p className="text-fg-muted italic">“{details.tagline}”</p>}

          <p className="max-w-3xl leading-relaxed text-pretty">
            {details.overview || 'Sinopse ainda não disponível em português.'}
          </p>

          {details.creators.length > 0 && (
            <p className="text-sm">
              <span className="text-fg-muted">{creatorsLabel}: </span>
              <PersonLinkList people={details.creators} />
            </p>
          )}

          <TitleActions
            media={toMediaSummary(details)}
            trailerYoutubeKey={details.trailerYoutubeKey}
          />
        </div>
      </Container>
    </section>
  );
}
