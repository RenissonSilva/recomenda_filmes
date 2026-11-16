import { describe, expect, it, vi } from 'vitest';

import type { CanonicalGenre } from '@/domain/genres';
import { getMediaKey, type MediaCategory, type MediaDetails, type MediaType } from '@/domain/media';
import type { RatedTitleInput, RecommendationRequest } from '@/domain/recommendation';
import { buildDetails, buildMedia } from '@test/fixtures/media';

import { TmdbNotConfiguredError, TmdbRequestError } from '../errors';
import { generateRecommendations } from './engine';
import type { RecommenderCatalog } from './types';

// Gêneros do TMDB
const SCI_FI = 878;
const DRAMA = 18;
const ADVENTURE = 12;
const ROMANCE = 10749;
const COMEDY = 35;
const ANIMATION = 16;

const keyword = (id: number) => ({ id, name: `keyword-${id}` });
const person = (id: number) => ({ id, name: `Pessoa ${id}`, profilePath: null, role: null });
const SPACE = keyword(1);
const ASTRONAUT = keyword(2);
const ALIEN = keyword(3);
const LOVE = keyword(10);
const WEDDING = keyword(11);

// Candidatos
const gravity = buildDetails({
  id: 10,
  title: 'Gravidade',
  genreIds: [SCI_FI, DRAMA],
  keywords: [SPACE, ASTRONAUT],
});
const contact = buildDetails({
  id: 11,
  title: 'Contato',
  genreIds: [SCI_FI, DRAMA],
  keywords: [ALIEN, SPACE],
});
const bladeRunner = buildDetails({
  id: 12,
  title: 'Blade Runner 2049',
  genreIds: [SCI_FI, DRAMA],
  creators: [person(101)],
});
const loveActually = buildDetails({
  id: 13,
  title: 'Simplesmente Amor',
  genreIds: [ROMANCE, COMEDY],
  keywords: [LOVE, WEDDING],
});
const laLaLand = buildDetails({
  id: 14,
  title: 'La La Land',
  genreIds: [ROMANCE, DRAMA, COMEDY],
  keywords: [LOVE],
  cast: [person(300)],
});
const darkSeries = buildDetails({
  id: 15,
  mediaType: 'tv',
  title: 'Dark',
  genreIds: [10765, DRAMA],
  keywords: [keyword(4)],
});
const planetes = buildDetails({
  id: 17,
  mediaType: 'tv',
  title: 'Planetes',
  genreIds: [ANIMATION, 10765, DRAMA],
  originalLanguage: 'ja',
  keywords: [SPACE, ASTRONAUT],
});

// Títulos avaliados pelo usuário (sementes)
const interstellar = buildDetails({
  id: 1,
  title: 'Interestelar',
  genreIds: [SCI_FI, DRAMA, ADVENTURE],
  keywords: [SPACE, ASTRONAUT],
  creators: [person(100)],
  recommendations: [gravity],
});
const theMartian = buildDetails({
  id: 2,
  title: 'Perdido em Marte',
  genreIds: [SCI_FI, DRAMA, ADVENTURE],
  keywords: [SPACE, ASTRONAUT],
  // Interestelar já foi avaliado: não pode ser recomendado.
  recommendations: [gravity, contact, interstellarSummary()],
});
const arrival = buildDetails({
  id: 3,
  title: 'A Chegada',
  genreIds: [SCI_FI, DRAMA],
  keywords: [ALIEN],
  creators: [person(101)],
  recommendations: [bladeRunner],
});
const theNotebook = buildDetails({
  id: 4,
  title: 'Diário de uma Paixão',
  genreIds: [ROMANCE, DRAMA],
  keywords: [LOVE],
  cast: [person(300)],
  recommendations: [loveActually, laLaLand],
});
const weddingComedy = buildDetails({
  id: 5,
  title: 'Comédia de Casamento',
  genreIds: [ROMANCE, COMEDY],
  keywords: [WEDDING],
  recommendations: [loveActually],
});

function interstellarSummary() {
  return buildMedia({ id: 1, title: 'Interestelar', genreIds: [SCI_FI, DRAMA, ADVENTURE] });
}

