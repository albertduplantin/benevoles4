import { z } from 'zod';
import { db, adminSettings } from '@/lib/db';
import { handle, json, requireUser, HttpError } from '@/lib/server/api';
import { getSettings } from '@/lib/server/missions';

/** GET /api/settings : paramètres globaux (lisibles par tout utilisateur connecté, ex. inscriptions fermées) */
export const GET = handle(async () => {
  await requireUser();
  return json({ settings: await getSettings() });
});

const schema = z
  .object({
    autoApproveResponsibility: z.boolean(),
    festivalStartDate: z.string().datetime().nullable(),
    festivalEndDate: z.string().datetime().nullable(),
    registrationsBlocked: z.boolean(),
    registrationBlockedMessage: z.string(),
  })
  .partial();

/** PUT /api/settings (admin) */
export const PUT = handle(async (request: Request) => {
  const admin = await requireUser(['admin']);
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) throw new HttpError(400, 'Champs invalides');
  const { festivalStartDate, festivalEndDate, ...rest } = parsed.data;

  const values = {
    ...rest,
    ...(festivalStartDate !== undefined && { festivalStartDate: festivalStartDate ? new Date(festivalStartDate) : null }),
    ...(festivalEndDate !== undefined && { festivalEndDate: festivalEndDate ? new Date(festivalEndDate) : null }),
    updatedAt: new Date(),
    updatedBy: admin.id,
  };

  await db
    .insert(adminSettings)
    .values({ id: 'admin', ...values })
    .onConflictDoUpdate({ target: adminSettings.id, set: values });

  return json({ settings: await getSettings() });
});
