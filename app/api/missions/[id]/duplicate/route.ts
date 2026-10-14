import { db, missions } from '@/lib/db';
import { handle, json, newId, requireUser, HttpError } from '@/lib/server/api';
import { toMissionClient } from '@/lib/server/mappers';
import { getMission } from '@/lib/server/missions';

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/missions/[id]/duplicate : copie la mission en brouillon, sans inscrits */
export const POST = handle(async (_request: Request, { params }: Ctx) => {
  const user = await requireUser(['admin', 'category_responsible']);
  const { id } = await params;
  const original = await getMission(id);
  if (user.role !== 'admin' && !user.responsibleForCategories.includes(original.category)) {
    throw new HttpError(403, 'Accès refusé');
  }

  const [copy] = await db
    .insert(missions)
    .values({
      id: newId(),
      title: `${original.title} (Copie)`,
      description: original.description,
      category: original.category,
      type: original.type,
      startDate: original.startDate,
      endDate: original.endDate,
      location: original.location,
      maxVolunteers: original.maxVolunteers,
      isUrgent: original.isUrgent,
      isRecurrent: original.isRecurrent,
      status: 'draft',
      createdBy: user.id,
    })
    .returning();

  return json({ mission: toMissionClient(copy) }, 201);
});
