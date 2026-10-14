import { Resend } from 'resend';

const FROM = process.env.AUTH_EMAIL_FROM ?? 'Festival Films Courts <onboarding@resend.dev>';

let client: Resend | null = null;
function getClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return (client ??= new Resend(process.env.RESEND_API_KEY));
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/** Envoie un email via Resend. Sans clé API, ne fait rien (retourne false). */
export async function sendEmail(params: { to: string | string[]; subject: string; html: string }): Promise<boolean> {
  const resend = getClient();
  if (!resend) return false;
  const { error } = await resend.emails.send({ from: FROM, ...params });
  if (error) throw new Error(error.message);
  return true;
}
