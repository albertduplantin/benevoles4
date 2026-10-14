'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isProfileComplete, getUserById } from '@/lib/api/users';
import { getUserMissions, getAllMissions } from '@/lib/api/missions';
import { MissionClient, UserClient } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MissionCalendar } from '@/components/features/calendar/mission-calendar';
import { ExportButtons } from '@/components/features/exports/export-buttons';

export default function CalendarPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [missions, setMissions] = useState<MissionClient[]>([]);
  const [allMissions, setAllMissions] = useState<MissionClient[]>([]);
  const [isLoadingMissions, setIsLoadingMissions] = useState(true);
  const [missionParticipants, setMissionParticipants] = useState<Map<string, UserClient[]>>(new Map());

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      router.push('/auth/login');
    } else if (!isProfileComplete(user)) {
      router.push('/auth/complete-profile');
    }
  }, [user, loading, router]);

  // Charger les missions
  useEffect(() => {
    const loadMissions = async () => {
      if (!user) return;
      try {
        setIsLoadingMissions(true);
        const userMissions = await getUserMissions(user.uid);
        setMissions(userMissions);

        // Charger toutes les missions pour tout le monde (pour le calendrier)
        const all = await getAllMissions();
        setAllMissions(all);

        // Charger les participants pour l'export planning (en parallèle pour optimiser)
        if (user.role === 'volunteer') {
          const participantsMap = new Map<string, UserClient[]>();
          
          // Charger tous les participants de toutes les missions en parallèle
          await Promise.all(
            userMissions.map(async (mission) => {
              try {
                // Charger tous les participants d'une mission en parallèle
                const participantsPromises = mission.volunteers.map(uid => getUserById(uid));
                const participants = await Promise.all(participantsPromises);
                // Filtrer les participants null/undefined
                const validParticipants = participants.filter((p): p is UserClient => p !== null);
                participantsMap.set(mission.id, validParticipants);
              } catch (error) {
                console.error(`Error loading participants for mission ${mission.id}:`, error);
              }
            })
          );
          
          setMissionParticipants(participantsMap);
        }
      } catch (error) {
        console.error('Error loading missions:', error);
      } finally {
        setIsLoadingMissions(false);
      }
    };
    loadMissions();
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Calendrier</h1>
        <p className="text-muted-foreground">
          Visualisez toutes vos missions
        </p>
      </div>

      {/* Calendrier */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{isAdmin ? 'Toutes les Missions' : 'Calendrier des Missions'}</CardTitle>
              <CardDescription>
                {isAdmin ? 'Planning de toutes les missions' : 'Visualisez toutes les missions disponibles'}
              </CardDescription>
            </div>
            {!isAdmin && missions.length > 0 && !isLoadingMissions && (
              <ExportButtons
                type="volunteer-planning"
                missions={missions}
                volunteerName={`${user.firstName} ${user.lastName}`}
                allParticipants={missionParticipants}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingMissions ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Chargement des missions...</p>
              </div>
            </div>
          ) : (
            <MissionCalendar
              missions={allMissions}
              currentUserId={user.uid}
              currentUser={user}
              isAdmin={isAdmin}
              onDelete={(missionId) => {
                setAllMissions(allMissions.filter(m => m.id !== missionId));
                setMissions(missions.filter(m => m.id !== missionId));
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
