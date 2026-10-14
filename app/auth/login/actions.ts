'use server';

import { signIn } from '@/auth';

export async function signInWithGoogle() {
  await signIn('google', { redirectTo: '/dashboard/missions' });
}

export async function signInWithEmail(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!email) return;
  await signIn('resend', { email, redirectTo: '/dashboard/missions' });
}
