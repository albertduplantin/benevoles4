import { asc, eq } from 'drizzle-orm';
import { db, categoryResponsibles } from '@/lib/db';
import { handle, json, requireUser } from '@/lib/server/api';
import { toResponsibleClient } from '@/lib/server/mappers';

export const dynamic = 'force-dynamic';

/** GET /api/my-categories : catégories dont l'utilisateur connecté est responsable */
export const GET = handle(async () => {
  const user = await requireUser();
  const rows = await db
    .select()
    .from(categoryResponsibles)
    .where(eq(categoryResponsibles.responsibleId, user.id))
    .orderBy(asc(categoryResponsibles.categoryLabel));
  return json({ categories: rows.map(toResponsibleClient) });
});
