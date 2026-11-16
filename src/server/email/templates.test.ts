import { describe, expect, it } from 'vitest';

import { escapeHtml, passwordResetEmail } from './templates';

describe('e-mails', () => {
  it('escapa HTML vindo do usuário', () => {
    expect(escapeHtml('<b>"Ana" & \'Bia\'</b>')).toBe(
      '&lt;b&gt;&quot;Ana&quot; &amp; &#39;Bia&#39;&lt;/b&gt;',
    );
  });

  it('monta o e-mail de recuperação de senha com o link e a validade', () => {
    const email = passwordResetEmail({
      name: 'Ana <script>Souza',
      url: 'http://localhost:3000/api/auth/reset-password/abc?callbackURL=%2Fredefinir-senha',
      expiresInMinutes: 60,
    });

    expect(email.subject).toMatch(/Redefinir sua senha/);
    expect(email.text).toContain('Olá, Ana!');
    expect(email.text).toContain('/api/auth/reset-password/abc');
    expect(email.text).toContain('60 minutos');
    expect(email.html).not.toContain('<script>');
  });
});
