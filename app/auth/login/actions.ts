'use server';

import { redirect } from 'next/navigation';
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
  try {
    await signIn(EMAIL_PROVIDER_ID, { email, redirectTo: '/dashboard/missions' });
  } catch (error) {
    // Une redirection (envoi réussi -> page "vérifiez votre boîte mail") est levée comme une exception
    if (error instanceof AuthError) redirect('/auth/login?error=EmailSendFailed');
    throw error;
  }
}
