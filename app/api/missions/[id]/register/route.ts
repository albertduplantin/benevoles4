import { after } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, users } from '@/lib/db';
import { handle, json, requireUser, HttpError } from '@/lib/server/api';
import { toMissionClient } from '@/lib/server/mappers';
import { getMission, joinWaitlist, leaveWaitlist, notifyPromoted, notifyRegistration, registerVolunteer, unregisterVolunteer } from '@/lib/server/missions';

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/missions/[id]/register : s'inscrire (?waitlist=true pour la liste d'attente) */
export const POST = handle(async (request: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  const onWaitlist = new URL(request.url).searchParams.get('waitlist') === 'true';

  // Les responsables doivent pouvoir joindre chaque inscrit : nom, prénom et téléphone obligatoires
  const profile = await db.query.users.findFirst({ where: eq(users.id, user.id) });
  if (!profile?.firstName?.trim() || !profile.lastName?.trim() || !profile.phone?.trim()) {
    throw new HttpError(403, 'Merci de compléter votre profil (nom, prénom, téléphone) avant de vous inscrire.');
  }

  // Mission complète : l'inscription bascule automatiquement sur la liste d'attente
  const current = await getMission(id);
  const isFull = current.status === 'full' || (current.volunteers?.length ?? 0) >= current.maxVolunteers;
  if (onWaitlist || (isFull && ['published', 'full'].includes(current.status))) {
    const mission = await joinWaitlist(id, user.id);
    return json({ mission: toMissionClient(mission), onWaitlist: true });
  }

  const mission = await registerVolunteer(id, user.id);
  // Notifications envoyées après la réponse pour ne pas ralentir l'inscription
  after(() => notifyRegistration(mission, user.id).catch((e) => console.error('Notification error:', e)));
  return json({ mission: toMissionClient(mission), onWaitlist: false });
});

/** DELETE /api/missions/[id]/register : se désinscrire (?waitlist=true pour quitter la liste d'attente) */
export const DELETE = handle(async (request: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  const onWaitlist = new URL(request.url).searchParams.get('waitlist') === 'true';

  if (onWaitlist) {
    await leaveWaitlist(id, user.id);
    return json({ success: true });
  }

  const { mission, promoted } = await unregisterVolunteer(id, user.id);
  after(() => notifyPromoted(mission, promoted).catch((e) => console.error('Notification error:', e)));
  return json({ mission: toMissionClient(mission), promoted });
});
