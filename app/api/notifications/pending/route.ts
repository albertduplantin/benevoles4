import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, users } from '@/lib/db';
import { handle, json, requireUser, HttpError } from '@/lib/server/api';
import { getSettings } from '@/lib/server/missions';
import { pendingSummary, sendPendingRecaps, sendSampleRecap } from '@/lib/server/pending-notices';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** GET (admin) : état de la pause et nombre de bénévoles restant à prévenir */
export const GET = handle(async () => {
  await requireUser(['admin']);
  const [summary, settings] = await Promise.all([pendingSummary(), getSettings()]);
  return json({ ...summary, paused: settings.notificationsPaused });
});

const bodySchema = z.object({
  action: z.enum(['send', 'sample']),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

/**
 * POST (admin)
 * - action "sample" : envoie à l'administrateur lui-même un exemple de récapitulatif (ne marque rien)
 * - action "send"   : envoie le récapitulatif à un lot de bénévoles encore à prévenir ; à rappeler
 *   tant que `remaining` n'est pas 0
 */
export const POST = handle(async (request: Request) => {
  const admin = await requireUser(['admin']);
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) throw new HttpError(400, 'Action invalide');

  if (parsed.data.action === 'sample') {
    const me = await db.query.users.findFirst({ where: eq(users.id, admin.id) });
    if (!me?.email) throw new HttpError(400, "Votre compte n'a pas d'adresse email");
    const sample = await sendSampleRecap(me.email);
    if (!sample) throw new HttpError(404, 'Aucun bénévole à prévenir pour le moment');
    return json({ success: true, to: me.email, ...sample });
  }

  return json(await sendPendingRecaps(parsed.data.limit));
});
