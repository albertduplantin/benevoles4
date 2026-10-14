'use client';

import { useSession } from 'next-auth/react';

export interface UserMetadata {
  firstName: string;
  lastName: string;
  phone: string;
  role: 'volunteer' | 'category_responsible' | 'admin';
}

/**
 * Hook d'authentification basé sur Auth.js.
 * Les données (rôle, prénom, nom, téléphone) viennent de la table users via le JWT de session.
 */
export function useAuth() {
  const { data: session, status, update } = useSession();
  const sessionUser = session?.user;

  const user = sessionUser
    ? {
        ...sessionUser,
        uid: sessionUser.id,
        role: sessionUser.role || 'volunteer',
        firstName: sessionUser.firstName || '',
        lastName: sessionUser.lastName || '',
        phone: sessionUser.phone || '',
        responsibleForCategories: sessionUser.responsibleForCategories || [],
      }
    : null;

  return {
    user: user as any,
    isSignedIn: !!sessionUser,
    loading: status === 'loading',
    // Recharge le profil depuis la base (après modification du profil par exemple)
    refreshUser: async () => {
      await update();
    },

    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    email: sessionUser?.email || '',
    role: user?.role || ('volunteer' as const),

    // Profil complet : prénom, nom et téléphone renseignés
    isProfileComplete: !!(user?.firstName && user?.lastName && user?.phone),
  };
}
