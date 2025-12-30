import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { User } from '@/types';

/**
 * Synchronise un utilisateur Clerk avec Firestore
 * Crée ou met à jour le document utilisateur dans Firestore
 */
export async function syncUserToFirestore(clerkUserId: string, userData: {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}) {
  try {
    const userRef = doc(db, 'users', clerkUserId);

    // Utiliser merge: true pour créer ou mettre à jour le document
    // Cela évite de devoir faire un getDoc qui peut échouer en mode offline
    const userUpdate: Partial<User> = {
      uid: clerkUserId,
      email: userData.email,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      phone: userData.phone || '',
      updatedAt: serverTimestamp() as any,
    };

    // Ajouter createdAt seulement si c'est une nouvelle création
    // (merge: true ne l'écrasera pas s'il existe déjà)
    const userWithCreation = {
      ...userUpdate,
      role: 'volunteer',
      createdAt: serverTimestamp() as any,
    };

    await setDoc(userRef, userWithCreation, { merge: true });
    console.log('✅ User synced to Firestore:', clerkUserId);
    return userUpdate;
  } catch (error) {
    console.error('❌ Error syncing user to Firestore:', error);
    throw error;
  }
}
