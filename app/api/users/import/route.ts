import { inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db, users } from '@/lib/db';
import { handle, json, newId, requireUser, HttpError } from '@/lib/server/api';

const rowSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().optional(),
});
const bodySchema = z.object({ rows: z.array(z.unknown()).min(1).max(1000) });

/**
 * POST /api/users/import (admin) : crée les bénévoles d'une liste (CSV/Excel lue côté navigateur).
 * Les adresses déjà connues sont ignorées. Les liens de connexion s'envoient ensuite un par un
 * (POST /api/users/[id]/invite) pour rester sous les limites de temps et d'envoi.
 */
export const POST = handle(async (request: Request) => {
  await requireUser(['admin']);
  const body = bodySchema.safeParse(await request.json());
  if (!body.success) throw new HttpError(400, 'Liste vide ou trop longue (1000 lignes maximum)');

  const valid: z.infer<typeof rowSchema>[] = [];
  const invalid: { line: number; reason: string }[] = [];
  const seen = new Set<string>();
  body.data.rows.forEach((raw, index) => {
    const parsed = rowSchema.safeParse(raw);
    if (!parsed.success) return invalid.push({ line: index + 1, reason: 'Nom, prénom ou email manquant ou incorrect' });
    if (seen.has(parsed.data.email)) return invalid.push({ line: index + 1, reason: 'Adresse en double dans la liste' });
    seen.add(parsed.data.email);
    valid.push(parsed.data);
  });

  const existing = valid.length
    ? await db.select({ email: users.email }).from(users).where(inArray(sql`lower(${users.email})`, valid.map((v) => v.email)))
    : [];
  const known = new Set(existing.map((e) => e.email.toLowerCase()));
  const toCreate = valid.filter((v) => !known.has(v.email));

  const created = toCreate.length
    ? await db
        .insert(users)
        .values(
          toCreate.map((v) => ({
            id: newId(),
            email: v.email,
            firstName: v.firstName,
            lastName: v.lastName,
            phone: v.phone ?? '',
            name: `${v.firstName} ${v.lastName}`,
            role: 'volunteer',
            dataProcessingConsent: true,
            communicationsConsent: true,
            consentDate: new Date(),
          }))
        )
        .returning({ id: users.id, email: users.email })
    : [];

  return json({
    created,
    skippedExisting: valid.length - toCreate.length,
    invalid,
  });
});
