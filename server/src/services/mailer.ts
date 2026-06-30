import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!env.mail.host) return null; // not configured → console fallback
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.mail.host,
      port: env.mail.port,
      secure: env.mail.port === 465,
      auth: env.mail.user ? { user: env.mail.user, pass: env.mail.password } : undefined,
    });
  }
  return transporter;
}

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/** Send an email, or log it to the console when SMTP is not configured (dev). */
export async function sendMail(message: MailMessage): Promise<void> {
  const tx = getTransporter();
  if (!tx) {
    console.log(
      `\n[mailer:console] To: ${message.to}\n  Subject: ${message.subject}\n  ${message.text}\n`,
    );
    return;
  }
  await tx.sendMail({ from: env.mail.from, ...message });
}