const ALL_TITLES = [
  interstellar,
  theMartian,
  arrival,
  theNotebook,
  weddingComedy,
  gravity,
  contact,
  bladeRunner,
  loveActually,
  laLaLand,
  darkSeries,
];

interface FakeDiscovery {
  byGenre?: Partial<Record<MediaCategory, MediaDetails[]>>;
  worksByCreator?: Record<number, MediaDetails[]>;
}

function createCatalog(
  titles: MediaDetails[] = ALL_TITLES,
  discovery: FakeDiscovery = {},
): RecommenderCatalog {
  const byKey = new Map(titles.map((title) => [getMediaKey(title), title]));
  return {
    getTitleDetails: vi.fn(
      async (mediaType: MediaType, id: number) => byKey.get(`${mediaType}:${id}`) ?? null,
    ),
    discoverTopRatedByGenres: vi.fn(
      async (category: MediaCategory, _genres: readonly CanonicalGenre[]) =>
        discovery.byGenre?.[category] ?? [],
    ),
    getCreatorWorks: vi.fn(async (personId: number) => discovery.worksByCreator?.[personId] ?? []),
  };
}

const rated = (media: MediaDetails, value: RatedTitleInput['value']): RatedTitleInput => ({
  mediaType: media.mediaType,
  id: media.id,
  value,
});

const SCI_FI_LOVER: RatedTitleInput[] = [
  rated(interstellar, 'love'),
  rated(theMartian, 'love'),
  rated(arrival, 'like'),
  rated(theNotebook, 'hate'),
  rated(weddingComedy, 'dislike'),
];

const request = (overrides: Partial<RecommendationRequest> = {}): RecommendationRequest => ({
  ratings: SCI_FI_LOVER,
  excludeKeys: [],
  filter: 'all',
  ...overrides,
});

const titlesOf = (items: Awaited<ReturnType<typeof generateRecommendations>>) =>
  items.map((item) => item.media.title);

