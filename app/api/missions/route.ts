import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db, missions } from '@/lib/db';
import { eq, and, or, gte, lte } from 'drizzle-orm';

/**
 * GET /api/missions
 * Récupère toutes les missions (filtrées selon le rôle)
 */
export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const myMissions = searchParams.get('my') === 'true';

    let query = db.select().from(missions);

    // Filtrer par statut si spécifié
    if (status) {
      query = query.where(eq(missions.status, status)) as any;
    }

    // Filtrer mes missions (où je suis inscrit)
    if (myMissions) {
      // TODO: Implémenter le filtre des missions où l'utilisateur est inscrit
      // Pour l'instant, retourner toutes les missions
    }

    const allMissions = await query;

    return NextResponse.json({ missions: allMissions });
  } catch (error) {
    console.error('Error fetching missions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/missions
 * Crée une nouvelle mission
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      category,
      type,
      startDate,
      endDate,
      location,
      maxVolunteers,
      isUrgent,
      isRecurrent,
    } = body;

    // Validation
    if (!title || !description || !category || !type || !location || !maxVolunteers) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Générer un ID unique
    const missionId = `mission_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Créer la mission
    const [newMission] = await db
      .insert(missions)
      .values({
        id: missionId,
        title,
        description,
        category,
        type,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        location,
        maxVolunteers: parseInt(maxVolunteers),
        status: 'draft',
        isUrgent: isUrgent || false,
        isRecurrent: isRecurrent || false,
        createdBy: userId,
        volunteers: [],
        waitlist: [],
      })
      .returning();

    return NextResponse.json({ mission: newMission }, { status: 201 });
  } catch (error) {
    console.error('Error creating mission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
