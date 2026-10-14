import { and, eq, sql } from 'drizzle-orm';
import { db, missions, users, adminSettings, categoryResponsibles, notifications } from '@/lib/db';
import type { Mission } from '@/lib/db';
import { HttpError, newId } from './api';
import { escapeHtml, sendEmail } from './email';

export async function getSettings() {
  const row = await db.query.adminSettings.findFirst({ where: eq(adminSettings.id, 'admin') });
  return {
    autoApproveResponsibility: row?.autoApproveResponsibility ?? false,
    festivalStartDate: row?.festivalStartDate ?? undefined,
    festivalEndDate: row?.festivalEndDate ?? undefined,
    registrationsBlocked: row?.registrationsBlocked ?? false,
    registrationBlockedMessage: row?.registrationBlockedMessage ?? '',
    updatedAt: row?.updatedAt ?? undefined,
    updatedBy: row?.updatedBy ?? undefined,
  };
}

export async function getMission(missionId: string): Promise<Mission> {
  const mission = await db.query.missions.findFirst({ where: eq(missions.id, missionId) });
  if (!mission) throw new HttpError(404, 'Mission introuvable');
  return mission;
}

function overlap(a: Mission, b: Mission): boolean {
  if (!a.startDate || !b.startDate) return false;
  const endA = a.endDate ?? a.startDate;
  const endB = b.endDate ?? b.startDate;
  return a.startDate < endB && endA > b.startDate;
}

/** Missions de l'utilisateur qui chevauchent la mission cible */
export async function findConflicts(userId: string, target: Mission): Promise<Mission[]> {
  const mine = await db
    .select()
    .from(missions)
    .where(and(sql`${userId} = ANY(${missions.volunteers})`, sql`${missions.id} <> ${target.id}`));
  return mine.filter((m) => m.status !== 'cancelled' && overlap(target, m));
}

/**
 * Recale une mission : promeut la liste d'attente tant qu'il reste des places,
 * puis aligne le statut (published <-> full).
 * Retourne les ids promus.
 */
export async function rebalance(missionId: string): Promise<string[]> {
  const promoted: string[] = [];
  for (let i = 0; i < 50; i++) {
    const [row] = await db
      .update(missions)
      .set({
        volunteers: sql`array_append(${missions.volunteers}, (${missions.waitlist})[1])`,
        waitlist: sql`COALESCE((${missions.waitlist})[2:cardinality(${missions.waitlist})], '{}')`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(missions.id, missionId),
          sql`cardinality(${missions.waitlist}) > 0`,
          sql`cardinality(${missions.volunteers}) < ${missions.maxVolunteers}`,
          sql`${missions.status} IN ('published', 'full')`
        )
      )
      .returning({ volunteers: missions.volunteers });
    if (!row) break;
    promoted.push(row.volunteers![row.volunteers!.length - 1]);
  }

  await db
    .update(missions)
    .set({
      status: sql`CASE WHEN cardinality(${missions.volunteers}) >= ${missions.maxVolunteers} THEN 'full' ELSE 'published' END`,
      updatedAt: new Date(),
    })
    .where(and(eq(missions.id, missionId), sql`${missions.status} IN ('published', 'full')`));

  return promoted;
}

/** Explique pourquoi une inscription a été refusée */
function registrationError(mission: Mission, userId: string): HttpError {
  if (mission.status === 'cancelled') return new HttpError(400, 'Cette mission a été annulée');
  if (mission.status === 'completed') return new HttpError(400, 'Cette mission est terminée');
  if (mission.status === 'draft') return new HttpError(400, "Cette mission n'est pas encore publiée");
  if (mission.volunteers?.includes(userId)) return new HttpError(400, 'Vous êtes déjà inscrit à cette mission');
  return new HttpError(400, 'Cette mission est complète');
}

