import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { eq } from 'drizzle-orm';
import { db, users, accounts, verificationTokens } from '@/lib/db';
import { authConfig } from './auth.config';
import { emailSendingEnabled, sendEmail } from '@/lib/server/email';
import { renderMagicLinkEmail } from '@/lib/server/magic-link-email';

type Role = 'volunteer' | 'category_responsible' | 'admin';

// Intervalle minimal entre deux relectures du profil en base (rôle modifié par un admin, etc.)
const PROFILE_REFRESH_MS = 60_000;

/** La connexion par email n'est proposée que si l'envoi d'emails est configuré (SMTP ou Resend). */
export const emailLoginEnabled = emailSendingEnabled();

/** Identifiant du fournisseur de connexion par lien envoyé par email */
export const EMAIL_PROVIDER_ID = 'email';

const emailProvider = {
  id: EMAIL_PROVIDER_ID,
  type: 'email' as const,
  name: 'Email',
  from: 'Festival Films Courts de Dinan',
  maxAge: 24 * 60 * 60,
  options: {},
  async sendVerificationRequest({ identifier, url }: { identifier: string; url: string }) {
    const { subject, html, text } = renderMagicLinkEmail({ url });
    const sent = await sendEmail({ to: identifier, subject, html, text });
    if (!sent) throw new Error("L'envoi d'emails n'est pas configuré");
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    verificationTokensTable: verificationTokens,
  } as any),
  providers: [
    ...authConfig.providers,
    ...(emailLoginEnabled ? [emailProvider] : []),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      if (user?.id) token.sub = user.id;

      const stale =
        !token.profileLoadedAt || Date.now() - (token.profileLoadedAt as number) > PROFILE_REFRESH_MS;

      if (token.sub && (user || trigger === 'update' || stale)) {
        const row = await db.query.users.findFirst({ where: eq(users.id, token.sub) });
        if (row) {
          token.role = row.role as Role;
          token.firstName = row.firstName;
          token.lastName = row.lastName;
          token.phone = row.phone;
          token.responsibleForCategories = row.responsibleForCategories ?? [];
          token.profileLoadedAt = Date.now();
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = (token.role as Role) ?? 'volunteer';
        session.user.firstName = (token.firstName as string) ?? '';
        session.user.lastName = (token.lastName as string) ?? '';
        session.user.phone = (token.phone as string) ?? '';
        session.user.responsibleForCategories = (token.responsibleForCategories as string[]) ?? [];
      }
      return session;
    },
  },
});
