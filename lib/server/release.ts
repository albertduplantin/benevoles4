import { and, eq, ne, notInArray, sql } from 'drizzle-orm';
import { db, missions, users, categoryResponsibles } from '@/lib/db';
import type { Mission } from '@/lib/db';
import { HttpError } from './api';
import { escapeHtml, isTestAddress, sendEmail } from './email';
import { createNotification, getMission, notifyPromoted, unregisterVolunteer } from './missions';
import { renderNotificationEmail } from './notification-email';

const MAX_CANDIDATES = 25;

const whenFr = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris',
});

/**
 * « Je ne peux plus venir » : libère la place même à moins de 24 h de la mission.
 * Les bénévoles en liste d'attente sont promus automatiquement ; s'il reste des places,
 * la mission passe en « urgent » et un appel est envoyé aux bénévoles disponibles.
 */
export async function releaseVolunteer(missionId: string, userId: string) {
  const before = await getMission(missionId);
  if (!before.volunteers?.includes(userId)) {
    throw new HttpError(400, "Vous n'êtes pas inscrit à cette mission");
  }

  // L'inscrit part : on passe outre la règle des 24 h (c'est justement le cas d'urgence)
  const { mission, promoted } = await unregisterVolunteer(missionId, userId, { byAdmin: true });

  const spotsLeft = mission.maxVolunteers - (mission.volunteers?.length ?? 0);
  let urgent = false;
  if (spotsLeft > 0 && mission.status !== 'cancelled' && mission.status !== 'completed') {
    await db.update(missions).set({ isUrgent: true, updatedAt: new Date() }).where(eq(missions.id, missionId));
    urgent = true;
  }
  return { mission: await getMission(missionId), promoted, urgent, spotsLeft };
}

/** Prévient les responsables et lance l'appel urgent (à exécuter après la réponse) */
export async function notifyRelease(params: { mission: Mission; userId: string; promoted: string[]; urgent: boolean; spotsLeft: number }) {
  const { mission, userId, promoted, urgent, spotsLeft } = params;
  const base = process.env.NEXT_PUBLIC_APP_BASE_URL ?? '';
  const url = `${base}/dashboard/missions/${mission.id}`;
  const when = mission.startDate ? whenFr.format(mission.startDate) : '';

  const leaver = await db.query.users.findFirst({ where: eq(users.id, userId) });
  const leaverName = `${leaver?.firstName ?? ''} ${leaver?.lastName ?? ''}`.trim() || 'Un bénévole';

  // 1. promus depuis la liste d'attente
  await notifyPromoted(mission, promoted);

  // 2. admins + responsables de la catégorie
  const admins = await db.select().from(users).where(eq(users.role, 'admin'));
  const responsibles = await db
    .select({ user: users })
    .from(categoryResponsibles)
    .innerJoin(users, eq(users.id, categoryResponsibles.responsibleId))
    .where(eq(categoryResponsibles.categoryId, mission.category));
  const managers = new Map<string, typeof admins[number]>();
  for (const u of [...admins, ...responsibles.map((r) => r.user)]) managers.set(u.id, u);
  managers.delete(userId);
  // Un compte de test (tests automatiques) ne doit jamais notifier de vraies personnes
  const testRun = !!leaver?.email && isTestAddress(leaver.email);
  if (testRun) for (const [id, m] of managers) if (!isTestAddress(m.email)) managers.delete(id);

  const status =
    spotsLeft > 0
      ? `Il reste <strong>${spotsLeft} place${spotsLeft > 1 ? 's' : ''}</strong> à pourvoir${urgent ? ' : la mission est passée en urgent et un appel a été envoyé aux bénévoles disponibles.' : '.'}`
      : 'La place a été reprise automatiquement par un bénévole de la liste d’attente.';

  for (const manager of managers.values()) {
    await createNotification({
      userId: manager.id,
      type: 'volunteer_withdrawal',
      title: '⚠️ Un bénévole ne peut plus venir',
      message: `${leaverName} se désiste de "${mission.title}" (${when})`,
      missionId: mission.id,
      missionTitle: mission.title,
      volunteerName: leaverName,
      volunteerId: userId,
    });
    if (manager.email) {
      const { html, text } = renderNotificationEmail({
        title: 'Un bénévole ne peut plus venir',
        intro: `${escapeHtml(leaverName)} se désiste de <strong>${escapeHtml(mission.title)}</strong>${when ? `<br>${escapeHtml(when)}` : ''}.<br><br>${status}`,
        buttonLabel: 'Voir la mission',
        url,
      });
      await sendEmail({ to: manager.email, subject: `Désistement : ${mission.title}`, html, text }).catch((e) => console.error('Release email error:', e));
    }
  }

  if (!urgent) return;

  // 3. appel aux bénévoles disponibles : pas déjà inscrits, pas occupés sur ce créneau
  const taken = [...(mission.volunteers ?? []), ...(mission.waitlist ?? []), userId];
  const start = mission.startDate;
  const end = mission.endDate ?? mission.startDate;
  let busy = new Set<string>();
  if (start && end) {
    const overlapping = await db
      .select({ volunteers: missions.volunteers })
      .from(missions)
      .where(
        and(
          ne(missions.id, mission.id),
          notInArray(missions.status, ['cancelled', 'draft']),
          sql`${missions.startDate} < ${end}`,
          sql`COALESCE(${missions.endDate}, ${missions.startDate}) > ${start}`
        )
      );
    busy = new Set(overlapping.flatMap((m) => m.volunteers ?? []));
  }

  const pool = await db
    .select()
    .from(users)
    .where(and(notInArray(users.id, taken), sql`${users.email} <> ''`, sql`COALESCE(${users.emailNotifications}, true)`));
  const candidates = pool
    .filter((u) => !busy.has(u.id) && u.firstName.trim() !== '' && (!testRun || isTestAddress(u.email)))
    .map((u) => {
      const preferred = ((u.preferences as { preferredCategories?: string[] } | null)?.preferredCategories ?? []).includes(mission.category);
      return { u, preferred };
    })
    .sort((a, b) => Number(b.preferred) - Number(a.preferred))
    .slice(0, MAX_CANDIDATES);

  for (const { u } of candidates) {
    await createNotification({
      userId: u.id,
      type: 'urgent_call',
      title: '🙋 On a besoin de vous',
      message: `Une place se libère : "${mission.title}" (${when}). Pouvez-vous venir ?`,
      missionId: mission.id,
      missionTitle: mission.title,
    });
    const { html, text } = renderNotificationEmail({
      title: 'On a besoin d’un coup de main',
      intro: `Bonjour ${escapeHtml(u.firstName)}, une place vient de se libérer pour <strong>${escapeHtml(mission.title)}</strong>${when ? `<br>${escapeHtml(when)}` : ''}${mission.location ? `<br>Lieu : ${escapeHtml(mission.location)}` : ''}.<br><br>Si vous êtes disponible, vous pouvez vous inscrire en un clic.`,
      buttonLabel: 'Je peux venir',
      url,
    });
    await sendEmail({ to: u.email, subject: `On a besoin de vous : ${mission.title}`, html, text }).catch((e) => console.error('Urgent call email error:', e));
  }
}