/**
 * Inscrit un bénévole. L'ajout est un seul UPDATE conditionnel : deux inscriptions
 * simultanées ne peuvent pas dépasser le nombre de places.
 */
export async function registerVolunteer(
  missionId: string,
  userId: string,
  opts: { byAdmin?: boolean } = {}
): Promise<Mission> {
  if (!opts.byAdmin) {
    const settings = await getSettings();
    if (settings.registrationsBlocked) {
      throw new HttpError(
        403,
        settings.registrationBlockedMessage ||
          "Les inscriptions aux missions sont temporairement fermées. Veuillez contacter l'équipe d'organisation."
      );
    }
  }

  const mission = await getMission(missionId);
  const conflicts = await findConflicts(userId, mission);
  if (conflicts.length > 0) {
    const titles = conflicts.map((m) => m.title).join(', ');
    throw new HttpError(
      409,
      opts.byAdmin
        ? `Le bénévole ne peut pas être inscrit à cette mission car elle se chevauche avec : ${titles}`
        : `Vous ne pouvez pas vous inscrire à cette mission car elle se chevauche avec : ${titles}`
    );
  }

  const [updated] = await db
    .update(missions)
    .set({
      volunteers: sql`array_append(${missions.volunteers}, ${userId})`,
      waitlist: sql`array_remove(${missions.waitlist}, ${userId})`,
      status: sql`CASE WHEN cardinality(${missions.volunteers}) + 1 >= ${missions.maxVolunteers} THEN 'full' ELSE ${missions.status} END`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(missions.id, missionId),
        sql`${missions.status} = 'published'`,
        sql`NOT (${userId} = ANY(${missions.volunteers}))`,
        sql`cardinality(${missions.volunteers}) < ${missions.maxVolunteers}`
      )
    )
    .returning();

  if (!updated) throw registrationError(await getMission(missionId), userId);
  return updated;
}

/** Désinscrit un bénévole (24 h minimum avant le début, sauf par un admin) puis promeut la liste d'attente. */
export async function unregisterVolunteer(
  missionId: string,
  userId: string,
  opts: { byAdmin?: boolean } = {}
): Promise<{ mission: Mission; promoted: string[] }> {
  const mission = await getMission(missionId);
  if (!mission.volunteers?.includes(userId)) {
    throw new HttpError(400, opts.byAdmin ? "Le bénévole n'est pas inscrit à cette mission" : "Vous n'êtes pas inscrit à cette mission");
  }

  if (!opts.byAdmin && mission.startDate) {
    const hours = (mission.startDate.getTime() - Date.now()) / 36e5;
    if (hours < 24 && hours > 0) {
      throw new HttpError(400, 'Impossible de se désinscrire moins de 24h avant le début de la mission');
    }
  }

  await db
    .update(missions)
    .set({
      volunteers: sql`array_remove(${missions.volunteers}, ${userId})`,
      responsibles: sql`array_remove(${missions.responsibles}, ${userId})`,
      updatedAt: new Date(),
    })
    .where(eq(missions.id, missionId));

  const promoted = await rebalance(missionId);
  return { mission: await getMission(missionId), promoted };
}

export async function joinWaitlist(missionId: string, userId: string): Promise<Mission> {
  const [updated] = await db
    .update(missions)
    .set({ waitlist: sql`array_append(${missions.waitlist}, ${userId})`, updatedAt: new Date() })
    .where(
      and(
        eq(missions.id, missionId),
        sql`NOT (${userId} = ANY(${missions.volunteers}))`,
        sql`NOT (${userId} = ANY(${missions.waitlist}))`,
        sql`cardinality(${missions.volunteers}) >= ${missions.maxVolunteers}`
      )
    )
    .returning();

  if (!updated) {
    const mission = await getMission(missionId);
    if (mission.volunteers?.includes(userId)) throw new HttpError(400, 'Vous êtes déjà inscrit à cette mission');
    if (mission.waitlist?.includes(userId)) throw new HttpError(400, "Vous êtes déjà sur la liste d'attente");
    throw new HttpError(400, 'Cette mission a encore des places disponibles, vous pouvez vous inscrire directement');
  }
  return updated;
}

