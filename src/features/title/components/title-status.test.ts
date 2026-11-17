import { describe, expect, it } from 'vitest';

import type { MediaDetails } from '@/domain/media';
import type { EpisodeAiring } from '@/domain/title-status';
import { buildDetails } from '@test/fixtures/media';

import { buildTitleStatusDetails } from './title-status';

const TODAY = '2026-11-17';
const ANIMATION = 16;

const episode = (seasonNumber: number, airDate: string | null): EpisodeAiring => ({
  seasonNumber,
  episodeNumber: 3,
  airDate,
});

const series = (overrides: Partial<MediaDetails> = {}) =>
  buildDetails({ mediaType: 'tv', status: 'returning', releaseYear: 2022, ...overrides });

describe('buildTitleStatusDetails', () => {
  describe('filmes', () => {
    it('mostra a data de lançamento de um filme lançado', () => {
      const movie = buildDetails({ status: 'released', releaseDate: '2014-11-06' });
      expect(buildTitleStatusDetails(movie, TODAY)).toEqual(['Lançado em 6 de novembro de 2014']);
    });

    it('mostra a estreia prevista de um filme que ainda não saiu', () => {
      const movie = buildDetails({ status: 'post-production', releaseDate: '2027-03-12' });
      expect(buildTitleStatusDetails(movie, TODAY)).toEqual([
        'Estreia prevista para 12 de março de 2027',
      ]);
    });

    it('sem data, não há detalhe', () => {
      expect(buildTitleStatusDetails(buildDetails({ status: 'planned' }), TODAY)).toEqual([]);
    });
  });

  describe('séries', () => {
    it('em exibição: próximo episódio e total de episódios', () => {
      const media = series({
        episodeCount: 26,
        lastEpisode: episode(2, '2026-11-10'),
        nextEpisode: episode(2, '2026-11-24'),
      });
      expect(buildTitleStatusDetails(media, TODAY)).toEqual([
        'Próximo episódio em 24 de novembro de 2026',
        '26 episódios',
      ]);
    });

    it('episódio de hoje aparece como "hoje"', () => {
      const media = series({
        lastEpisode: episode(2, '2026-11-10'),
        nextEpisode: episode(2, TODAY),
      });
      expect(buildTitleStatusDetails(media, TODAY)).toEqual(['Próximo episódio hoje']);
    });

    it('renovada: estreia da nova temporada, com ou sem data', () => {
      const lastEpisode = episode(3, '2026-08-09');
      expect(
        buildTitleStatusDetails(
          series({ lastEpisode, nextEpisode: episode(4, '2027-06-21') }),
          TODAY,
        ),
      ).toEqual(['Temporada 4 estreia em 21 de junho de 2027']);
      expect(
        buildTitleStatusDetails(series({ lastEpisode, nextEpisode: episode(4, null) }), TODAY),
      ).toEqual(['Temporada 4 confirmada']);
    });

    it('série que ainda não estreou mostra a data de estreia', () => {
      const media = series({ nextEpisode: episode(1, '2027-01-05') });
      expect(buildTitleStatusDetails(media, TODAY)).toEqual(['Estreia em 5 de janeiro de 2027']);
    });

    it('entre temporadas: data do último episódio', () => {
      const media = series({ lastEpisode: episode(3, '2026-08-09'), episodeCount: 1 });
      expect(buildTitleStatusDetails(media, TODAY)).toEqual([
        'Último episódio em 9 de agosto de 2026',
        '1 episódio',
      ]);
    });

    it('finalizada: período de exibição, concordando com o formato', () => {
      const aired = { releaseYear: 2008, lastEpisode: episode(5, '2013-09-29') };
      expect(buildTitleStatusDetails(series({ ...aired, status: 'ended' }), TODAY)).toEqual([
        'Exibida de 2008 a 2013',
      ]);

      const anime = series({
        ...aired,
        status: 'canceled',
        genreIds: [ANIMATION],
        originalLanguage: 'ja',
      });
      expect(buildTitleStatusDetails(anime, TODAY)).toEqual(['Exibido de 2008 a 2013']);

      const oneSeason = series({
        status: 'ended',
        releaseYear: 2013,
        lastEpisode: episode(1, '2013-12-01'),
      });
      expect(buildTitleStatusDetails(oneSeason, TODAY)).toEqual(['Exibida em 2013']);
    });
  });
});