describe('generateRecommendations', () => {
  it('recomenda títulos parecidos com os que o usuário amou, do mais compatível ao menos', async () => {
    const items = await generateRecommendations(request(), createCatalog());

    expect(titlesOf(items)).toEqual(['Gravidade', 'Contato', 'Blade Runner 2049']);
    expect(items[0]?.matchPercent).toBeGreaterThanOrEqual(75);
    expect(items[0]?.matchPercent).toBeGreaterThan(items[2]?.matchPercent ?? 100);
  });

  it('não recomenda títulos parecidos com os que o usuário odiou', async () => {
    const items = await generateRecommendations(request(), createCatalog());

    expect(titlesOf(items)).not.toContain('Simplesmente Amor');
    expect(titlesOf(items)).not.toContain('La La Land');
  });

  it('explica a recomendação citando os títulos avaliados positivamente', async () => {
    const [top] = await generateRecommendations(request(), createCatalog());

    const reasons = top?.becauseOf.map((reason) => reason.title) ?? [];
    expect(reasons.length).toBeGreaterThan(0);
    expect(reasons.every((title) => ['Interestelar', 'Perdido em Marte'].includes(title))).toBe(
      true,
    );
  });

  it('nunca recomenda títulos já avaliados nem os excluídos pelo usuário', async () => {
    const items = await generateRecommendations(
      request({ excludeKeys: [getMediaKey(gravity)] }),
      createCatalog(),
    );

    expect(titlesOf(items)).not.toContain('Interestelar');
    expect(titlesOf(items)).not.toContain('Gravidade');
  });

  it('respeita o filtro de seção e busca títulos extras pelos gêneros favoritos', async () => {
    const catalog = createCatalog(ALL_TITLES, { byGenre: { tv: [darkSeries] } });
    const items = await generateRecommendations(request({ filter: 'tv' }), catalog);

    expect(titlesOf(items)).toEqual(['Dark']);
    // Os 2 gêneros de maior afinidade (o drama perde pontos com o "Odeio" em Diário de uma Paixão),
    // em ordem alfabética para aproveitar o cache.
    const favoriteGenres: CanonicalGenre[] = ['adventure', 'science-fiction'];
    for (const category of ['movie', 'tv', 'anime'] as const) {
      expect(catalog.discoverTopRatedByGenres).toHaveBeenCalledWith(category, favoriteGenres);
    }
  });

  it('recomenda animes só na seção "Animes" (e em "Tudo")', async () => {
    const catalog = createCatalog([...ALL_TITLES, planetes], {
      byGenre: { tv: [darkSeries], anime: [planetes] },
    });

    const all = await generateRecommendations(request({ filter: 'all' }), catalog);
    const series = await generateRecommendations(request({ filter: 'tv' }), catalog);
    const animes = await generateRecommendations(request({ filter: 'anime' }), catalog);

    expect(titlesOf(animes)).toEqual(['Planetes']);
    expect(titlesOf(series)).toEqual(['Dark']);
    expect(titlesOf(all)).toContain('Planetes');
  });

  it('dá a mesma compatibilidade a um título em qualquer filtro', async () => {
    const catalog = createCatalog(ALL_TITLES, { byGenre: { tv: [darkSeries] } });

    const all = await generateRecommendations(request({ filter: 'all' }), catalog);
    const movies = await generateRecommendations(request({ filter: 'movie' }), catalog);
    const series = await generateRecommendations(request({ filter: 'tv' }), catalog);

    const percentOf = (items: typeof all, title: string) =>
      items.find((item) => item.media.title === title)?.matchPercent;
    expect(percentOf(movies, 'Gravidade')).toBe(percentOf(all, 'Gravidade'));
    expect(percentOf(series, 'Dark')).toBe(percentOf(all, 'Dark'));
  });

  it('recomenda outras obras dos diretores dos títulos de que o usuário gostou', async () => {
    const dune = buildDetails({
      id: 16,
      title: 'Duna',
      genreIds: [SCI_FI, ADVENTURE],
      creators: [person(101)],
    });
    const catalog = createCatalog([...ALL_TITLES, dune], { worksByCreator: { 101: [dune] } });

    const withWorks = await generateRecommendations(request(), catalog);
    const withoutWorks = await generateRecommendations(
      request(),
      createCatalog([...ALL_TITLES, dune]),
    );

    // Interestelar (Ótimo) → pessoa 100; A Chegada (Bom) → pessoa 101, diretor de Duna.
    expect(catalog.getCreatorWorks).toHaveBeenCalledWith(100);
    expect(catalog.getCreatorWorks).toHaveBeenCalledWith(101);
    expect(titlesOf(withWorks)).toContain('Duna');
    expect(titlesOf(withoutWorks)).not.toContain('Duna');
  });

  it('não recomenda nada sem ao menos uma avaliação positiva', async () => {
    const items = await generateRecommendations(
      request({ ratings: [rated(theNotebook, 'hate'), rated(weddingComedy, 'dislike')] }),
      createCatalog(),
    );
    expect(items).toEqual([]);
  });

  it('respeita o limite de resultados', async () => {
    const items = await generateRecommendations(request({ limit: 1 }), createCatalog());
    expect(items).toHaveLength(1);
  });

  it('tolera falhas pontuais do TMDB, mas não falhas de configuração', async () => {
    const flaky = createCatalog();
    const original = flaky.getTitleDetails;
    flaky.getTitleDetails = vi.fn(async (mediaType: MediaType, id: number) => {
      if (id === arrival.id) throw new TmdbRequestError(500, '/movie/3');
      return original(mediaType, id);
    });
    await expect(generateRecommendations(request(), flaky)).resolves.not.toHaveLength(0);

    const unconfigured = createCatalog();
    unconfigured.getTitleDetails = vi.fn(async () => {
      throw new TmdbNotConfiguredError();
    });
    await expect(generateRecommendations(request(), unconfigured)).rejects.toBeInstanceOf(
      TmdbNotConfiguredError,
    );
  });

  it('propaga o erro quando nenhuma avaliação pôde ser carregada', async () => {
    const offline = createCatalog();
    offline.getTitleDetails = vi.fn(async () => {
      throw new TmdbRequestError(503, '/movie/1');
    });

    await expect(generateRecommendations(request(), offline)).rejects.toBeInstanceOf(
      TmdbRequestError,
    );
  });
});
