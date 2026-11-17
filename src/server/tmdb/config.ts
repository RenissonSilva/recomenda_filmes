import 'server-only';

export const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';

/** Idioma dos títulos/sinopses e país usado para "onde assistir". */
export const TMDB_LANGUAGE = 'pt-BR';
export const TMDB_REGION = 'BR';

/**
 * Sem tradução para o português, o TMDB devolve o nome da pessoa no alfabeto original
 * (ex.: "諫山創"). Nesse caso o nome é buscado de novo neste idioma ("Hajime Isayama").
 */
export const TMDB_LATIN_NAME_LANGUAGE = 'en-US';

/** Idiomas aceitos ao buscar trailers (português primeiro, depois inglês e vídeos sem idioma). */
export const TMDB_VIDEO_LANGUAGES = 'pt,en,null';

/** O TMDB não retorna páginas acima de 500 nos endpoints de listagem. */
export const TMDB_MAX_PAGE = 500;

export const TMDB_REQUEST_TIMEOUT_MS = 10_000;
export const TMDB_MAX_ATTEMPTS = 2;

/** Limites para manter os dados enxutos (o TMDB devolve elencos e equipes enormes). */
export const MAX_CAST_MEMBERS = 12;
export const MAX_KEYWORDS = 30;

/**
 * Funções da equipe de roteiro que identificam o autor da obra adaptada.
 * Nos animes, o autor do mangá aparece como "Comic Book".
 */
export const ORIGINAL_WORK_JOBS: ReadonlySet<string> = new Set([
  'Comic Book',
  'Graphic Novel',
  'Novel',
  'Book',
  'Short Story',
  'Author',
  'Original Story',
  'Original Concept',
  'Original Series Creator',
  'Theatre Play',
]);
