import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllVolunteers,
  updateVolunteerInfo,
  changeVolunteerRole,
  deleteVolunteer,
} from '@/lib/firebase/volunteers';
import { getUserById } from '@/lib/firebase/users';

// Clés de requête
export const volunteerKeys = {
  all: ['volunteers'] as const,
  list: () => [...volunteerKeys.all, 'list'] as const,
  detail: (id: string) => [...volunteerKeys.all, 'detail', id] as const,
};

// Hook pour récupérer tous les bénévoles
export function useVolunteers() {
  return useQuery({
    queryKey: volunteerKeys.list(),
    queryFn: getAllVolunteers,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook pour récupérer un bénévole par ID
export function useVolunteer(userId: string | undefined) {
  return useQuery({
    queryKey: volunteerKeys.detail(userId || ''),
    queryFn: () => getUserById(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook pour mettre à jour les informations d'un bénévole
export function useUpdateVolunteer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: any }) =>
      updateVolunteerInfo(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: volunteerKeys.all });
    },
  });
}

// Hook pour changer le rôle d'un bénévole
export function useChangeVolunteerRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, newRole }: { userId: string; newRole: 'volunteer' | 'admin' }) =>
      changeVolunteerRole(userId, newRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: volunteerKeys.all });
    },
  });
}

// Hook pour supprimer un bénévole
export function useDeleteVolunteer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => deleteVolunteer(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: volunteerKeys.all });
    },
  });
}























