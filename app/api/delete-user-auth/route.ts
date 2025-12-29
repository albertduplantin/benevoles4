import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

/**
 * API Route pour supprimer un utilisateur de Firebase Authentication
 * Nécessite les droits admin
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId est requis' },
        { status: 400 }
      );
    }

    // Supprimer l'utilisateur de Firebase Auth
    try {
      await adminAuth.deleteUser(userId);
      
      return NextResponse.json({
        success: true,
        message: 'Utilisateur supprimé de Firebase Auth',
      });
    } catch (authError: any) {
      // Si l'utilisateur n'existe pas dans Auth (déjà supprimé ou jamais créé), ce n'est pas grave
      if (authError.code === 'auth/user-not-found') {
        return NextResponse.json({
          success: true,
          message: 'Utilisateur déjà supprimé de Firebase Auth',
        });
      }
      throw authError;
    }
  } catch (error: any) {
    console.error('Error deleting user from Auth:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}











