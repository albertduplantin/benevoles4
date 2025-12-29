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
      const userDoc = await getDoc(doc(db, 'users', clerkUserId));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        setUser(userData);
      } else {
        // L'utilisateur existe dans Clerk mais pas dans Firestore
        // Cela peut arriver juste après l'inscription
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user data from Firestore:', error);
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
