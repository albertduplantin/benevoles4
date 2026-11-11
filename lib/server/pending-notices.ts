import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { db, missions, users, assignmentNotices } from '@/lib/db';
import type { Mission } from '@/lib/db';
import { escapeHtml, sendEmail } from './email';
import { createNotification } from './missions';
import { renderNotificationEmail } from './notification-email';

/**
 * Affectations « à prévenir » : un bénévole est inscrit à une mission à venir mais n'a pas encore
 * été notifié (affecté ou promu pendant la pause des notifications).
 */
async function pendingRows(): Promise<{ missionId: string; userId: string }[]> {
  const result = await db.execute(sql`
    SELECT m.id AS mission_id, v AS user_id
    FROM missions m, unnest(m.volunteers) AS v
    WHERE m.status IN ('published', 'full')
      AND (m.start_date IS NULL OR m.start_date >= now() - interval '6 hours')
      AND EXISTS (SELECT 1 FROM users u WHERE u.id = v)
      AND NOT EXISTS (SELECT 1 FROM assignment_notices n WHERE n.mission_id = m.id AND n.user_id = v)
  `);
  return (result.rows as { mission_id: string; user_id: string }[]).map((r) => ({ missionId: r.mission_id, userId: r.user_id }));
}

/** Combien de bénévoles (et d'affectations) restent à prévenir */
export async function pendingSummary() {
  const rows = await pendingRows();
  return { volunteers: new Set(rows.map((r) => r.userId)).size, assignments: rows.length };
}

const dayFr = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris' });
const hourFr = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });

function whenFr(m: Mission): string {
  if (!m.startDate) return 'Mission continue';
  const end = m.endDate ? ` – ${hourFr.format(m.endDate)}` : '';
  return `${dayFr.format(m.startDate)}, ${hourFr.format(m.startDate)}${end}`;
}

/** Récapitulatif d'un bénévole : toutes ses missions à venir, les nouvelles étant signalées */
function buildRecap(person: { firstName: string; emailOnly: boolean | null; personalToken: string | null }, list: { mission: Mission; isNew: boolean }[]) {
  const base = process.env.NEXT_PUBLIC_APP_BASE_URL ?? '';
  const url =
    person.emailOnly && person.personalToken
      ? `${base}/mes-missions?token=${person.personalToken}`
      : `${base}/dashboard/missions?filter=my`;

  const rows = list
    .map(
      ({ mission, isNew }) =>
        `<tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-size:16px;line-height:1.4;">
<strong>${escapeHtml(whenFr(mission))}</strong>${isNew ? ' <span style="background:#ebbb4f;color:#121110;font-size:12px;font-weight:bold;padding:2px 8px;border-radius:999px;">Nouveau</span>' : ''}<br>
${escapeHtml(mission.title)}<br><span style="color:#666;">${escapeHtml(mission.location)}</span></td></tr>`
    )
    .join('');

  const count = list.length;
  const { html, text } = renderNotificationEmail({
    title: 'Vos missions au festival',
    intro: `Bonjour ${escapeHtml(person.firstName)}, voici ${count > 1 ? `vos ${count} missions` : 'votre mission'} pour le festival. Merci pour votre aide !`,
    bodyHtml: `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:18px;">${rows}</table>`,
    bodyText: list.map(({ mission, isNew }) => `- ${whenFr(mission)} : ${mission.title} (${mission.location})${isNew ? ' [Nouveau]' : ''}`).join('\n'),
    buttonLabel: 'Voir mes missions',
    url,
  });
  return { html, text, count, url };
}

async function recapFor(userId: string, pendingMissionIds: Set<string>) {
  const person = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!person) return null;
  const current = await db
    .select()
    .from(missions)
    .where(
      and(
        sql`${userId} = ANY(${missions.volunteers})`,
        inArray(missions.status, ['published', 'full']),
        sql`(${missions.startDate} IS NULL OR ${missions.startDate} >= now() - interval '6 hours')`
      )
    )
    .orderBy(sql`${missions.startDate} ASC NULLS LAST`, asc(missions.title));
  if (current.length === 0) return null;
  const list = current.map((mission) => ({ mission, isNew: pendingMissionIds.has(mission.id) }));
  return { person, list, ...buildRecap(person, list) };
}

/**
 * Envoie le récapitulatif aux bénévoles encore à prévenir, par lots (le client rappelle jusqu'à ce
 * qu'il n'en reste plus). Un bénévole n'est marqué « prévenu » qu'une fois son email réellement parti,
 * donc un échec peut être retenté sans doublon.
 */
export async function sendPendingRecaps(limit: number) {
  const rows = await pendingRows();
  const byUser = new Map<string, Set<string>>();
  for (const r of rows) byUser.set(r.userId, (byUser.get(r.userId) ?? new Set()).add(r.missionId));

  const batch = [...byUser.entries()].slice(0, limit);
  let sent = 0;
  let withoutEmail = 0;
  let failed = 0;

  for (const [userId, pendingIds] of batch) {
    const recap = await recapFor(userId, pendingIds);
    if (!recap) continue;
    const { person, list, html, text, count } = recap;
    try {
      if (person.email && person.emailNotifications !== false) {
        await sendEmail({ to: person.email, subject: 'Vos missions au festival', html, text });
      } else {
        withoutEmail++;
      }
      await createNotification({
        userId,
        type: 'assignments_recap',
        title: '📋 Vos missions',
        message: `Vous êtes inscrit(e) à ${count} mission${count > 1 ? 's' : ''}. Retrouvez-les dans « Mes missions ».`,
      });
      await db
        .insert(assignmentNotices)
        .values(list.map(({ mission }) => ({ missionId: mission.id, userId })))
        .onConflictDoNothing();
      sent++;
    } catch (error) {
      console.error('Recap error:', userId, error);
      failed++;
    }
  }

  return { sent, withoutEmail, failed, remaining: Math.max(0, byUser.size - batch.length) + failed };
}

/** Envoie à l'administrateur lui-même un exemple (le premier bénévole à prévenir), sans rien marquer */
export async function sendSampleRecap(adminEmail: string) {
  const rows = await pendingRows();
  if (rows.length === 0) return null;
  const first = rows[0].userId;
  const pendingIds = new Set(rows.filter((r) => r.userId === first).map((r) => r.missionId));
  const recap = await recapFor(first, pendingIds);
  if (!recap) return null;
  await sendEmail({
    to: adminEmail,
    subject: `[EXEMPLE] Vos missions au festival (pour ${recap.person.firstName} ${recap.person.lastName})`,
    html: recap.html,
    text: recap.text,
  });
  return { name: `${recap.person.firstName} ${recap.person.lastName}`.trim(), missions: recap.count };
}
