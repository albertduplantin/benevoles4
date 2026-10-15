import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { attendance, db } from '@/lib/db';
import { handle, json, requireUser, HttpError } from '@/lib/server/api';
import { getMission } from '@/lib/server/missions';

type Ctx = { params: Promise<{ id: string }> };

async function requireManager(missionId: string) {
  const user = await requireUser(['admin', 'category_responsible']);
  const mission = await getMission(missionId);
  if (user.role !== 'admin' && !user.responsibleForCategories.includes(mission.category)) {
    throw new HttpError(403, 'Accès refusé');
  }
  return { user, mission };
}

/** GET : pointage de la mission (admin / responsable de la catégorie) */
export const GET = handle(async (_request: Request, { params }: Ctx) => {
  const { id } = await params;
  await requireManager(id);
  const rows = await db.select().from(attendance).where(eq(attendance.missionId, id));
  return json({ attendance: rows.map((r) => ({ userId: r.userId, present: r.present })) });
});

const bodySchema = z.object({ userId: z.string().min(1), present: z.boolean().nullable() });

/** PUT : pointe un bénévole présent/absent ; present = null efface le pointage */
export const PUT = handle(async (request: Request, { params }: Ctx) => {
  const { id } = await params;
  const { user, mission } = await requireManager(id);
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) throw new HttpError(400, 'userId et present requis');
  const { userId, present } = parsed.data;
  if (!mission.volunteers?.includes(userId)) throw new HttpError(400, "Ce bénévole n'est pas inscrit à cette mission");

  if (present === null) {
    await db.delete(attendance).where(and(eq(attendance.missionId, id), eq(attendance.userId, userId)));
  } else {
    await db
      .insert(attendance)
      .values({ missionId: id, userId, present, markedBy: user.id })
      .onConflictDoUpdate({ target: [attendance.missionId, attendance.userId], set: { present, markedBy: user.id, markedAt: new Date() } });
  }
  return json({ success: true });
});
