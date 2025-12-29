import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { COLLECTIONS } from './collections';
import { VolunteerPreferences } from '@/types';

/**
 * Mettre à jour les préférences d'un bénévole
 */
export async function updateVolunteerPreferences(
  userId: string,
  preferences: VolunteerPreferences
): Promise<void> {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    
    await updateDoc(userRef, {
      preferences,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating volunteer preferences:', error);
    throw new Error('Erreur lors de la mise à jour des préférences');
  }
}











