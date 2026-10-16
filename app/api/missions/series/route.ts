import { z } from 'zod';
import { db, missions } from '@/lib/db';
import { handle, json, newId, requireUser, HttpError } from '@/lib/server/api';

const schema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  category: z.string().trim().min(1),
  location: z.string().trim().min(1),
  maxVolunteers: z.coerce.number().int().min(1).max(500),
  status: z.enum(['draft', 'published']).default('draft'),
  isUrgent: z.boolean().optional(),
  slots: z
    .array(z.object({ startDate: z.string().datetime(), endDate: z.string().datetime() }))
    .min(1)
    .max(100),
});

/**
 * POST /api/missions/series : crée d'un coup plusieurs créneaux d'une même mission
 * (admin, ou responsable de la catégorie). Les horaires sont calculés dans le navigateur
 * (heure locale) et arrivent en ISO UTC.
 */
export const POST = handle(async (request: Request) => {
  const user = await requireUser(['admin', 'category_responsible']);
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) throw new HttpError(400, 'Champs invalides : vérifiez le titre, le lieu, la catégorie et les créneaux');
  const data = parsed.data;

  if (user.role !== 'admin' && !user.responsibleForCategories.includes(data.category)) {
    throw new HttpError(403, "Vous n'êtes pas responsable de cette catégorie");
  }
  for (const slot of data.slots) {
    if (new Date(slot.endDate) <= new Date(slot.startDate)) throw new HttpError(400, "Un créneau finit avant d'avoir commencé");
  }

  const created = await db
    .insert(missions)
    .values(
      data.slots.map((slot) => ({
        id: newId(),
        title: data.title,
        description: data.description,
        category: data.category,
        type: 'scheduled',
        startDate: new Date(slot.startDate),
        endDate: new Date(slot.endDate),
        location: data.location,
        maxVolunteers: data.maxVolunteers,
        status: data.status,
        isUrgent: data.isUrgent ?? false,
        isRecurrent: true,
        createdBy: user.id,
      }))
    )
    .returning({ id: missions.id });

  return json({ created: created.length, ids: created.map((c) => c.id) }, 201);
});
