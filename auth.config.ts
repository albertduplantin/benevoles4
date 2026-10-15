import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

/** Chemins accessibles sans connexion */
export function isPublicPath(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/legal') ||
    // Accès par jeton personnel pour les bénévoles "email-only" (sans connexion)
    pathname === '/mes-missions' ||
    pathname === '/api/personal'
  );
}

/**
 * Configuration Auth.js compatible Edge (utilisée par le middleware).
 * Pas d'accès base de données ici : voir auth.ts pour la configuration complète.
 */
export const authConfig = {
  trustHost: true,
  // Session de 90 jours : les bénévoles n'ont pas à se reconnecter à chaque visite
  session: { strategy: 'jwt', maxAge: 90 * 24 * 60 * 60 },
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
      return isPublicPath(request.nextUrl.pathname) || !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
