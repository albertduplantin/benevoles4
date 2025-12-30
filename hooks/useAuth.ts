'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { User } from '@/types';

/**
 * Hook d'authentification compatible Clerk + Firestore
 * Remplace l'ancien useAuth basé sur Firebase Auth
 *
 * Utilise Clerk pour l'authentification et Firestore pour les données utilisateur
 */
export function useAuth() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (clerkUserId: string) => {
    try {
      console.log('Fetching user data for:', clerkUserId);
      const userDoc = await getDoc(doc(db, 'users', clerkUserId));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        console.log('User data found:', userData);
        setUser(userData);
      } else {
        // L'utilisateur existe dans Clerk mais pas dans Firestore
        // Cela peut arriver juste après l'inscription
        console.log('User document does not exist in Firestore');
        setUser(null);
      }
    } catch (error: any) {
      console.error('Error fetching user data from Firestore:', error);
      // En cas d'erreur offline, on ne bloque pas l'application
      // L'utilisateur pourra toujours compléter son profil
      if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
        console.warn('Firestore is offline, will retry when online');
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (clerkUser?.id) {
      setLoading(true);
      await fetchUserData(clerkUser.id);
    }
  };

  useEffect(() => {
    if (!clerkLoaded) {
      setLoading(true);
      return;
    }

    if (clerkUser?.id) {
      fetchUserData(clerkUser.id);
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [clerkUser, clerkLoaded]);

  return {
    user,
    firebaseUser: clerkUser, // Pour compatibilité avec l'ancien code
    loading: !clerkLoaded || loading,
    refreshUser,
    // Propriétés Clerk supplémentaires
    clerkUser,
    isSignedIn: !!clerkUser,
  };
}
