import { eq } from 'drizzle-orm';
import { db, users } from '@/lib/db';
import { signIn, emailLoginEnabled, EMAIL_PROVIDER_ID } from '@/auth';
import { handle, json, requireUser, HttpError } from '@/lib/server/api';

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/users/[id]/invite (admin) : envoie à un bénévole son lien de connexion par email.
 * Pratique pour accompagner les personnes peu à l'aise avec l'informatique : l'admin déclenche
 * l'envoi, le bénévole n'a plus qu'à cliquer sur le bouton de l'email.
 */
export const POST = handle(async (_request: Request, { params }: Ctx) => {
  await requireUser(['admin']);
  if (!emailLoginEnabled) throw new HttpError(503, "L'envoi d'emails n'est pas encore configuré");

  const { id } = await params;
  const volunteer = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!volunteer?.email) throw new HttpError(404, 'Bénévole introuvable ou sans adresse email');

  await signIn(EMAIL_PROVIDER_ID, { email: volunteer.email, redirect: false });
  return json({ success: true, email: volunteer.email });
});
