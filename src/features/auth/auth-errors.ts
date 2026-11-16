import { authConfig } from '@/config/auth';

/** Mensagens em português para os erros devolvidos pelo Better Auth. */

const { minLength, maxLength } = authConfig.password;

const ACCOUNT_EXISTS = 'Já existe uma conta com este e-mail. Tente entrar.';
const INVALID_LINK = 'Este link é inválido ou expirou. Peça um novo.';

const AUTH_ERROR_MESSAGES: Partial<Record<string, string>> = {
  INVALID_EMAIL_OR_PASSWORD: 'E-mail ou senha incorretos.',
  INVALID_EMAIL: 'Informe um e-mail válido.',
  USER_ALREADY_EXISTS: ACCOUNT_EXISTS,
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: ACCOUNT_EXISTS,
  PASSWORD_TOO_SHORT: `A senha precisa ter pelo menos ${minLength} caracteres.`,
  PASSWORD_TOO_LONG: `A senha pode ter no máximo ${maxLength} caracteres.`,
  INVALID_TOKEN: INVALID_LINK,
  TOKEN_EXPIRED: INVALID_LINK,
  FAILED_TO_CREATE_USER: 'Não foi possível criar a conta. Tente novamente.',
};

const RATE_LIMITED = 'Muitas tentativas seguidas. Aguarde um minuto e tente novamente.';
const FALLBACK = 'Algo deu errado. Tente novamente em instantes.';

export function getAuthErrorMessage(error: { code?: string; status?: number } | null): string {
  if (error?.status === 429) return RATE_LIMITED;
  return (error?.code && AUTH_ERROR_MESSAGES[error.code]) || FALLBACK;
}

/** Erros do login com Google, que chegam pela URL (ex.: `/entrar?error=access_denied`). */
const OAUTH_ERROR_MESSAGES: Partial<Record<string, string>> = {
  account_not_linked:
    'Já existe uma conta com este e-mail, criada com senha. Entre com e-mail e senha — se não lembrar dela, use “Esqueci minha senha”.',
  access_denied: 'O login com Google foi cancelado.',
};

export function getOAuthErrorMessage(code: string | null): string | null {
  if (!code) return null;
  return OAUTH_ERROR_MESSAGES[code] ?? 'Não foi possível entrar com o Google. Tente novamente.';
}
