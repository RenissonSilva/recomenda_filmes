import type { ComponentProps } from 'react';

import { Badge } from '@/components/ui/badge';
import { getMediaLabelGender, type MediaDetails } from '@/domain/media';
import {
  isUpcomingEpisode,
  type TitleStatusBadge as StatusBadge,
  type TitleStatusTone,
} from '@/domain/title-status';
import { formatDate, pluralize } from '@/lib/format';

const TONE_VARIANTS: Record<TitleStatusTone, ComponentProps<typeof Badge>['variant']> = {
  positive: 'success',
  info: 'brand',
  pending: 'warning',
  neutral: 'neutral',
  negative: 'danger',
};

/** Selo com a situação do título ("Renovada", "Finalizado", "Em produção"…). */
export function TitleStatusBadge({ badge }: { badge: StatusBadge }) {
  return (
    <Badge variant={TONE_VARIANTS[badge.tone]}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      <span className="sr-only">Situação: </span>
      {badge.label}
    </Badge>
  );
}

/** "hoje" ou "em 24 de novembro de 2026". */
function formatAirDay(isoDate: string, today: string): string | null {
  if (isoDate === today) return 'hoje';
  const date = formatDate(isoDate);
  return date && `em ${date}`;
}

function movieSchedule(details: MediaDetails, today: string): string | null {
  const date = details.releaseDate && formatDate(details.releaseDate);
  if (!details.releaseDate || !date) return null;
  if (details.status === 'released') return `Lançado em ${date}`;
  return details.releaseDate > today ? `Estreia prevista para ${date}` : null;
}

function seriesSchedule(details: MediaDetails, today: string): string | null {
  const { nextEpisode, lastEpisode } = details;
  const opensNewSeason =
    nextEpisode && lastEpisode && nextEpisode.seasonNumber > lastEpisode.seasonNumber;

  if (nextEpisode && isUpcomingEpisode(nextEpisode, today)) {
    const day = nextEpisode.airDate && formatAirDay(nextEpisode.airDate, today);
    if (!lastEpisode) return day ? `Estreia ${day}` : null;
    if (opensNewSeason) {
      return day
        ? `Temporada ${nextEpisode.seasonNumber} estreia ${day}`
        : `Temporada ${nextEpisode.seasonNumber} confirmada`;
    }
    if (day) return `Próximo episódio ${day}`;
  }

  if (details.status === 'ended' || details.status === 'canceled') {
    const firstYear = details.releaseYear;
    const lastYear = lastEpisode?.airDate ? Number(lastEpisode.airDate.slice(0, 4)) : null;
    const aired = getMediaLabelGender(details) === 'feminine' ? 'Exibida' : 'Exibido';
    if (firstYear && lastYear && lastYear > firstYear)
      return `${aired} de ${firstYear} a ${lastYear}`;
    if (firstYear) return `${aired} em ${firstYear}`;
  }

  const lastAired = lastEpisode?.airDate && formatDate(lastEpisode.airDate);
  return lastAired ? `Último episódio em ${lastAired}` : null;
}

/**
 * Linha de apoio do selo: lançamento do filme ou agenda da série (próximo episódio, estreia da
 * nova temporada, período em que foi exibida) e o total de episódios.
 * `today` é a data de hoje no formato do TMDB ("2026-11-17").
 */
export function buildTitleStatusDetails(details: MediaDetails, today: string): string[] {
  if (details.mediaType === 'movie') {
    const schedule = movieSchedule(details, today);
    return schedule ? [schedule] : [];
  }

  const episodes = details.episodeCount && pluralize(details.episodeCount, 'episódio', 'episódios');
  return [seriesSchedule(details, today), episodes].filter((part) => typeof part === 'string');
}
