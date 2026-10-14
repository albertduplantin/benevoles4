import { and, asc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db, users, categoryResponsibles, missionCategories } from '@/lib/db';
import { handle, json, newId, requireUser, HttpError } from '@/lib/server/api';
import { toResponsibleClient, toUserClient } from '@/lib/server/mappers';

/**
 * GET /api/category-responsibles
 * - ?userId= : affectations d'un utilisateur (soi-même, ou le staff)
 * - ?categoryId= : responsables d'une catégorie (staff)
 * - sinon (admin) : toutes les affectations + bénévoles/responsables assignables
 */
export const GET = handle(async (request: Request) => {
  const caller = await requireUser();
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const categoryId = searchParams.get('categoryId');

  if (userId) {
    if (userId !== caller.id && caller.role === 'volunteer') throw new HttpError(403, 'Accès refusé');
    const rows = await db
      .select()
      .from(categoryResponsibles)
      .where(eq(categoryResponsibles.responsibleId, userId))
      .orderBy(asc(categoryResponsibles.categoryLabel));
    return json({ assignments: rows.map(toResponsibleClient) });
  }

  // Les coordonnées des responsables d'une catégorie sont visibles de tous les bénévoles connectés
  if (categoryId) {
    const rows = await db
      .select({ assignment: categoryResponsibles, user: users })
      .from(categoryResponsibles)
      .innerJoin(users, eq(users.id, categoryResponsibles.responsibleId))
      .where(eq(categoryResponsibles.categoryId, categoryId));
    return json({
      assignments: rows.map((r) => toResponsibleClient(r.assignment)),
      users: rows.map((r) => ({
        ...toUserClient(r.user),
        // Pas de données sensibles pour un simple bénévole : uniquement de quoi contacter le responsable
        ...(caller.role === 'volunteer' && { preferences: undefined, fcmTokens: undefined, notificationSettings: undefined }),
      })),
    });
  }

  if (caller.role !== 'admin') throw new HttpError(403, 'Accès refusé');

  const [assignments, people] = await Promise.all([
    db.select().from(categoryResponsibles).orderBy(asc(categoryResponsibles.categoryLabel)),
    db.select().from(users).where(inArray(users.role, ['volunteer', 'category_responsible'])),
  ]);
  return json({
    assignments: assignments.map(toResponsibleClient),
    volunteers: people.map((p) => toUserClient(p)),
  });
});

const assignSchema = z.object({
  categoryId: z.string().min(1),
  responsibleId: z.string().min(1),
});

/** POST : nomme un responsable de catégorie (admin) */
export const POST = handle(async (request: Request) => {
  const admin = await requireUser(['admin']);
  const parsed = assignSchema.safeParse(await request.json());
  if (!parsed.success) throw new HttpError(400, 'Champs manquants');
  const { categoryId, responsibleId } = parsed.data;

  const category = await db.query.missionCategories.findFirst({ where: eq(missionCategories.id, categoryId) });
  if (!category) throw new HttpError(404, 'Catégorie introuvable');
  const person = await db.query.users.findFirst({ where: eq(users.id, responsibleId) });
  if (!person) throw new HttpError(404, 'Utilisateur introuvable');

  const existing = await db
    .select({ id: categoryResponsibles.id })
    .from(categoryResponsibles)
    .where(and(eq(categoryResponsibles.categoryId, categoryId), eq(categoryResponsibles.responsibleId, responsibleId)))
    .limit(1);
  if (existing.length > 0) throw new HttpError(409, 'Cet utilisateur est déjà responsable de cette catégorie.');

  const id = newId();
  await db.insert(categoryResponsibles).values({
    id,
    categoryId,
    categoryLabel: category.label,
    responsibleId,
    assignedBy: admin.id,
  });

  // Un admin le reste ; sinon l'utilisateur devient responsable de catégorie
  const categories = [...new Set([...(person.responsibleForCategories ?? []), categoryId])];
  await db
    .update(users)
    .set({
      role: person.role === 'admin' ? 'admin' : 'category_responsible',
      responsibleForCategories: categories,
      updatedAt: new Date(),
    })
    .where(eq(users.id, responsibleId));

  return json({ success: true, id }, 201);
});

/** DELETE ?categoryId=&responsibleId= : retire un responsable (admin) */
export const DELETE = handle(async (request: Request) => {
  await requireUser(['admin']);
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('categoryId');
  const responsibleId = searchParams.get('responsibleId');
  if (!categoryId || !responsibleId) throw new HttpError(400, 'categoryId et responsibleId requis');

  const removed = await db
    .delete(categoryResponsibles)
    .where(and(eq(categoryResponsibles.categoryId, categoryId), eq(categoryResponsibles.responsibleId, responsibleId)))
    .returning({ id: categoryResponsibles.id });
  if (removed.length === 0) throw new HttpError(404, 'Aucun responsable trouvé pour cette catégorie');

  const person = await db.query.users.findFirst({ where: eq(users.id, responsibleId) });
  if (person) {
    const categories = (person.responsibleForCategories ?? []).filter((c) => c !== categoryId);
    await db
      .update(users)
      .set({
        role: person.role === 'admin' ? 'admin' : categories.length > 0 ? 'category_responsible' : 'volunteer',
        responsibleForCategories: categories,
        updatedAt: new Date(),
      })
      .where(eq(users.id, responsibleId));
  }

  return json({ success: true });
});
