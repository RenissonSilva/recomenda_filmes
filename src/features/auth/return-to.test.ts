import { describe, expect, it } from 'vitest';

import { sanitizeReturnTo, withReturnTo } from './return-to';

describe('sanitizeReturnTo', () => {
  it('aceita caminhos internos, com busca e âncora', () => {
    expect(sanitizeReturnTo('/avaliar')).toBe('/avaliar');
    expect(sanitizeReturnTo('/filme/27205?aba=elenco#topo')).toBe('/filme/27205?aba=elenco#topo');
  });

  it('bloqueia redirecionamentos para outros sites', () => {
    for (const value of [
      'https://site-malicioso.com',
      '//site-malicioso.com',
      '/\\site-malicioso.com',
      '/\t/site-malicioso.com',
      'javascript:alert(1)',
    ]) {
      expect(sanitizeReturnTo(value)).toBe('/');
    }
  });

  it('não volta para as próprias telas de login nem aceita valores vazios', () => {
    expect(sanitizeReturnTo('/entrar')).toBe('/');
    expect(sanitizeReturnTo('/criar-conta?voltar=/avaliar')).toBe('/');
    expect(sanitizeReturnTo(null)).toBe('/');
    expect(sanitizeReturnTo('')).toBe('/');
  });
});

describe('withReturnTo', () => {
  it('acrescenta a página de retorno só quando ela não é o início', () => {
    expect(withReturnTo('/entrar', '/quero-ver')).toBe('/entrar?voltar=%2Fquero-ver');
    expect(withReturnTo('/entrar', '/')).toBe('/entrar');
    expect(withReturnTo('/entrar', '//site-malicioso.com')).toBe('/entrar');
  });
});
