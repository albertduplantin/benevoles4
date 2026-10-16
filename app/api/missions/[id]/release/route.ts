import { after } from 'next/server';
import { handle, json, requireUser } from '@/lib/server/api';
import { toMissionClient } from '@/lib/server/mappers';
import { notifyRelease, releaseVolunteer } from '@/lib/server/release';

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/missions/[id]/release : « Je ne peux plus venir ».
 * Libère la place (même à moins de 24 h), prévient les responsables et, s'il reste des places,
 * lance un appel aux bénévoles disponibles.
 */
export const POST = handle(async (_request: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  const result = await releaseVolunteer(id, user.id);
  after(() =>
    notifyRelease({ mission: result.mission, userId: user.id, promoted: result.promoted, urgent: result.urgent, spotsLeft: result.spotsLeft }).catch(
      (e) => console.error('Release notification error:', e)
    )
  );
  return json({ mission: toMissionClient(result.mission), urgent: result.urgent, spotsLeft: result.spotsLeft });
});
