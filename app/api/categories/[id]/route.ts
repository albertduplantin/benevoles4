import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, missionCategories, missions } from '@/lib/db';
import { handle, json, requireUser, HttpError } from '@/lib/server/api';
import { toCategoryClient } from '@/lib/server/mappers';

type Ctx = { params: Promise<{ id: string }> };

const updateSchema = z
  .object({
    label: z.string().trim().min(1),
    group: z.string().trim().min(1),
    order: z.coerce.number().int(),
    active: z.boolean(),
  })
  .partial();

/** PATCH /api/categories/[id] (admin) */
export const PATCH = handle(async (request: Request, { params }: Ctx) => {
  await requireUser(['admin']);
  const { id } = await params;
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) throw new HttpError(400, 'Champs invalides');

  const [row] = await db
    .update(missionCategories)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(missionCategories.id, id))
    .returning();
  if (!row) throw new HttpError(404, 'Catégorie introuvable');
  return json({ category: toCategoryClient(row) });
});

/** DELETE /api/categories/[id] (admin) : refusé si des missions l'utilisent (archiver à la place) */
export const DELETE = handle(async (_request: Request, { params }: Ctx) => {
  await requireUser(['admin']);
  const { id } = await params;
  const used = await db.select({ id: missions.id }).from(missions).where(eq(missions.category, id)).limit(1);
  if (used.length > 0) throw new HttpError(409, 'Des missions utilisent cette catégorie : archivez-la plutôt que la supprimer');

  await db.delete(missionCategories).where(eq(missionCategories.id, id));
  return json({ success: true });
});

/** GET /api/categories/[id]?used=true */
export const GET = handle(async (request: Request, { params }: Ctx) => {
  await requireUser();
  const { id } = await params;
  if (new URL(request.url).searchParams.get('used') === 'true') {
    const used = await db.select({ id: missions.id }).from(missions).where(eq(missions.category, id)).limit(1);
    return json({ used: used.length > 0 });
  }
  const row = await db.query.missionCategories.findFirst({ where: eq(missionCategories.id, id) });
  if (!row) throw new HttpError(404, 'Catégorie introuvable');
  return json({ category: toCategoryClient(row) });
});
