import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db, missions } from '@/lib/db';
import { eq } from 'drizzle-orm';

/**
 * POST /api/missions/[id]/register
 * Inscrit un bénévole à une mission
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Récupérer la mission
    const mission = await db.query.missions.findFirst({
      where: eq(missions.id, id),
    });

    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }

    // Vérifier que l'utilisateur n'est pas déjà inscrit
    if (mission.volunteers?.includes(userId)) {
      return NextResponse.json(
        { error: 'Already registered' },
        { status: 400 }
      );
    }

    // Vérifier s'il y a de la place
    const currentVolunteers = mission.volunteers || [];
    if (currentVolunteers.length >= mission.maxVolunteers) {
      // Ajouter à la liste d'attente
      const currentWaitlist = mission.waitlist || [];
      if (currentWaitlist.includes(userId)) {
        return NextResponse.json(
          { error: 'Already on waitlist' },
          { status: 400 }
        );
      }

      const [updatedMission] = await db
        .update(missions)
        .set({
          waitlist: [...currentWaitlist, userId],
          updatedAt: new Date(),
        })
        .where(eq(missions.id, id))
        .returning();

      return NextResponse.json({
        message: 'Added to waitlist',
        mission: updatedMission,
        onWaitlist: true,
      });
    }

    // Ajouter à la liste des bénévoles
    const [updatedMission] = await db
      .update(missions)
      .set({
        volunteers: [...currentVolunteers, userId],
        status: currentVolunteers.length + 1 >= mission.maxVolunteers ? 'full' : mission.status,
        updatedAt: new Date(),
      })
      .where(eq(missions.id, id))
      .returning();

    return NextResponse.json({
      message: 'Registered successfully',
      mission: updatedMission,
    });
  } catch (error) {
    console.error('Error registering to mission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/missions/[id]/register
 * Désinscrit un bénévole d'une mission
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Récupérer la mission
    const mission = await db.query.missions.findFirst({
      where: eq(missions.id, id),
    });

    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }

    // Retirer de la liste des bénévoles
    const currentVolunteers = mission.volunteers || [];
    const newVolunteers = currentVolunteers.filter((id: string) => id !== userId);

    // Si l'utilisateur était inscrit et qu'il y a une liste d'attente, promouvoir le premier
    let newWaitlist = mission.waitlist || [];
    if (currentVolunteers.includes(userId) && newWaitlist.length > 0) {
      const nextVolunteer = newWaitlist[0];
      newVolunteers.push(nextVolunteer);
      newWaitlist = newWaitlist.slice(1);
    } else {
      // Sinon, retirer de la liste d'attente si présent
      newWaitlist = newWaitlist.filter((id: string) => id !== userId);
    }

    const [updatedMission] = await db
      .update(missions)
      .set({
        volunteers: newVolunteers,
        waitlist: newWaitlist,
        status: newVolunteers.length < mission.maxVolunteers ? 'published' : 'full',
        updatedAt: new Date(),
      })
      .where(eq(missions.id, id))
      .returning();

    return NextResponse.json({
      message: 'Unregistered successfully',
      mission: updatedMission,
    });
  } catch (error) {
    console.error('Error unregistering from mission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
