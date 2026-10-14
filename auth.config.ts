import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

/**
 * Configuration Auth.js compatible Edge (utilisée par le middleware).
 * Pas d'accès base de données ici : voir auth.ts pour la configuration complète.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/login',
    verifyRequest: '/auth/verify',
    error: '/auth/login',
  },
  providers: [
    Google({
      // Rattache la connexion Google au compte existant ayant le même email
      // (comptes migrés depuis Clerk, bénévoles créés par un admin)
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isPublic =
        pathname === '/' ||
        pathname.startsWith('/auth/') ||
        pathname.startsWith('/api/auth/') ||
        pathname.startsWith('/legal') ||
        // Accès par jeton personnel pour les bénévoles "email-only" (sans connexion)
        pathname === '/mes-missions' ||
        pathname === '/api/personal';
      if (isPublic) return true;
      // API : réponse 401 gérée par les routes ; pages : redirection vers /auth/login
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
