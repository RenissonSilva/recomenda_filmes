import { siteConfig } from '@/config/site';

import type { EmailMessage } from './mailer';

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}

/** Primeiro nome, para a saudação ("Olá, Ana!"). */
function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? '';
}

interface PasswordResetEmailInput {
  name: string;
  url: string;
  expiresInMinutes: number;
}

export function passwordResetEmail({
  name,
  url,
  expiresInMinutes,
}: PasswordResetEmailInput): Omit<EmailMessage, 'to'> {
  const greeting = firstName(name) ? `Olá, ${firstName(name)}!` : 'Olá!';
  const subject = `Redefinir sua senha · ${siteConfig.name}`;

  const text = [
    greeting,
    '',
    `Recebemos um pedido para redefinir a senha da sua conta no ${siteConfig.name}.`,
    'Para criar uma nova senha, acesse o link abaixo:',
    '',
    url,
    '',
    `O link vale por ${expiresInMinutes} minutos. Se você não fez esse pedido, ignore este e-mail: sua senha continua a mesma.`,
  ].join('\n');

  const html = `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:24px;background:#0b0b10;font-family:system-ui,sans-serif;color:#f3f3f8">
    <div style="max-width:480px;margin:0 auto;padding:32px;border-radius:16px;background:#14141c">
      <h1 style="margin:0 0 16px;font-size:20px">${escapeHtml(greeting)}</h1>
      <p style="margin:0 0 16px;line-height:1.5;color:#a6a6bb">
        Recebemos um pedido para redefinir a senha da sua conta no ${escapeHtml(siteConfig.name)}.
      </p>
      <p style="margin:24px 0">
        <a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 24px;border-radius:999px;background:#8b5cf6;color:#ffffff;font-weight:600;text-decoration:none">
          Criar nova senha
        </a>
      </p>
      <p style="margin:0;font-size:13px;line-height:1.5;color:#727289">
        O link vale por ${expiresInMinutes} minutos. Se você não fez esse pedido, ignore este e-mail: sua senha continua a mesma.
      </p>
    </div>
  </body>
</html>`;

  return { subject, text, html };
}
