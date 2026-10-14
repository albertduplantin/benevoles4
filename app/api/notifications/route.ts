import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, notifications } from '@/lib/db';
import { handle, json, requireUser, HttpError } from '@/lib/server/api';

export const dynamic = 'force-dynamic';

/** GET /api/notifications : mes notifications (100 dernières) */
export const GET = handle(async () => {
  const user = await requireUser();
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(100);
  return json({ notifications: rows });
});

const readSchema = z.object({ id: z.string().min(1).optional(), all: z.boolean().optional() });

/** PATCH /api/notifications : marque une notification (id) ou toutes (all) comme lues */
export const PATCH = handle(async (request: Request) => {
  const user = await requireUser();
  const parsed = readSchema.safeParse(await request.json());
  if (!parsed.success || (!parsed.data.id && !parsed.data.all)) throw new HttpError(400, 'id ou all requis');

  const own = eq(notifications.userId, user.id);
  await db
    .update(notifications)
    .set({ read: true, readAt: new Date() })
    .where(parsed.data.id ? and(own, eq(notifications.id, parsed.data.id)) : and(own, eq(notifications.read, false)));
  return json({ success: true });
});
