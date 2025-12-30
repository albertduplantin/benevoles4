import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';

/**
 * POST /api/users/sync
 * Synchronise l'utilisateur Clerk avec la base de données Neon
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, phone } = body;

    if (!firstName || !lastName || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Récupérer l'email depuis Clerk
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const email = clerkUser.emailAddresses?.[0]?.emailAddress;

    if (!email) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (existingUser) {
      // Mettre à jour l'utilisateur existant
      await db
        .update(users)
        .set({
          firstName,
          lastName,
          phone,
          email,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return NextResponse.json({ message: 'User updated', user: existingUser });
    } else {
      // Créer un nouvel utilisateur
      const [newUser] = await db
        .insert(users)
        .values({
          id: userId,
          email,
          firstName,
          lastName,
          phone,
          role: 'volunteer',
          dataProcessingConsent: true,
          communicationsConsent: false,
          consentDate: new Date(),
        })
        .returning();

      return NextResponse.json({ message: 'User created', user: newUser });
    }
  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
