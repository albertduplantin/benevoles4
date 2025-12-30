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
  const [firestoreError, setFirestoreError] = useState(false);

  const fetchUserData = async (clerkUserId: string) => {
    // Timeout de 5 secondes pour éviter de bloquer indéfiniment
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore timeout')), 5000)
    );

    try {
      console.log('Fetching user data for:', clerkUserId);

      // Race entre le fetch et le timeout
      const userDoc = await Promise.race([
        getDoc(doc(db, 'users', clerkUserId)),
        timeoutPromise
      ]) as any;

      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        console.log('User data found:', userData);
        setUser(userData);
        setFirestoreError(false);
      } else {
        // L'utilisateur existe dans Clerk mais pas dans Firestore
        // Cela peut arriver juste après l'inscription
        console.log('User document does not exist in Firestore');
        setUser(null);
        setFirestoreError(false);
      }
    } catch (error: any) {
      console.error('Error fetching user data from Firestore:', error);
      setFirestoreError(true);

      // En cas d'erreur offline ou timeout, on ne bloque pas l'application
      // L'utilisateur pourra toujours compléter son profil
      if (error?.code === 'unavailable' || error?.message?.includes('offline') || error?.message?.includes('timeout')) {
        console.warn('Firestore is offline or timeout, continuing without user data');
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
    firestoreError, // Indique si Firestore est inaccessible
  };
}
