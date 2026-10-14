import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig, isPublicPath } from './auth.config';

// Instance Edge sans adaptateur : lit uniquement le cookie JWT
const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const isLoggedIn = !!request.auth?.user;

  // Les API renvoient 401 en JSON plutôt qu'une redirection HTML
  if (!isLoggedIn && !isPublicPath(pathname)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Connecté : inutile de revoir la page de connexion
  if (isLoggedIn && (pathname === '/auth/login' || pathname === '/auth/verify')) {
    return NextResponse.redirect(new URL('/dashboard/missions', request.url));
  }
});

export const config = {
  matcher: [
    // Exclut les fichiers statiques, le manifest PWA et le service worker
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|firebase-messaging-sw.js|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|json)$).*)',
  ],
};
