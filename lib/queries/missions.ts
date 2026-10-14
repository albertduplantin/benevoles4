import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllMissions,
  getPublishedMissions,
  getVisibleMissions,
  getUserMissions,
  getMissionById,
  deleteMission as deleteMissionFB,
} from '@/lib/api/missions';
import { registerToMission, unregisterFromMission } from '@/lib/api/registrations';

// Clés de requête
export const missionKeys = {
  all: ['missions'] as const,
  allMissions: () => [...missionKeys.all, 'all'] as const,
  published: () => [...missionKeys.all, 'published'] as const,
  visible: () => [...missionKeys.all, 'visible'] as const,
  user: (userId: string) => [...missionKeys.all, 'user', userId] as const,
  detail: (id: string) => [...missionKeys.all, 'detail', id] as const,
};

// Hook pour récupérer toutes les missions (admin)
export function useAllMissions() {
  return useQuery({
    queryKey: missionKeys.allMissions(),
    queryFn: getAllMissions,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook pour récupérer les missions publiées (bénévoles)
export function usePublishedMissions() {
  return useQuery({
    queryKey: missionKeys.published(),
    queryFn: getPublishedMissions,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook pour récupérer les missions visibles (publiées ET complètes)
export function useVisibleMissions() {
  return useQuery({
    queryKey: missionKeys.visible(),
    queryFn: getVisibleMissions,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook pour récupérer les missions d'un utilisateur
export function useUserMissions(userId: string | undefined) {
  return useQuery({
    queryKey: missionKeys.user(userId || ''),
    queryFn: () => getUserMissions(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook pour récupérer une mission par ID
export function useMission(id: string | undefined) {
  return useQuery({
    queryKey: missionKeys.detail(id || ''),
    queryFn: () => getMissionById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook pour s'inscrire à une mission
export function useRegisterToMission() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ missionId, userId }: { missionId: string; userId: string }) =>
      registerToMission(missionId, userId),
    onSuccess: () => {
      // Invalider les requêtes de missions pour forcer un rechargement
      queryClient.invalidateQueries({ queryKey: missionKeys.all });
    },
  });
}

// Hook pour se désinscrire d'une mission
export function useUnregisterFromMission() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ missionId, userId }: { missionId: string; userId: string }) =>
      unregisterFromMission(missionId, userId),
    onSuccess: () => {
      // Invalider les requêtes de missions pour forcer un rechargement
      queryClient.invalidateQueries({ queryKey: missionKeys.all });
    },
  });
}

// Hook pour supprimer une mission
export function useDeleteMission() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (missionId: string) => deleteMissionFB(missionId),
    onSuccess: () => {
      // Invalider les requêtes de missions pour forcer un rechargement
      queryClient.invalidateQueries({ queryKey: missionKeys.all });
    },
  });
}









