import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db, users, missions } from '@/lib/db';
import { after } from 'next/server';
import { handle, json, requireUser, HttpError } from '@/lib/server/api';
import { getMission, notifyPromoted, rebalance } from '@/lib/server/missions';
import { toUserClient } from '@/lib/server/mappers';
import { generatePersonalToken } from '@/lib/utils/token';

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/users/[id] : soi-même, ou le staff */
export const GET = handle(async (_request: Request, { params }: Ctx) => {
  const caller = await requireUser();
  const { id } = await params;

  const row = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!row) throw new HttpError(404, 'Utilisateur introuvable');

  const user = toUserClient(row, { includeToken: caller.role === 'admin' });
  if (id !== caller.id && caller.role === 'volunteer') {
    // Un bénévole ne voit des autres que leur nom (liste des participants d'une mission)
    return json({
      user: {
        ...user,
        email: '',
        phone: '',
        preferences: undefined,
        fcmTokens: undefined,
        notificationSettings: undefined,
        notificationPreferences: undefined,
      },
    });
  }
  return json({ user });
});

// Champs modifiables par l'utilisateur lui-même
const selfSchema = z
  .object({
    firstName: z.string().trim().min(1),
    lastName: z.string().trim().min(1),
    phone: z.string().trim(),
    photoURL: z.string().url(),
    communications: z.boolean(),
    notificationPreferences: z.object({ email: z.boolean(), sms: z.boolean() }).partial(),
    preferences: z.record(z.string(), z.unknown()),
    notificationSettings: z.record(z.string(), z.unknown()),
    addFcmToken: z.string().min(1),
    removeFcmToken: z.string().min(1),
  })
  .partial();

// Champs réservés aux administrateurs
const adminSchema = z
  .object({
    email: z.string().trim().toLowerCase().email(),
    role: z.enum(['volunteer', 'category_responsible', 'admin']),
    emailOnly: z.boolean(),
    regenerateToken: z.boolean(),
  })
  .partial();

/**
 * PATCH /api/users/[id]
 * Le profil se modifie soi-même ; l'admin peut modifier tout le monde (rôle, email, mode email-only).
 */
export const PATCH = handle(async (request: Request, { params }: Ctx) => {
  const caller = await requireUser();
  const { id } = await params;
  const isAdmin = caller.role === 'admin';
  if (id !== caller.id && !isAdmin) throw new HttpError(403, 'Accès refusé');

  const body = await request.json();
  const self = selfSchema.safeParse(body);
  const adm = adminSchema.safeParse(body);
  if (!self.success || !adm.success) throw new HttpError(400, 'Champs invalides');
  if (!isAdmin && Object.values(adm.data).some((v) => v !== undefined)) throw new HttpError(403, 'Accès refusé');

  const s = self.data;
  const a = adm.data;
  const current = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!current) throw new HttpError(404, 'Utilisateur introuvable');

  // Un admin ne peut pas se retirer son propre rôle (risque de verrouiller l'application)
  if (a.role && id === caller.id && a.role !== 'admin') {
    throw new HttpError(400, 'Vous ne pouvez pas retirer votre propre rôle administrateur');
  }

  const update: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };
  if (s.firstName !== undefined) update.firstName = s.firstName;
  if (s.lastName !== undefined) update.lastName = s.lastName;
  if (s.phone !== undefined) update.phone = s.phone;
  if (s.photoURL !== undefined) update.photoURL = s.photoURL;
  if (s.firstName !== undefined || s.lastName !== undefined) {
    update.name = `${s.firstName ?? current.firstName} ${s.lastName ?? current.lastName}`.trim();
  }
  if (s.communications !== undefined) update.communicationsConsent = s.communications;
  if (s.notificationPreferences?.email !== undefined) update.emailNotifications = s.notificationPreferences.email;
  if (s.notificationPreferences?.sms !== undefined) update.smsNotifications = s.notificationPreferences.sms;
  if (s.preferences !== undefined) update.preferences = s.preferences;
  if (s.notificationSettings !== undefined) {
    update.notificationSettings = { ...(current.notificationSettings as object | null), ...s.notificationSettings };
  }
  if (s.addFcmToken) update.fcmTokens = [...new Set([...(current.fcmTokens ?? []), s.addFcmToken])];
  if (s.removeFcmToken) update.fcmTokens = (current.fcmTokens ?? []).filter((t) => t !== s.removeFcmToken);

  if (a.email !== undefined) update.email = a.email;
  if (a.role !== undefined) update.role = a.role;
  if (a.emailOnly === true) {
    update.emailOnly = true;
    update.personalToken = current.personalToken ?? generatePersonalToken();
  } else if (a.emailOnly === false) {
    update.emailOnly = false;
    update.personalToken = null;
  }
  if (a.regenerateToken) {
    if (!(update.emailOnly ?? current.emailOnly)) throw new HttpError(400, "Cet utilisateur n'est pas en mode email-only");
    update.personalToken = generatePersonalToken();
  }

  const [row] = await db.update(users).set(update).where(eq(users.id, id)).returning();
  return json({ user: toUserClient(row, { includeToken: isAdmin }) });
});

/** DELETE /api/users/[id] : supprime un bénévole et le retire de ses missions (admin) */
export const DELETE = handle(async (_request: Request, { params }: Ctx) => {
  const caller = await requireUser(['admin']);
  const { id } = await params;
  if (id === caller.id) throw new HttpError(400, 'Vous ne pouvez pas supprimer votre propre compte');

  const affected = await db
    .select({ id: missions.id })
    .from(missions)
    .where(sql`${id} = ANY(${missions.volunteers})`);

  await db
    .update(missions)
    .set({
      volunteers: sql`array_remove(${missions.volunteers}, ${id})`,
      waitlist: sql`array_remove(${missions.waitlist}, ${id})`,
      responsibles: sql`array_remove(${missions.responsibles}, ${id})`,
      pendingResponsibles: sql`array_remove(${missions.pendingResponsibles}, ${id})`,
    })
    .where(sql`${id} = ANY(${missions.volunteers}) OR ${id} = ANY(${missions.waitlist}) OR ${id} = ANY(${missions.responsibles}) OR ${id} = ANY(${missions.pendingResponsibles})`);

  // Les missions créées par cet utilisateur sont réattribuées à l'admin qui le supprime
  await db.update(missions).set({ createdBy: caller.id }).where(eq(missions.createdBy, id));

  await db.delete(users).where(eq(users.id, id));

  // Les places libérées profitent aux bénévoles en liste d'attente
  after(async () => {
    for (const { id: missionId } of affected) {
      const promoted = await rebalance(missionId);
      if (promoted.length) await notifyPromoted(await getMission(missionId), promoted).catch(() => {});
    }
  });
  return json({ success: true });
});
