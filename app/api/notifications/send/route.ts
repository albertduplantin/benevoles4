import { inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db, users, notifications } from '@/lib/db';
import { handle, json, newId, requireUser, HttpError } from '@/lib/server/api';

const schema = z.object({
  userIds: z.array(z.string().min(1)).min(1),
  payload: z.object({
    type: z.string(),
    title: z.string().min(1),
    body: z.string().min(1),
    missionId: z.string().optional(),
  }),
});

/** POST /api/notifications/send : notification in-app à des utilisateurs précis (staff) */
export const POST = handle(async (request: Request) => {
  await requireUser(['admin', 'category_responsible']);
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) throw new HttpError(400, 'userIds et payload (title, body) requis');
  const { userIds, payload } = parsed.data;

  const existing = await db.select({ id: users.id }).from(users).where(inArray(users.id, userIds));
  if (existing.length === 0) return json({ success: true, sent: 0 });

  await db.insert(notifications).values(
    existing.map((u) => ({
      id: newId(),
      userId: u.id,
      type: payload.type,
      title: payload.title,
      message: payload.body,
      missionId: payload.missionId,
    }))
  );
  return json({ success: true, sent: existing.length });
});
