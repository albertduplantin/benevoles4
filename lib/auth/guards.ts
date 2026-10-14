import { NextResponse } from 'next/server';
import { auth } from '@/auth';

type Role = 'volunteer' | 'category_responsible' | 'admin';

/**
 * Vérifie que l'appelant est connecté et a l'un des rôles autorisés.
 * Retourne une réponse 401/403 à renvoyer telle quelle, ou null si l'accès est autorisé.
 */
export async function requireRole(roles: Role[]): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!roles.includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

export const requireAdmin = () => requireRole(['admin']);
export const requireStaff = () => requireRole(['admin', 'category_responsible']);
