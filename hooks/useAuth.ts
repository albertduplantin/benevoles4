'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

// Type simplifié pour les données utilisateur
export interface UserMetadata {
  firstName: string;
  lastName: string;
  phone: string;
  role: 'volunteer' | 'category_responsible' | 'admin';
}

/**
 * Hook d'authentification utilisant uniquement Clerk
 * Les données utilisateur (firstName, lastName, phone, role) sont stockées dans Clerk metadata
 */
export function useAuth() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clerkLoaded) {
      setLoading(false);
    }
  }, [clerkLoaded]);

  // Récupérer les métadonnées depuis Clerk
  const metadata = clerkUser?.publicMetadata as UserMetadata | undefined;

  // Créer un objet user compatible avec l'ancien format
  const user = clerkUser ? {
    ...clerkUser,
    role: metadata?.role || 'volunteer',
    firstName: clerkUser.firstName || metadata?.firstName || '',
    lastName: clerkUser.lastName || metadata?.lastName || '',
    phone: clerkUser.phoneNumbers?.[0]?.phoneNumber || metadata?.phone || '',
    responsibleForCategories: (metadata as any)?.responsibleForCategories || [],
  } : null;

  const refreshUser = async () => {
    // Clerk se met à jour automatiquement, pas besoin de refresh manuel
    return Promise.resolve();
  };

  return {
    // Utilisateur Clerk
    clerkUser,
    user: user as any, // Compatible avec l'ancien format
    isSignedIn: !!clerkUser,
    loading: !clerkLoaded || loading,
    refreshUser, // Pour compatibilité

    // Métadonnées utilisateur depuis Clerk
    firstName: clerkUser?.firstName || metadata?.firstName || '',
    lastName: clerkUser?.lastName || metadata?.lastName || '',
    phone: clerkUser?.phoneNumbers?.[0]?.phoneNumber || metadata?.phone || '',
    email: clerkUser?.emailAddresses?.[0]?.emailAddress || '',
    role: metadata?.role || 'volunteer',

    // Vérifier si le profil est complet (firstName et lastName dans Clerk)
    // Le téléphone est stocké dans Neon, pas besoin de le vérifier ici
    isProfileComplete: !!(
      (clerkUser?.firstName || metadata?.firstName) &&
      (clerkUser?.lastName || metadata?.lastName)
    ),
  };
}
