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
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Créer un nouveau document utilisateur
      const newUser: Partial<User> = {
        uid: clerkUserId,
        email: userData.email,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phone: userData.phone || '',
        role: 'volunteer', // Rôle par défaut
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };

      await setDoc(userRef, newUser);
      console.log('✅ User synced to Firestore:', clerkUserId);
      return newUser;
    } else {
      // Mettre à jour les données existantes
      const updates = {
        email: userData.email,
        ...(userData.firstName && { firstName: userData.firstName }),
        ...(userData.lastName && { lastName: userData.lastName }),
        ...(userData.phone && { phone: userData.phone }),
        updatedAt: serverTimestamp(),
      };

      await setDoc(userRef, updates, { merge: true });
      console.log('✅ User updated in Firestore:', clerkUserId);
      return { ...userDoc.data(), ...updates } as User;
    }
  } catch (error) {
    console.error('❌ Error syncing user to Firestore:', error);
    throw error;
  }
}
