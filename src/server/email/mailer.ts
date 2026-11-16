import 'server-only';

import { createTransport, type Transporter } from 'nodemailer';

import { getSmtpConfig } from '../env';

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

let transporter: Transporter | undefined;

/**
 * Envia um e-mail pelo SMTP configurado em `SMTP_URL`.
 * Sem SMTP, em desenvolvimento o conteúdo é exibido no terminal (para testar os fluxos
 * sem um servidor de e-mail); em produção, a falha fica registrada no log.
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
  const smtp = getSmtpConfig();

  if (!smtp) {
    if (process.env.NODE_ENV === 'production') {
      console.error(`[e-mail] SMTP_URL não configurado: e-mail "${message.subject}" não enviado.`);
    } else {
      console.warn(
        `\n[e-mail] SMTP_URL não configurado — exibindo o e-mail aqui:\n` +
          `Para: ${message.to}\nAssunto: ${message.subject}\n\n${message.text}\n`,
      );
    }
    return;
  }

  transporter ??= createTransport(smtp.url);
  await transporter.sendMail({ from: smtp.from, ...message });
}
