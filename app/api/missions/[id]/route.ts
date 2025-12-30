import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db, missions, users } from '@/lib/db';
import { eq } from 'drizzle-orm';

/**
 * GET /api/missions/[id]
 * Récupère une mission par son ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const mission = await db.query.missions.findFirst({
      where: eq(missions.id, id),
    });

    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }

    return NextResponse.json({ mission });
  } catch (error) {
    console.error('Error fetching mission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/missions/[id]
 * Met à jour une mission
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Vérifier que la mission existe
    const existingMission = await db.query.missions.findFirst({
      where: eq(missions.id, id),
    });

    if (!existingMission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }

    // Vérifier les permissions (créateur ou admin)
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (existingMission.createdBy !== userId && user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Mettre à jour la mission
    const [updatedMission] = await db
      .update(missions)
      .set({
        ...body,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        maxVolunteers: body.maxVolunteers ? parseInt(body.maxVolunteers) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(missions.id, id))
      .returning();

    return NextResponse.json({ mission: updatedMission });
  } catch (error) {
    console.error('Error updating mission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/missions/[id]
 * Supprime une mission
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

    // Vérifier que la mission existe
    const existingMission = await db.query.missions.findFirst({
      where: eq(missions.id, id),
    });

    if (!existingMission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }

    // Vérifier les permissions (créateur ou admin)
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (existingMission.createdBy !== userId && user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Supprimer la mission
    await db.delete(missions).where(eq(missions.id, id));

    return NextResponse.json({ message: 'Mission deleted successfully' });
  } catch (error) {
    console.error('Error deleting mission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
