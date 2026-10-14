import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type Role = 'volunteer' | 'category_responsible' | 'admin';

export interface SessionUser {
  id: string;
  role: Role;
  responsibleForCategories: string[];
}

/**
 * Utilisateur connecté, relu en base (le rôle du JWT peut avoir jusqu'à 60 s de retard).
 * Lève une 401 si non connecté, une 403 si le rôle n'est pas autorisé.
 */
export async function requireUser(roles?: Role[]): Promise<SessionUser> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new HttpError(401, 'Non connecté');

  const row = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!row) throw new HttpError(401, 'Compte introuvable');

  const user: SessionUser = {
    id,
    role: row.role as Role,
    responsibleForCategories: row.responsibleForCategories ?? [],
  };
  if (roles && !roles.includes(user.role)) throw new HttpError(403, 'Accès refusé');
  return user;
}

/** Enveloppe un handler : convertit les HttpError en réponses JSON, log les autres en 500. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof HttpError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      console.error('API error:', error);
      return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }
  };
}

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

/** Identifiant court unique pour les nouvelles lignes */
export const newId = () => crypto.randomUUID();
