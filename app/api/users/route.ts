import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, users } from '@/lib/db';
import { handle, json, newId, requireUser, HttpError } from '@/lib/server/api';
import { toUserClient } from '@/lib/server/mappers';
import { generatePersonalToken } from '@/lib/utils/token';

/** GET /api/users?emailOnly=true : liste des utilisateurs (staff ; jeton personnel visible des admins seulement) */
export const GET = handle(async (request: Request) => {
  const user = await requireUser(['admin', 'category_responsible']);
  const emailOnly = new URL(request.url).searchParams.get('emailOnly') === 'true';

  const rows = emailOnly
    ? await db.select().from(users).where(eq(users.emailOnly, true)).orderBy(desc(users.createdAt))
    : await db.select().from(users).orderBy(desc(users.createdAt));

  return json({ users: rows.map((row) => toUserClient(row, { includeToken: user.role === 'admin' })) });
});

const createSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  phone: z.string().trim().optional(),
  emailOnly: z.boolean().optional(),
});

/**
 * POST /api/users : un admin crée un bénévole.
 * Il pourra se connecter ensuite avec Google ou un lien magique sur cet email,
 * ou suivre ses missions via son lien personnel s'il est "email-only".
 */
export const POST = handle(async (request: Request) => {
  await requireUser(['admin']);
  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) throw new HttpError(400, 'Champs obligatoires manquants ou invalides');
  const { email, firstName, lastName, phone, emailOnly } = parsed.data;

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) throw new HttpError(409, 'Un utilisateur avec cet email existe déjà');

  const personalToken = emailOnly ? generatePersonalToken() : null;
  const [created] = await db
    .insert(users)
    .values({
      id: newId(),
      email,
      firstName,
      lastName,
      phone: phone ?? '',
      name: `${firstName} ${lastName}`,
      role: 'volunteer',
      emailOnly: emailOnly ?? false,
      personalToken,
      dataProcessingConsent: true,
      communicationsConsent: true,
      consentDate: new Date(),
    })
    .returning();

  return json({ userId: created.id, token: personalToken ?? undefined }, 201);
});
