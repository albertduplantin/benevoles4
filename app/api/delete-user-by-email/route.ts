import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

/**
 * API Route pour supprimer un utilisateur de Firebase Authentication par email
 * Utile pour nettoyer les comptes orphelins
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'email est requis' },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur par email
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(email);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json({
          success: true,
          message: 'Aucun compte trouvé avec cet email dans Firebase Auth',
        });
      }
      throw error;
    }

    // Supprimer l'utilisateur
    await adminAuth.deleteUser(userRecord.uid);
    
    return NextResponse.json({
      success: true,
      message: `Compte supprimé : ${email} (UID: ${userRecord.uid})`,
      uid: userRecord.uid,
    });
  } catch (error: any) {
    console.error('Error deleting user by email:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}











