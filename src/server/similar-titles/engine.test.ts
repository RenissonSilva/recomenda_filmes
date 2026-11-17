import { describe, expect, it, vi } from 'vitest';

import type { Keyword, MediaCategory, MediaSummary, MediaType } from '@/domain/media';
import { getMediaKey } from '@/domain/media';
import { buildDetails, buildMedia } from '@test/fixtures/media';

import { TmdbRequestError } from '../errors';
import { findSimilarTitles, type SimilarTitlesCatalog } from './engine';

const ADVENTURE = 12;
const SCI_FI = 878;
const SCI_FI_TV = 10765;
const CRIME = 80;
const DRAMA = 18;

const keyword = (id: number): Keyword => ({ id, name: `palavra-chave ${id}` });

const WORMHOLE = keyword(1);
const SPACE = keyword(2);
const FAMILY = keyword(3);
const UNIQUE = keyword(4);
const MAFIA = keyword(5);

const title = buildDetails({
  id: 1,
  title: 'Interestelar',
  genreIds: [ADVENTURE, SCI_FI],
  releaseYear: 2014,
  keywords: [WORMHOLE, SPACE, FAMILY, UNIQUE],
});

const passengers = buildMedia({ id: 10, genreIds: [SCI_FI, DRAMA], releaseYear: 2016 });
const scifiSeries = buildMedia({
  id: 11,
  mediaType: 'tv',
  genreIds: [SCI_FI_TV],
  releaseYear: 2010,
});
const godfather = buildMedia({ id: 12, genreIds: [CRIME, DRAMA], releaseYear: 1972 });
const obscure = buildMedia({ id: 13, genreIds: [ADVENTURE, SCI_FI], voteCount: 10 });

interface FakeCatalogData {
  frequencies?: Record<number, number>;
  keywordsByTitle?: Record<string, Keyword[]>;
  byKeywords?: Partial<Record<MediaCategory, MediaSummary[]>>;
  byGenres?: Partial<Record<MediaCategory, MediaSummary[]>>;
}

function fakeCatalog(data: FakeCatalogData): SimilarTitlesCatalog {
  return {
    getKeywordFrequency: vi.fn(async (id: number) => data.frequencies?.[id] ?? 1000),
    getTitleKeywords: vi.fn(
      async (mediaType: MediaType, id: number) =>
        data.keywordsByTitle?.[getMediaKey({ mediaType, id })] ?? [],
    ),
    discoverByKeywords: vi.fn(async (category: MediaCategory) => data.byKeywords?.[category] ?? []),
    discoverTopRatedByGenres: vi.fn(
      async (category: MediaCategory) => data.byGenres?.[category] ?? [],
    ),
  };
}

const defaultData: FakeCatalogData = {
  frequencies: { [WORMHOLE.id]: 30, [SPACE.id]: 900, [FAMILY.id]: 50_000, [UNIQUE.id]: 1 },
  keywordsByTitle: {
    [getMediaKey(passengers)]: [WORMHOLE, SPACE],
    [getMediaKey(scifiSeries)]: [WORMHOLE],
    [getMediaKey(godfather)]: [FAMILY, MAFIA],
    [getMediaKey(obscure)]: [WORMHOLE, SPACE],
  },
  byKeywords: { movie: [passengers, obscure, godfather], tv: [scifiSeries] },
  byGenres: { movie: [title, godfather] },
};

describe('findSimilarTitles', () => {
  it('ordena pelo enredo e pelo gênero, misturando filmes e séries', async () => {
    const similar = await findSimilarTitles(title, fakeCatalog(defaultData));

    expect(similar.map(getMediaKey)).toEqual([getMediaKey(passengers), getMediaKey(scifiSeries)]);
  });

  it('busca candidatos pelas palavras-chave mais específicas, ignorando as exclusivas do título', async () => {
    const catalog = fakeCatalog(defaultData);
    await findSimilarTitles(title, catalog);

    // A palavra-chave 4 só existe no próprio título: não ajuda a encontrar outros.
    expect(catalog.discoverByKeywords).toHaveBeenCalledWith('movie', [
      WORMHOLE.id,
      SPACE.id,
      FAMILY.id,
    ]);
    expect(catalog.discoverTopRatedByGenres).toHaveBeenCalledWith('anime', [
      'adventure',
      'science-fiction',
    ]);
  });

  it('deixa de fora o próprio título, os pouco votados e os pouco parecidos', async () => {
    const keys = (await findSimilarTitles(title, fakeCatalog(defaultData))).map(getMediaKey);

    expect(keys).not.toContain(getMediaKey(title));
    expect(keys).not.toContain(getMediaKey(obscure));
    expect(keys).not.toContain(getMediaKey(godfather));
  });

  it('tolera falhas do TMDB nas consultas auxiliares', async () => {
    const catalog = fakeCatalog(defaultData);
    vi.mocked(catalog.getKeywordFrequency).mockRejectedValue(new TmdbRequestError(503, '/x'));
    vi.mocked(catalog.discoverTopRatedByGenres).mockRejectedValue(new TmdbRequestError(503, '/x'));

    // Sem as frequências não há busca por palavra-chave: sobram as recomendações do TMDB.
    const similar = await findSimilarTitles({ ...title, recommendations: [passengers] }, catalog);

    expect(catalog.discoverByKeywords).not.toHaveBeenCalled();
    expect(similar.map(getMediaKey)).toEqual([getMediaKey(passengers)]);
  });
});
