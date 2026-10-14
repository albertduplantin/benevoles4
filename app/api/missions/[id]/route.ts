import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, missions } from '@/lib/db';
import { handle, json, requireUser, HttpError, type SessionUser } from '@/lib/server/api';
import { toMissionClient } from '@/lib/server/mappers';
import { getMission, rebalance } from '@/lib/server/missions';

type Ctx = { params: Promise<{ id: string }> };

function canManage(user: SessionUser, category: string): boolean {
  return user.role === 'admin' || (user.role === 'category_responsible' && user.responsibleForCategories.includes(category));
}

/** GET /api/missions/[id] */
export const GET = handle(async (_request: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  const mission = await getMission(id);
  // Les brouillons ne sont visibles que par ceux qui peuvent les gérer
  if (mission.status === 'draft' && !canManage(user, mission.category)) {
    throw new HttpError(404, 'Mission introuvable');
  }
  return json({ mission: toMissionClient(mission) });
});

const updateSchema = z
  .object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    category: z.string().trim().min(1),
    type: z.enum(['scheduled', 'ongoing']),
    startDate: z.string().datetime().nullable(),
    endDate: z.string().datetime().nullable(),
    location: z.string().trim().min(1),
    maxVolunteers: z.coerce.number().int().min(1),
    isUrgent: z.boolean(),
    isRecurrent: z.boolean(),
    status: z.enum(['draft', 'published', 'full', 'cancelled', 'completed']),
  })
  .partial();

/** PUT /api/missions/[id] : modification (admin ou responsable de la catégorie) */
export const PUT = handle(async (request: Request, { params }: Ctx) => {
  const user = await requireUser(['admin', 'category_responsible']);
  const { id } = await params;
  const existing = await getMission(id);
  if (!canManage(user, existing.category)) throw new HttpError(403, 'Accès refusé');

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) throw new HttpError(400, 'Champs invalides');
  const data = parsed.data;

  if (data.category && data.category !== existing.category && !canManage(user, data.category)) {
    throw new HttpError(403, "Vous n'êtes pas responsable de cette catégorie");
  }

  const { startDate, endDate, ...rest } = data;
  const [updated] = await db
    .update(missions)
    .set({
      ...rest,
      ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      updatedAt: new Date(),
    })
    .where(eq(missions.id, id))
    .returning();

  // Nouveau quota ou nouveau statut : réaligne published/full et promeut la liste d'attente
  if (data.maxVolunteers !== undefined || data.status === 'published') {
    await rebalance(id);
    return json({ mission: toMissionClient(await getMission(id)) });
  }
  return json({ mission: toMissionClient(updated) });
});

/** DELETE /api/missions/[id] */
export const DELETE = handle(async (_request: Request, { params }: Ctx) => {
  const user = await requireUser(['admin', 'category_responsible']);
  const { id } = await params;
  const existing = await getMission(id);
  if (!canManage(user, existing.category)) throw new HttpError(403, 'Accès refusé');

  await db.delete(missions).where(eq(missions.id, id));
  return json({ success: true });
});
