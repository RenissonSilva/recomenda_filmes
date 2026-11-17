import { describe, expect, it } from 'vitest';

import { buildDetails } from '@test/fixtures/media';

import { getTitleStatusBadge, getTitleStatusKind, type EpisodeAiring } from './title-status';

const TODAY = '2026-11-17';
const ANIMATION = 16;

const episode = (seasonNumber: number, airDate: string | null): EpisodeAiring => ({
  seasonNumber,
  episodeNumber: 1,
  airDate,
});

const series = (overrides: Parameters<typeof buildDetails>[0] = {}) =>
  buildDetails({ mediaType: 'tv', status: 'returning', ...overrides });

describe('getTitleStatusKind', () => {
  it('mantém a situação do TMDB quando ela não depende da agenda', () => {
    expect(getTitleStatusKind(buildDetails({ status: 'released' }), TODAY)).toBe('released');
    expect(getTitleStatusKind(series({ status: 'ended' }), TODAY)).toBe('ended');
    expect(getTitleStatusKind(series({ status: null }), TODAY)).toBeNull();
  });

  it('série em andamento sem próximo episódio anunciado fica "em andamento"', () => {
    expect(getTitleStatusKind(series({ lastEpisode: episode(2, '2026-01-10') }), TODAY)).toBe(
      'returning',
    );
  });

  it('próximo episódio na temporada atual: em exibição', () => {
    const media = series({
      lastEpisode: episode(2, '2026-11-10'),
      nextEpisode: episode(2, '2026-11-24'),
    });
    expect(getTitleStatusKind(media, TODAY)).toBe('airing');
  });

  it('próximo episódio abre uma temporada nova: renovada (com ou sem data)', () => {
    const lastEpisode = episode(3, '2026-08-09');
    expect(
      getTitleStatusKind(series({ lastEpisode, nextEpisode: episode(4, '2027-06-21') }), TODAY),
    ).toBe('renewed');
    expect(getTitleStatusKind(series({ lastEpisode, nextEpisode: episode(4, null) }), TODAY)).toBe(
      'renewed',
    );
  });

  it('a temporada nova que já estreou conta como em exibição (dados do cache atrasados)', () => {
    const media = series({
      lastEpisode: episode(3, '2026-08-09'),
      nextEpisode: episode(4, '2026-11-15'),
    });
    expect(getTitleStatusKind(media, TODAY)).toBe('airing');
  });

  it('série que ainda não estreou: estreia em breve', () => {
    expect(getTitleStatusKind(series({ nextEpisode: episode(1, '2027-01-05') }), TODAY)).toBe(
      'upcoming',
    );
  });
});

describe('getTitleStatusBadge', () => {
  it('concorda o rótulo com o formato: "a série", "o anime", "o filme"', () => {
    expect(getTitleStatusBadge(series({ status: 'ended' }), TODAY)?.label).toBe('Finalizada');

    const anime = series({ status: 'ended', genreIds: [ANIMATION], originalLanguage: 'ja' });
    expect(getTitleStatusBadge(anime, TODAY)?.label).toBe('Finalizado');

    expect(getTitleStatusBadge(buildDetails({ status: 'canceled' }), TODAY)?.label).toBe(
      'Cancelado',
    );
  });

  it('associa um tom a cada situação', () => {
    expect(getTitleStatusBadge(series({ status: 'canceled' }), TODAY)).toEqual({
      kind: 'canceled',
      label: 'Cancelada',
      tone: 'negative',
    });
    expect(getTitleStatusBadge(series({ status: 'returning' }), TODAY)?.tone).toBe('positive');
    expect(getTitleStatusBadge(buildDetails({ status: 'in-production' }), TODAY)?.tone).toBe(
      'pending',
    );
  });

  it('sem situação conhecida, não há selo', () => {
    expect(getTitleStatusBadge(series({ status: null }), TODAY)).toBeNull();
  });
});
