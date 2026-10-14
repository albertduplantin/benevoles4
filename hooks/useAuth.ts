'use client';

import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserById } from '@/lib/api/users';

export interface UserMetadata {
  firstName: string;
  lastName: string;
  phone: string;
  role: 'volunteer' | 'category_responsible' | 'admin';
}

/**
 * Hook d'authentification basé sur Auth.js.
 * La session donne l'identité et le rôle ; le profil complet (consentements, préférences,
 * date de création...) est chargé depuis la base et mis en cache 1 minute.
 */
export function useAuth() {
  const { data: session, status, update } = useSession();
  const queryClient = useQueryClient();
  const sessionUser = session?.user;
  const id = sessionUser?.id;

  const { data: profile } = useQuery({
    queryKey: ['me', id],
    queryFn: () => getUserById(id!),
    enabled: !!id,
    staleTime: 60_000,
  });

  // Référence stable : les pages mettent `user` dans les dépendances de leurs effets,
  // un nouvel objet à chaque rendu provoquerait des boucles de rechargement.
  const user = useMemo(
    () =>
      sessionUser
        ? {
            // Valeurs par défaut pour que les pages ne plantent pas avant l'arrivée du profil
            consents: { dataProcessing: false, communications: false, consentDate: new Date(0) },
            createdAt: new Date(0),
            ...sessionUser,
            ...(profile ?? {}),
            uid: sessionUser.id,
            role: profile?.role ?? sessionUser.role ?? 'volunteer',
            firstName: profile?.firstName ?? sessionUser.firstName ?? '',
            lastName: profile?.lastName ?? sessionUser.lastName ?? '',
            phone: profile?.phone ?? sessionUser.phone ?? '',
            responsibleForCategories:
              profile?.responsibleForCategories ?? sessionUser.responsibleForCategories ?? [],
          }
        : null,
    [sessionUser, profile]
  );

  return {
    user: user as any,
    isSignedIn: !!sessionUser,
    loading: status === 'loading',
    // Recharge le profil depuis la base (après modification du profil par exemple)
    refreshUser: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me'] });
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
