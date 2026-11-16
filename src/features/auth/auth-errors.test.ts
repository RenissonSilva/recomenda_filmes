import { describe, expect, it } from 'vitest';

import { getAuthErrorMessage, getOAuthErrorMessage } from './auth-errors';

describe('mensagens de erro da autenticação', () => {
  it('traduz os códigos do Better Auth', () => {
    expect(getAuthErrorMessage({ code: 'INVALID_EMAIL_OR_PASSWORD', status: 401 })).toBe(
      'E-mail ou senha incorretos.',
    );
    expect(getAuthErrorMessage({ code: 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL' })).toMatch(
      /Já existe uma conta/,
    );
  });

  it('trata excesso de tentativas e códigos desconhecidos', () => {
    expect(getAuthErrorMessage({ status: 429 })).toMatch(/Muitas tentativas/);
    expect(getAuthErrorMessage({ code: 'ALGO_NOVO' })).toMatch(/Algo deu errado/);
    expect(getAuthErrorMessage(null)).toMatch(/Algo deu errado/);
  });

  it('explica os erros do login com Google', () => {
    expect(getOAuthErrorMessage(null)).toBeNull();
    expect(getOAuthErrorMessage('account_not_linked')).toMatch(/criada com senha/);
    expect(getOAuthErrorMessage('qualquer_outro')).toMatch(/Não foi possível entrar com o Google/);
  });
});
