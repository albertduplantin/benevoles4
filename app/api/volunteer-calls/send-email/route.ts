import { and, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db, users, missions } from '@/lib/db';
import { handle, json, requireUser, HttpError } from '@/lib/server/api';
import { escapeHtml, sendEmail } from '@/lib/server/email';

export const runtime = 'nodejs';

const schema = z.object({
  recipientType: z.enum(['all', 'by_category', 'without_mission', 'custom']),
  categoryIds: z.array(z.string()).optional(),
  userIds: z.array(z.string()).optional(),
  subject: z.string().trim().min(1),
  htmlContent: z.string().min(1),
});

/**
 * POST /api/volunteer-calls/send-email (admin, responsable de catégorie)
 * Envoie un appel à bénévoles par email ; {{firstName}} est remplacé par le prénom.
 */
export const POST = handle(async (request: Request) => {
  await requireUser(['admin', 'category_responsible']);
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) throw new HttpError(400, 'subject, htmlContent et recipientType sont requis');
  const { recipientType, categoryIds, userIds, subject, htmlContent } = parsed.data;

  const withEmail = isNotNull(users.email);
  let recipients: Array<{ id: string; email: string; firstName: string }>;

  switch (recipientType) {
    case 'all':
      recipients = await db.select({ id: users.id, email: users.email, firstName: users.firstName }).from(users).where(withEmail);
      break;

    case 'by_category': {
      if (!categoryIds?.length) throw new HttpError(400, 'categoryIds requis pour by_category');
      recipients = await db
        .select({ id: users.id, email: users.email, firstName: users.firstName })
        .from(users)
        .where(
          sql`jsonb_exists_any(${users.preferences}->'preferredCategories', ARRAY[${sql.join(
            categoryIds.map((c) => sql`${c}`),
            sql`, `
          )}]::text[])`
        );
      break;
    }

    case 'without_mission': {
      const assigned = await db
        .select({ ids: sql<string[]>`COALESCE(array_agg(DISTINCT v), '{}')` })
        .from(sql`${missions}, unnest(${missions.volunteers}) AS v`)
        .where(eq(missions.status, 'published'));
      const assignedIds = assigned[0]?.ids ?? [];
      recipients = (
        await db.select({ id: users.id, email: users.email, firstName: users.firstName }).from(users).where(withEmail)
      ).filter((u) => !assignedIds.includes(u.id));
      break;
    }

    case 'custom':
      if (!userIds?.length) throw new HttpError(400, 'userIds requis pour custom');
      recipients = await db
        .select({ id: users.id, email: users.email, firstName: users.firstName })
        .from(users)
        .where(and(inArray(users.id, userIds), withEmail));
      break;
  }

  recipients = recipients.filter((r) => r.email);
  if (recipients.length === 0) throw new HttpError(400, 'Aucun destinataire trouvé');

  if (!process.env.RESEND_API_KEY) {
    return json({
      success: true,
      recipientCount: recipients.length,
      recipients: recipients.map((r) => ({ email: r.email, firstName: r.firstName })),
      message: `⚠️ Envoi simulé à ${recipients.length} bénévole(s) (RESEND_API_KEY non configurée)`,
      simulated: true,
    });
  }

  // Un email par destinataire pour personnaliser le prénom
  const results = await Promise.allSettled(
    recipients.map((r) =>
      sendEmail({ to: r.email, subject, html: htmlContent.replace(/{{firstName}}/g, escapeHtml(r.firstName)) })
    )
  );
  const sent = results.filter((r) => r.status === 'fulfilled').length;
  const errors = results.length - sent;
  if (errors > 0) console.error(`${errors} erreur(s) d'envoi sur ${results.length}`);
  if (sent === 0) throw new HttpError(502, "Aucun email n'a pu être envoyé (vérifiez le domaine d'envoi Resend)");

  return json({
    success: true,
    recipientCount: recipients.length,
    sentCount: sent,
    errorCount: errors,
    recipients: recipients.map((r) => ({ email: r.email, firstName: r.firstName })),
    message: `Email envoyé à ${sent} bénévole(s)`,
  });
});
