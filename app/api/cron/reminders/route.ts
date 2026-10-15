import { and, between, eq, inArray, sql } from 'drizzle-orm';
import { db, missions, reminders, users } from '@/lib/db';
import { json } from '@/lib/server/api';
import { escapeHtml, sendEmail } from '@/lib/server/email';
import { createNotification } from '@/lib/server/missions';
import { renderNotificationEmail } from '@/lib/server/notification-email';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const timeFr = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });

/**
 * Rappel de la veille : chaque jour à 18 h (heure de Paris), prévient les bénévoles des missions
 * qui commencent dans les ~30 prochaines heures. Un rappel n'est envoyé qu'une fois par bénévole
 * et par mission. Appelé par Vercel Cron avec `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const now = new Date();
  const horizon = new Date(now.getTime() + 30 * 3600_000);
  const upcoming = await db
    .select()
    .from(missions)
    .where(and(inArray(missions.status, ['published', 'full']), between(missions.startDate, now, horizon)));

  const base = process.env.NEXT_PUBLIC_APP_BASE_URL ?? '';
  let sent = 0;

  for (const mission of upcoming) {
    const ids = mission.volunteers ?? [];
    if (ids.length === 0) continue;
    const already = await db.select({ userId: reminders.userId }).from(reminders).where(eq(reminders.missionId, mission.id));
    const done = new Set(already.map((r) => r.userId));
    const targets = ids.filter((id) => !done.has(id));
    if (targets.length === 0) continue;

    const people = await db.select().from(users).where(inArray(users.id, targets));
    for (const person of people) {
      const when = mission.startDate ? timeFr.format(mission.startDate) : '';
      await createNotification({
        userId: person.id,
        type: 'mission_reminder',
        title: '⏰ C’est bientôt !',
        message: `Rappel : "${mission.title}" — ${when}, ${mission.location}`,
        missionId: mission.id,
        missionTitle: mission.title,
      });
      if (person.email && person.emailNotifications !== false) {
        const { html, text } = renderNotificationEmail({
          title: 'Rappel pour demain',
          intro: `Bonjour ${escapeHtml(person.firstName)}, pour vous rappeler : <strong>${escapeHtml(mission.title)}</strong><br>${escapeHtml(when)}<br>Lieu : ${escapeHtml(mission.location)}`,
          buttonLabel: 'Voir la mission',
          url: `${base}/dashboard/missions/${mission.id}`,
        });
        await sendEmail({ to: person.email, subject: `Rappel : ${mission.title}`, html, text }).catch((e) => console.error('Reminder email error:', e));
      }
      await db.insert(reminders).values({ missionId: mission.id, userId: person.id }).onConflictDoNothing();
      sent++;
    }
  }

  return json({ missions: upcoming.length, remindersSent: sent });
}
