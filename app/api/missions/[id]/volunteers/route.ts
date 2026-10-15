import { after } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, users } from '@/lib/db';
import type { Mission } from '@/lib/db';
import { handle, json, requireUser, HttpError } from '@/lib/server/api';
import { toMissionClient } from '@/lib/server/mappers';
import { escapeHtml, sendEmail } from '@/lib/server/email';
import { createNotification, getMission, notifyPromoted, registerVolunteer, unregisterVolunteer } from '@/lib/server/missions';

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({ userId: z.string().min(1) });

async function requireManager(missionId: string) {
  const user = await requireUser(['admin', 'category_responsible']);
  const mission = await getMission(missionId);
  if (user.role !== 'admin' && !user.responsibleForCategories.includes(mission.category)) {
    throw new HttpError(403, 'Accès refusé');
  }
  return mission;
}

/** Prévient le bénévole (in-app, et email s'il l'a activé) d'une affectation ou d'un retrait */
async function notifyVolunteer(volunteerId: string, mission: Mission, assigned: boolean) {
  const volunteer = await db.query.users.findFirst({ where: eq(users.id, volunteerId) });
  if (!volunteer) return;

  const title = assigned ? '📋 Nouvelle affectation' : '❌ Retrait de mission';
  const message = assigned
    ? `Vous avez été affecté(e) à la mission "${mission.title}"`
    : `Vous avez été retiré(e) de la mission "${mission.title}"`;
  await createNotification({
    userId: volunteerId,
    type: assigned ? 'new_assignment' : 'mission_cancellation',
    title,
    message,
    missionId: mission.id,
    missionTitle: mission.title,
  });

  const settings = volunteer.notificationSettings as { emailEnabled?: boolean } | null;
  if (volunteer.emailNotifications !== false && settings?.emailEnabled !== false && volunteer.email) {
    const base = process.env.NEXT_PUBLIC_APP_BASE_URL ?? '';
    await sendEmail({
      to: volunteer.email,
      subject: `${title} - ${mission.title}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2>${title}</h2>
        <p>Bonjour ${escapeHtml(volunteer.firstName)},</p>
        <p>${escapeHtml(message)}.</p>
        <a href="${base}/dashboard/missions/${mission.id}" style="display:inline-block;margin-top:16px;background:#2563eb;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px">Voir la mission</a>
      </div>`,
    });
  }
}

/** POST /api/missions/[id]/volunteers : affecte un bénévole (admin / responsable de la catégorie) */
export const POST = handle(async (request: Request, { params }: Ctx) => {
  const { id } = await params;
  await requireManager(id);
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) throw new HttpError(400, 'userId requis');

  const mission = await registerVolunteer(id, parsed.data.userId, { byAdmin: true });
  after(() => notifyVolunteer(parsed.data.userId, mission, true).catch((e) => console.error('Notification error:', e)));
  return json({ mission: toMissionClient(mission) });
});

/** DELETE /api/missions/[id]/volunteers : retire un bénévole */
export const DELETE = handle(async (request: Request, { params }: Ctx) => {
  const { id } = await params;
  await requireManager(id);
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) throw new HttpError(400, 'userId requis');

  const { mission, promoted } = await unregisterVolunteer(id, parsed.data.userId, { byAdmin: true });
  after(async () => {
    await notifyVolunteer(parsed.data.userId, mission, false).catch((e) => console.error('Notification error:', e));
    await notifyPromoted(mission, promoted).catch((e) => console.error('Notification error:', e));
  });
  return json({ mission: toMissionClient(mission) });
});
