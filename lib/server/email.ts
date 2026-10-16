import nodemailer from 'nodemailer';
import { Resend } from 'resend';

/**
 * Envoi d'emails. Deux modes, choisis par la configuration :
 * - SMTP (ex. Gmail avec un mot de passe d'application) : écrit à n'importe quel destinataire,
 *   sans nom de domaine. Variables : SMTP_USER, SMTP_PASSWORD (+ SMTP_HOST, SMTP_PORT, SMTP_FROM).
 * - Resend : nécessite un domaine vérifié. Variables : RESEND_API_KEY, AUTH_EMAIL_FROM.
 */
const smtpConfigured = () => !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD);
const resendConfigured = () => !!(process.env.RESEND_API_KEY && process.env.AUTH_EMAIL_FROM);

/** Adresses de test (domaine réservé .invalid) : on ne les contacte jamais pour de vrai */
export const isTestAddress = (email: string) => email.trim().toLowerCase().endsWith('.invalid');

/** Vrai si l'application peut envoyer des emails à n'importe qui */
export const emailSendingEnabled = () => smtpConfigured() || resendConfigured();

const fromAddress = () =>
  process.env.SMTP_FROM ?? `Festival Films Courts de Dinan <${process.env.SMTP_USER}>`;

let transport: nodemailer.Transporter | null = null;
function getTransport() {
  // Mode test (jamais en production) : le message est fabriqué mais pas envoyé
  if (process.env.EMAIL_TRANSPORT === 'json' && process.env.NODE_ENV !== 'production') {
    return (transport ??= nodemailer.createTransport({ jsonTransport: true }));
  }
  return (transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: Number(process.env.SMTP_PORT ?? 465) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  }));
}

let resend: Resend | null = null;

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/** Envoie un email. Sans configuration d'envoi, ne fait rien (retourne false). */
export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  const recipients = Array.isArray(params.to) ? params.to : [params.to];
  if (recipients.length > 0 && recipients.every(isTestAddress)) return true; // faux envoi
  if (smtpConfigured()) {
    await getTransport().sendMail({ from: fromAddress(), ...params });
    return true;
  }
  if (resendConfigured()) {
    resend ??= new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({ from: process.env.AUTH_EMAIL_FROM!, ...params });
    if (error) throw new Error(error.message);
    return true;
  }
  return false;
}
