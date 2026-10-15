'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { and, count, eq, gt, lt } from 'drizzle-orm';
import { db, loginAttempts } from '@/lib/db';
import { AuthError } from 'next-auth';
import { signIn, EMAIL_PROVIDER_ID } from '@/auth';

export async function signInWithGoogle() {
  await signIn('google', { redirectTo: '/dashboard/missions' });
}

export async function signInWithEmail(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect('/auth/login?error=InvalidEmail');
  }

  // Anti-abus : la boîte d'envoi est limitée, on plafonne les demandes par adresse et par IP
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const since = new Date(Date.now() - 10 * 60_000);
  const [{ n: forEmail }] = await db.select({ n: count() }).from(loginAttempts)
    .where(and(eq(loginAttempts.email, email), gt(loginAttempts.createdAt, since)));
  const [{ n: forIp }] = ip
    ? await db.select({ n: count() }).from(loginAttempts).where(and(eq(loginAttempts.ip, ip), gt(loginAttempts.createdAt, since)))
    : [{ n: 0 }];
  if (forEmail >= 3 || forIp >= 15) redirect('/auth/login?error=TooManyRequests');
  await db.insert(loginAttempts).values({ id: crypto.randomUUID(), email, ip });
  // ménage : on ne garde qu'une journée d'historique
  await db.delete(loginAttempts).where(lt(loginAttempts.createdAt, new Date(Date.now() - 24 * 3600_000)));

  try {
    await signIn(EMAIL_PROVIDER_ID, { email, redirectTo: '/dashboard/missions' });
  } catch (error) {
    // Une redirection (envoi réussi -> page "vérifiez votre boîte mail") est levée comme une exception
    if (error instanceof AuthError) redirect('/auth/login?error=EmailSendFailed');
    throw error;
  }
}
