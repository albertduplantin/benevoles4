import { desc, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db, missions } from '@/lib/db';
import { handle, json, newId, requireUser, HttpError } from '@/lib/server/api';
import { toMissionClient } from '@/lib/server/mappers';

/**
 * GET /api/missions?scope=all|published|visible|mine&userId=
 * - published : missions publiées (urgentes en premier)
 * - visible   : publiées + complètes
 * - all       : toutes (staff uniquement)
 * - mine      : missions où l'utilisateur est inscrit (userId réservé au staff)
 */
export const GET = handle(async (request: Request) => {
  const user = await requireUser();
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope') ?? 'published';

  let rows;
  if (scope === 'mine') {
    const target = searchParams.get('userId') ?? user.id;
    if (target !== user.id && user.role === 'volunteer') throw new HttpError(403, 'Accès refusé');
    rows = await db
      .select()
      .from(missions)
      .where(sql`${target} = ANY(${missions.volunteers})`)
      .orderBy(sql`${missions.startDate} ASC NULLS LAST`);
  } else if (scope === 'all') {
    if (user.role === 'volunteer') throw new HttpError(403, 'Accès refusé');
    rows = await db.select().from(missions).orderBy(desc(missions.createdAt));
  } else {
    const statuses = scope === 'visible' ? ['published', 'full'] : ['published'];
    rows = await db
      .select()
      .from(missions)
      .where(inArray(missions.status, statuses))
      .orderBy(desc(missions.isUrgent), desc(missions.createdAt));
  }

  return json({ missions: rows.map(toMissionClient) });
});

const createSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  category: z.string().trim().min(1),
  type: z.enum(['scheduled', 'ongoing']),
  startDate: z.string().datetime().nullish(),
  endDate: z.string().datetime().nullish(),
  location: z.string().trim().min(1),
  maxVolunteers: z.coerce.number().int().min(1),
  isUrgent: z.boolean().optional(),
  isRecurrent: z.boolean().optional(),
  status: z.enum(['draft', 'published']).optional(),
});

/** POST /api/missions : création (admin, ou responsable de la catégorie) */
export const POST = handle(async (request: Request) => {
  const user = await requireUser(['admin', 'category_responsible']);
  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) throw new HttpError(400, 'Champs invalides ou manquants');
  const data = parsed.data;

  if (user.role !== 'admin' && !user.responsibleForCategories.includes(data.category)) {
    throw new HttpError(403, "Vous n'êtes pas responsable de cette catégorie");
  }

  const [mission] = await db
    .insert(missions)
    .values({
      id: newId(),
      title: data.title,
      description: data.description,
      category: data.category,
      type: data.type,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      location: data.location,
      maxVolunteers: data.maxVolunteers,
      status: data.status ?? 'draft',
      isUrgent: data.isUrgent ?? false,
      isRecurrent: data.isRecurrent ?? false,
      createdBy: user.id,
    })
    .returning();

  return json({ mission: toMissionClient(mission) }, 201);
});