export async function leaveWaitlist(missionId: string, userId: string): Promise<void> {
  await db
    .update(missions)
    .set({ waitlist: sql`array_remove(${missions.waitlist}, ${userId})`, updatedAt: new Date() })
    .where(eq(missions.id, missionId));
}

/** Crée une notification in-app */
export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  message: string;
  missionId?: string;
  missionTitle?: string;
  volunteerName?: string;
  volunteerId?: string;
}) {
  await db.insert(notifications).values({ id: newId(), ...params });
}

/** Notifie (in-app + email) les admins et responsables de la catégorie d'une nouvelle inscription */
export async function notifyRegistration(mission: Mission, volunteerId: string): Promise<void> {
  const volunteer = await db.query.users.findFirst({ where: eq(users.id, volunteerId) });
  const volunteerName = `${volunteer?.firstName ?? ''} ${volunteer?.lastName ?? ''}`.trim() || 'Bénévole';

  const admins = await db.select().from(users).where(eq(users.role, 'admin'));
  const responsibles = await db
    .select({ user: users })
    .from(categoryResponsibles)
    .innerJoin(users, eq(users.id, categoryResponsibles.responsibleId))
    .where(eq(categoryResponsibles.categoryId, mission.category));

  const recipients = new Map<string, { id: string; email: string; firstName: string; isAdmin: boolean }>();
  for (const u of admins) recipients.set(u.id, { id: u.id, email: u.email, firstName: u.firstName, isAdmin: true });
  for (const { user: u } of responsibles) {
    if (!recipients.has(u.id)) recipients.set(u.id, { id: u.id, email: u.email, firstName: u.firstName, isAdmin: false });
  }
  recipients.delete(volunteerId);
  if (recipients.size === 0) return;

  const list = [...recipients.values()];
  await db.insert(notifications).values(
    list.map((r) => ({
      id: newId(),
      userId: r.id,
      type: 'volunteer_registration',
      title: '🆕 Nouvelle inscription',
      message: `${volunteerName} s'est inscrit(e) à la mission "${mission.title}"`,
      missionId: mission.id,
      missionTitle: mission.title,
      volunteerName,
      volunteerId,
    }))
  );

  const base = process.env.NEXT_PUBLIC_APP_BASE_URL ?? '';
  const spots = Math.max(0, mission.maxVolunteers - (mission.volunteers?.length ?? 0));
  await Promise.allSettled(
    list
      .filter((r) => r.email)
      .map((r) =>
        sendEmail({
          to: r.email,
          subject: `🆕 Nouvelle inscription - ${mission.title}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#2563eb">🆕 Nouvelle inscription</h2>
            <p>Bonjour ${escapeHtml(r.firstName)},</p>
            <p><strong>${escapeHtml(volunteerName)}</strong> vient de s'inscrire à la mission :</p>
            <div style="background:#f3f4f6;padding:16px;margin:16px 0;border-radius:8px;border-left:4px solid #2563eb">
              <h3 style="margin:0 0 8px">${escapeHtml(mission.title)}</h3>
              <p style="margin:4px 0;color:#4b5563">📁 ${escapeHtml(mission.category)}</p>
            </div>
            <p>Places restantes : <strong>${spots} / ${mission.maxVolunteers}</strong></p>
            <a href="${base}/dashboard/missions/${mission.id}" style="display:inline-block;margin-top:16px;background:#2563eb;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px">Voir la mission</a>
            <p style="margin-top:24px;color:#6b7280;font-size:14px">Vous recevez cet email car vous êtes ${r.isAdmin ? 'administrateur' : 'responsable de cette catégorie'}.</p>
          </div>`,
        })
      )
  );
}
