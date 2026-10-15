import { and, eq, inArray, sql } from 'drizzle-orm';
import { db, missions, users } from '@/lib/db';
import { handle, json, HttpError } from '@/lib/server/api';
import { toMissionClient, toUserClient } from '@/lib/server/mappers';
import { after } from 'next/server';
import { notifyPromoted, unregisterVolunteer } from '@/lib/server/missions';
import { isValidTokenFormat } from '@/lib/utils/token';

/**
 * Accès sans connexion pour les bénévoles "email-only" : le jeton personnel (32 caractères
 * aléatoires, envoyé par email) tient lieu d'authentification. Route publique : aucune donnée
 * n'est renvoyée sans jeton valide.
 */
async function userFromToken(request: Request) {
  const token = new URL(request.url).searchParams.get('token') ?? '';
  if (!isValidTokenFormat(token)) throw new HttpError(404, 'Lien invalide ou expiré');
  const row = await db.query.users.findFirst({
    where: and(eq(users.personalToken, token), eq(users.emailOnly, true)),
  });
  if (!row) throw new HttpError(404, 'Lien invalide ou expiré');
  return row;
}

/** GET /api/personal?token= : profil, missions et co-participants (noms seulement) */
export const GET = handle(async (request: Request) => {
  const user = await userFromToken(request);

  const mine = await db
    .select()
    .from(missions)
    .where(sql`${user.id} = ANY(${missions.volunteers})`)
    .orderBy(sql`${missions.startDate} ASC NULLS LAST`);

  const participantIds = [...new Set(mine.flatMap((m) => m.volunteers ?? []))];
  const participants = participantIds.length
    ? await db.select().from(users).where(inArray(users.id, participantIds))
    : [];

  return json({
    user: toUserClient(user),
    missions: mine.map(toMissionClient),
    participants: participants.map((p) => ({ uid: p.id, firstName: p.firstName, lastName: p.lastName })),
  });
});

/** DELETE /api/personal?token=&missionId= : se désinscrire d'une mission */
export const DELETE = handle(async (request: Request) => {
  const user = await userFromToken(request);
  const missionId = new URL(request.url).searchParams.get('missionId');
  if (!missionId) throw new HttpError(400, 'missionId requis');

  const { mission, promoted } = await unregisterVolunteer(missionId, user.id);
  after(() => notifyPromoted(mission, promoted).catch((e) => console.error('Notification error:', e)));
  return json({ mission: toMissionClient(mission) });
});
