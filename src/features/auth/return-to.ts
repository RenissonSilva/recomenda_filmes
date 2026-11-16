import { routes } from '@/lib/routes';

/** Parâmetro com a página para onde voltar depois de entrar, ex.: `/entrar?voltar=/avaliar`. */
export const RETURN_TO_PARAM = 'voltar';

const AUTH_PAGES: readonly string[] = [
  routes.signIn,
  routes.signUp,
  routes.forgotPassword,
  routes.resetPassword,
];

const INTERNAL_ORIGIN = 'http://app.invalid';

/**
 * Página segura para voltar depois do login: só caminhos internos (evita redirecionar para
 * outro site, inclusive com truques como `//site.com` ou `/\t/site.com`) e fora das telas de login.
 */
export function sanitizeReturnTo(value: string | null | undefined): string {
  if (!value?.startsWith('/')) return routes.home;

  let url: URL;
  try {
    url = new URL(value, INTERNAL_ORIGIN);
  } catch {
    return routes.home;
  }

  if (url.origin !== INTERNAL_ORIGIN || AUTH_PAGES.includes(url.pathname)) return routes.home;
  return `${url.pathname}${url.search}${url.hash}`;
}

/** Monta o link de uma tela de autenticação preservando a página de retorno. */
export function withReturnTo(path: string, returnTo: string | null | undefined): string {
  const target = sanitizeReturnTo(returnTo);
  if (target === routes.home) return path;
  return `${path}?${new URLSearchParams({ [RETURN_TO_PARAM]: target }).toString()}`;
}
