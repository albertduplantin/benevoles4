import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db, users, notifications } from '@/lib/db';
import { handle, json, newId, requireUser, HttpError } from '@/lib/server/api';

const schema = z.object({
  target: z.enum(['all', 'role', 'category']),
  targetValue: z.string().optional(),
  payload: z.object({
    type: z.string(),
    title: z.string().min(1),
    body: z.string().min(1),
    missionId: z.string().optional(),
  }),
});

/**
 * POST /api/notifications/broadcast (admin)
 * Notification in-app à tous, à un rôle, ou aux responsables d'une catégorie.
 */
export const POST = handle(async (request: Request) => {
  await requireUser(['admin']);
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) throw new HttpError(400, 'target et payload (title, body) requis');
  const { target, targetValue, payload } = parsed.data;
  if (target !== 'all' && !targetValue) throw new HttpError(400, 'targetValue requis');

  const recipients = await db
    .select({ id: users.id })
    .from(users)
    .where(
      target === 'role'
        ? eq(users.role, targetValue!)
        : target === 'category'
          ? sql`${targetValue} = ANY(${users.responsibleForCategories})`
          : undefined
    );
  if (recipients.length === 0) return json({ success: true, sent: 0 });

  await db.insert(notifications).values(
    recipients.map((u) => ({
      id: newId(),
      userId: u.id,
      type: payload.type,
      title: payload.title,
      message: payload.body,
      missionId: payload.missionId,
    }))
  );
  return json({ success: true, sent: recipients.length });
});
