import NextAuth from 'next-auth';
import Resend from 'next-auth/providers/resend';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { eq } from 'drizzle-orm';
import { db, users, accounts, verificationTokens } from '@/lib/db';
import { authConfig } from './auth.config';

type Role = 'volunteer' | 'category_responsible' | 'admin';

// Intervalle minimal entre deux relectures du profil en base (rôle modifié par un admin, etc.)
const PROFILE_REFRESH_MS = 60_000;

/** Le lien magique n'est actif que si un expéditeur vérifié est configuré (domaine Resend). */
export const emailLoginEnabled = !!(process.env.RESEND_API_KEY && process.env.AUTH_EMAIL_FROM);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    verificationTokensTable: verificationTokens,
  } as any),
  providers: [
    ...authConfig.providers,
    ...(emailLoginEnabled
      ? [
          Resend({
            apiKey: process.env.RESEND_API_KEY,
            from: process.env.AUTH_EMAIL_FROM,
          }),
        ]
      : []),
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
