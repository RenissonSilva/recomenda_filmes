/**
 * Situação de um título: lançado, em produção, em exibição, renovado, finalizado…
 * Assim como `media.ts`, não depende de framework nem do TMDB.
 */

import {
  getMediaLabelGender,
  type CategorizableMedia,
  type GrammaticalGender,
  type MediaDetails,
} from './media';

/** Situações informadas pelo TMDB (filmes e séries), já normalizadas. */
export const TITLE_STATUSES = [
  'rumored',
  'planned',
  'in-production',
  'post-production',
  'pilot',
  'released',
  'returning',
  'ended',
  'canceled',
] as const;
export type TitleStatus = (typeof TITLE_STATUSES)[number];

/**
 * Situação exibida na página. Além das do TMDB, há as que dependem da agenda de episódios
 * de uma série "em andamento": no ar agora, renovada para uma nova temporada ou ainda por estrear.
 */
export type TitleStatusKind = TitleStatus | 'airing' | 'renewed' | 'upcoming';

/** Tom do selo: indica se a situação é boa, neutra, provisória ou ruim para quem quer assistir. */
export type TitleStatusTone = 'positive' | 'info' | 'pending' | 'neutral' | 'negative';

/** Um episódio na agenda da série. */
export interface EpisodeAiring {
  seasonNumber: number;
  episodeNumber: number;
  /** Data de exibição ("2026-11-20"); `null` quando ainda não foi anunciada. */
  airDate: string | null;
}

type StatusSource = Pick<MediaDetails, 'status' | 'lastEpisode' | 'nextEpisode'>;

/** Rótulo único ou com concordância ("Renovado" para anime, "Renovada" para série). */
type StatusLabel = string | Readonly<Record<GrammaticalGender, string>>;

const STATUS_LABELS: Readonly<Record<TitleStatusKind, StatusLabel>> = {
  rumored: { masculine: 'Não confirmado', feminine: 'Não confirmada' },
  planned: { masculine: 'Planejado', feminine: 'Planejada' },
  'in-production': 'Em produção',
  'post-production': 'Em pós-produção',
  pilot: 'Piloto',
  released: { masculine: 'Lançado', feminine: 'Lançada' },
  returning: 'Em andamento',
  airing: 'Em exibição',
  renewed: { masculine: 'Renovado', feminine: 'Renovada' },
  upcoming: 'Estreia em breve',
  ended: { masculine: 'Finalizado', feminine: 'Finalizada' },
  canceled: { masculine: 'Cancelado', feminine: 'Cancelada' },
};

const STATUS_TONES: Readonly<Record<TitleStatusKind, TitleStatusTone>> = {
  rumored: 'pending',
  planned: 'pending',
  'in-production': 'pending',
  'post-production': 'pending',
  pilot: 'pending',
  released: 'neutral',
  returning: 'positive',
  airing: 'positive',
  renewed: 'info',
  upcoming: 'info',
  ended: 'neutral',
  canceled: 'negative',
};

/** O episódio vai ao ar hoje ou depois (sem data anunciada também conta como futuro). */
export function isUpcomingEpisode(episode: EpisodeAiring, today: string): boolean {
  return episode.airDate === null || episode.airDate >= today;
}

/**
 * Situação a exibir. Para séries "em andamento" o TMDB não diz se a série está no ar ou entre
 * temporadas: isso vem da agenda — o próximo episódio abre uma temporada nova ainda não exibida
 * (renovada), é o primeiro da série (estreia em breve) ou continua a temporada atual (em exibição).
 * `today` é a data de hoje no formato do TMDB ("2026-11-17").
 */
export function getTitleStatusKind(media: StatusSource, today: string): TitleStatusKind | null {
  const { status, lastEpisode, nextEpisode } = media;
  if (status !== 'returning' || !nextEpisode) return status;

  const upcoming = isUpcomingEpisode(nextEpisode, today);
  if (!lastEpisode) return upcoming ? 'upcoming' : 'airing';
  if (upcoming && nextEpisode.seasonNumber > lastEpisode.seasonNumber) return 'renewed';
  return 'airing';
}

export interface TitleStatusBadge {
  kind: TitleStatusKind;
  label: string;
  tone: TitleStatusTone;
}

/** Selo de situação do título, com o rótulo concordando com o formato ("Finalizada", "Finalizado"). */
export function getTitleStatusBadge(
  media: StatusSource & CategorizableMedia,
  today: string,
): TitleStatusBadge | null {
  const kind = getTitleStatusKind(media, today);
  if (!kind) return null;

  const label = STATUS_LABELS[kind];
  return {
    kind,
    label: typeof label === 'string' ? label : label[getMediaLabelGender(media)],
    tone: STATUS_TONES[kind],
  };
}
