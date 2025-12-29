/**
 * Hook personnalisé pour calculer les permissions sur les missions
 * Gère efficacement les vérifications asynchrones pour les responsables de catégorie
 */

import { useState, useEffect } from 'react';
import { User, UserClient, MissionClient } from '@/types';
import { canEditMissionAsync, canDeleteMissionAsync } from '@/lib/utils/permissions';

interface MissionPermissions {
  canEdit: boolean;
  canDelete: boolean;
}

/**
 * Calculer les permissions pour toutes les missions de manière efficace
 */
export function useMissionPermissions(
  user: User | UserClient | null,
  missions: MissionClient[]
): Map<string, MissionPermissions> {
  const [permissions, setPermissions] = useState<Map<string, MissionPermissions>>(new Map());

  useEffect(() => {
    const calculatePermissions = async () => {
      if (!user || missions.length === 0) {
        setPermissions(new Map());
        return;
      }

      // Calculer les permissions pour toutes les missions en parallèle
      const permissionsPromises = missions.map(async (mission) => {
        const canEdit = await canEditMissionAsync(user, mission.category);
        const canDelete = await canDeleteMissionAsync(user, mission.category);
        
        return {
          missionId: mission.id,
          permissions: { canEdit, canDelete }
        };
      });

      const results = await Promise.all(permissionsPromises);

      // Créer la Map
      const newPermissions = new Map<string, MissionPermissions>();
      results.forEach(({ missionId, permissions }) => {
        newPermissions.set(missionId, permissions);
      });

      setPermissions(newPermissions);
    };

    calculatePermissions();
  }, [user, missions]);

  return permissions;
}


















