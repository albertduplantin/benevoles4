import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Routes publiques accessibles sans authentification
const isPublicRoute = createRouteMatcher([
  '/',
  '/auth/login(.*)',
  '/auth/register(.*)',
  '/auth/reset-password(.*)',
  '/auth/complete-profile(.*)',
  '/legal(.*)',
  '/api/webhooks/(.*)', // Pour les webhooks Clerk
]);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();
  const { pathname } = request.nextUrl;

  // Si l'utilisateur n'est pas connecté et essaie d'accéder à une route protégée
  if (!userId && !isPublicRoute(request)) {
    const signInUrl = new URL('/auth/login', request.url);
    signInUrl.searchParams.set('redirect_url', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Si l'utilisateur est connecté et essaie d'accéder aux pages auth, rediriger vers dashboard
  if (userId && pathname.startsWith('/auth/') && !pathname.startsWith('/auth/complete-profile')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
