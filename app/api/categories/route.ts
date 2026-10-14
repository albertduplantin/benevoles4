import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, missionCategories } from '@/lib/db';
import { GROUPED_CATEGORIES } from '@/lib/constants/mission-categories';
import { handle, json, requireUser, HttpError } from '@/lib/server/api';
import { toCategoryClient } from '@/lib/server/mappers';

/** Première utilisation : charge les catégories par défaut du festival */
async function seedIfEmpty(createdBy: string) {
  const existing = await db.select({ id: missionCategories.id }).from(missionCategories).limit(1);
  if (existing.length > 0) return;

  const rows = GROUPED_CATEGORIES.flatMap((group) =>
    group.categories.map((category, index) => ({
      id: category.value,
      value: category.value,
      label: category.label,
      group: group.group,
      order: index,
      createdBy,
    }))
  );
  await db.insert(missionCategories).values(rows).onConflictDoNothing();
}

/** GET /api/categories?all=true : catégories actives, ou toutes (archivées incluses) pour le staff */
export const GET = handle(async (request: Request) => {
  const user = await requireUser();
  await seedIfEmpty(user.id);

  const all = new URL(request.url).searchParams.get('all') === 'true';
  if (all && user.role === 'volunteer') throw new HttpError(403, 'Accès refusé');

  const rows = await db
    .select()
    .from(missionCategories)
    .where(all ? undefined : eq(missionCategories.active, true))
    .orderBy(asc(missionCategories.group), asc(missionCategories.order));

  return json({ categories: rows.map(toCategoryClient) });
});

const createSchema = z.object({
  value: z.string().trim().min(1),
  label: z.string().trim().min(1),
  group: z.string().trim().min(1),
  order: z.coerce.number().int().default(0),
});

/** POST /api/categories (admin) : l'id est la valeur, donc unique */
export const POST = handle(async (request: Request) => {
  const user = await requireUser(['admin']);
  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) throw new HttpError(400, 'Champs invalides');

  const [row] = await db
    .insert(missionCategories)
    .values({ id: parsed.data.value, ...parsed.data, createdBy: user.id })
    .onConflictDoNothing()
    .returning();
  if (!row) throw new HttpError(409, 'Une catégorie avec cette valeur existe déjà');

  return json({ category: toCategoryClient(row) }, 201);
});
