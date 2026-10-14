import { after } from 'next/server';
import { handle, json, requireUser } from '@/lib/server/api';
import { toMissionClient } from '@/lib/server/mappers';
import { getMission, joinWaitlist, leaveWaitlist, notifyRegistration, registerVolunteer, unregisterVolunteer } from '@/lib/server/missions';

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/missions/[id]/register : s'inscrire (?waitlist=true pour la liste d'attente) */
export const POST = handle(async (request: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  const onWaitlist = new URL(request.url).searchParams.get('waitlist') === 'true';

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
  return json({ mission: toMissionClient(mission), promoted });
});
