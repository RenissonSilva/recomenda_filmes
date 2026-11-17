import { CANONICAL_GENRE_LABELS, CANONICAL_GENRES, type CanonicalGenre } from '@/domain/genres';
import {
  MEDIA_FILTER_LABELS,
  MEDIA_FILTERS,
  type MediaFilter,
  type MediaSummary,
  type MediaType,
  type Person,
} from '@/domain/media';
import { DISCOVER_SORTS, TITLE_SORT_LABELS, type DiscoverSort } from '@/domain/title-sort';

import { slugify } from './slug';

/** Segmento de URL em português para cada tipo de título: /filme/123 e /serie/456. */
const MEDIA_ROUTE_SEGMENTS: Record<MediaType, string> = {
  movie: 'filme',
  tv: 'serie',
};

/**
 * Valores internos ⇄ parâmetros de URL em português, derivados dos rótulos exibidos
 * (ex.: "science-fiction" ⇄ "ficcao-cientifica").
 */
function createSlugCodec<T extends string>(values: readonly T[], labels: Record<T, string>) {
  const slugs = new Map(values.map((value) => [value, slugify(labels[value])]));
  const bySlug = new Map(values.map((value) => [slugify(labels[value]), value]));
  return {
    encode: (value: T): string => slugs.get(value) ?? value,
    decode: (slug: unknown): T | null => (typeof slug === 'string' && bySlug.get(slug)) || null,
  };
}

const genreSlugs = createSlugCodec(CANONICAL_GENRES, CANONICAL_GENRE_LABELS);
const filterSlugs = createSlugCodec(MEDIA_FILTERS, MEDIA_FILTER_LABELS);
const sortSlugs = createSlugCodec(DISCOVER_SORTS, TITLE_SORT_LABELS);

/** Parâmetros de busca de uma página (`searchParams`), como o Next.js os entrega. */
export type SearchParams = Readonly<Record<string, string | string[] | undefined>>;

/** O que a página "Explorar" mostra: um gênero, em uma seção, em uma ordem. */
export interface ExploreParams {
  genre: CanonicalGenre;
  filter: MediaFilter;
  sort: DiscoverSort;
}

const EXPLORE_DEFAULTS = { filter: 'all', sort: 'popularity' } as const satisfies Omit<
  ExploreParams,
  'genre'
>;

/** Nomes dos parâmetros da página "Explorar": `/explorar?genero=acao&secao=animes&ordem=nota`. */
const EXPLORE_QUERY = { genre: 'genero', filter: 'secao', sort: 'ordem' } as const;

/** Rotas do app — use sempre estas funções em vez de montar URLs à mão. */
export const routes = {
  home: '/',
  rate: '/avaliar',
  recommendations: '/recomendacoes',
  ratings: '/minhas-avaliacoes',
  watchlist: '/quero-ver',
  signIn: '/entrar',
  signUp: '/criar-conta',
  forgotPassword: '/esqueci-a-senha',
  resetPassword: '/redefinir-senha',
  title: (media: Pick<MediaSummary, 'mediaType' | 'id'>) =>
    `/${MEDIA_ROUTE_SEGMENTS[media.mediaType]}/${media.id}`,
  person: (person: Pick<Person, 'id'>) => `/pessoa/${person.id}`,
  explore: '/explorar',
  /** Títulos de um gênero; seção e ordem padrão ficam fora da URL. */
  exploreGenre: ({ genre, ...options }: Pick<ExploreParams, 'genre'> & Partial<ExploreParams>) => {
    const { filter, sort } = { ...EXPLORE_DEFAULTS, ...options };
    const query = new URLSearchParams({ [EXPLORE_QUERY.genre]: genreSlugs.encode(genre) });
    if (filter !== EXPLORE_DEFAULTS.filter)
      query.set(EXPLORE_QUERY.filter, filterSlugs.encode(filter));
    if (sort !== EXPLORE_DEFAULTS.sort) query.set(EXPLORE_QUERY.sort, sortSlugs.encode(sort));
    return `/explorar?${query}`;
  },
} as const;

/**
 * Lê os parâmetros da página "Explorar". Valores ausentes ou inválidos voltam ao padrão;
 * sem um gênero válido, `genre` é `null`.
 */
export function parseExploreParams(
  searchParams: SearchParams,
): Omit<ExploreParams, 'genre'> & { genre: CanonicalGenre | null } {
  return {
    genre: genreSlugs.decode(searchParams[EXPLORE_QUERY.genre]),
    filter: filterSlugs.decode(searchParams[EXPLORE_QUERY.filter]) ?? EXPLORE_DEFAULTS.filter,
    sort: sortSlugs.decode(searchParams[EXPLORE_QUERY.sort]) ?? EXPLORE_DEFAULTS.sort,
  };
}

/** Converte o segmento `[id]` de uma rota (`/filme/123`, `/pessoa/456`) em número, ou `null`. */
export function parseRouteId(rawId: string): number | null {
  if (!/^\d+$/.test(rawId)) return null;
  const id = Number(rawId);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** Endpoints da API interna (Route Handlers em `src/app/api`). */
export const apiRoutes = {
  discover: '/api/titles/discover',
  search: '/api/titles/search',
  recommendations: '/api/recommendations',
  library: '/api/library',
  libraryMerge: '/api/library/merge',
} as const;
