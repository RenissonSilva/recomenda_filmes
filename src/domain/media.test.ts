import { describe, expect, it } from 'vitest';

import { buildDetails, buildMedia } from '@test/fixtures/media';

import {
  getMediaCategory,
  getMediaKey,
  getMediaLabel,
  getTitleAuthors,
  isAnime,
  matchesFilter,
  parseMediaKey,
  toMediaSummary,
} from './media';

const ANIMATION = 16;
const DRAMA = 18;
const SCI_FI_FANTASY_TV = 10765;

describe('getMediaKey / parseMediaKey', () => {
  it('gera e interpreta a chave "tipo:id"', () => {
    expect(getMediaKey({ mediaType: 'tv', id: 1396 })).toBe('tv:1396');
    expect(parseMediaKey('movie:157336')).toEqual({ mediaType: 'movie', id: 157336 });
  });

  it.each(['person:1', 'movie:', 'movie:abc', 'movie:-1', 'movie:1:2', 'tv:0', ''])(
    'rejeita a chave inválida "%s"',
    (key) => {
      expect(parseMediaKey(key)).toBeNull();
    },
  );
});

describe('animes', () => {
  const attackOnTitan = buildMedia({
    mediaType: 'tv',
    genreIds: [ANIMATION, SCI_FI_FANTASY_TV],
    originalLanguage: 'ja',
  });
  const spiritedAway = buildMedia({ genreIds: [ANIMATION, 14], originalLanguage: 'ja' });
  const toyStory = buildMedia({ genreIds: [ANIMATION, 35], originalLanguage: 'en' });
  const liveActionJapanese = buildMedia({ genreIds: [DRAMA], originalLanguage: 'ja' });

  it('anime é animação com idioma original japonês, seja filme ou série', () => {
    expect(isAnime(attackOnTitan)).toBe(true);
    expect(isAnime(spiritedAway)).toBe(true);
    expect(isAnime(toyStory)).toBe(false);
    expect(isAnime(liveActionJapanese)).toBe(false);
  });

  it('classifica cada título em uma única seção', () => {
    expect(getMediaCategory(attackOnTitan)).toBe('anime');
    expect(getMediaCategory(spiritedAway)).toBe('anime');
    expect(getMediaCategory(toyStory)).toBe('movie');
    expect(getMediaCategory(buildMedia({ mediaType: 'tv' }))).toBe('tv');
  });

  it('rotula séries de anime como "Anime" e filmes como "Filme anime"', () => {
    expect(getMediaLabel(attackOnTitan)).toBe('Anime');
    expect(getMediaLabel(spiritedAway)).toBe('Filme anime');
    expect(getMediaLabel(toyStory)).toBe('Filme');
    expect(getMediaLabel(buildMedia({ mediaType: 'tv' }))).toBe('Série');
  });

  it('animes aparecem em "Animes" e em "Tudo", mas não em "Filmes" nem em "Séries"', () => {
    expect(matchesFilter(attackOnTitan, 'anime')).toBe(true);
    expect(matchesFilter(attackOnTitan, 'all')).toBe(true);
    expect(matchesFilter(attackOnTitan, 'tv')).toBe(false);
    expect(matchesFilter(spiritedAway, 'movie')).toBe(false);
  });
});

describe('filtros de seção', () => {
  it('"all" aceita qualquer título e os demais só a própria seção', () => {
    const movie = buildMedia({ mediaType: 'movie' });
    const series = buildMedia({ mediaType: 'tv' });

    expect(matchesFilter(movie, 'all')).toBe(true);
    expect(matchesFilter(series, 'movie')).toBe(false);
    expect(matchesFilter(series, 'tv')).toBe(true);
    expect(matchesFilter(series, 'anime')).toBe(false);
  });
});

describe('getTitleAuthors', () => {
  const person = (id: number, role: string) => ({
    id,
    name: `Pessoa ${id}`,
    profilePath: null,
    role,
  });
  const director = person(1, 'Direção');
  const creator = person(2, 'Criação');
  const mangaka = person(3, 'Obra original');

  it('filmes e séries: direção ou criação, mesmo quando há obra original', () => {
    expect(
      getTitleAuthors(buildDetails({ creators: [director], originalAuthors: [mangaka] })),
    ).toEqual([director]);
  });

  it('animes: o autor da obra original vem primeiro', () => {
    const anime = buildDetails({
      mediaType: 'tv',
      genreIds: [ANIMATION],
      originalLanguage: 'ja',
      creators: [creator],
      originalAuthors: [mangaka],
    });
    expect(getTitleAuthors(anime)).toEqual([mangaka]);
    expect(getTitleAuthors({ ...anime, originalAuthors: [] })).toEqual([creator]);
  });

  it('série sem criador usa o autor da obra original', () => {
    expect(
      getTitleAuthors(buildDetails({ mediaType: 'tv', creators: [], originalAuthors: [mangaka] })),
    ).toEqual([mangaka]);
  });
});

describe('toMediaSummary', () => {
  it('remove os campos exclusivos dos detalhes', () => {
    const summary = toMediaSummary(buildDetails({ overview: 'Sinopse longa', keywords: [] }));

    expect(summary).not.toHaveProperty('overview');
    expect(summary).not.toHaveProperty('keywords');
    expect(Object.keys(summary)).toHaveLength(12);
  });
});
