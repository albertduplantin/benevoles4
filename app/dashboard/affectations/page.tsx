'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isProfileComplete } from '@/lib/api/users';
import { getAllMissions } from '@/lib/api/missions';
import { getAllVolunteers } from '@/lib/api/users';
import { MissionClient, UserClient } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AffectationsGrid } from '@/components/features/affectations/affectations-grid';
import { Users, Calendar, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AffectationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [missions, setMissions] = useState<MissionClient[]>([]);
  const [volunteers, setVolunteers] = useState<UserClient[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    } else if (!loading && user && !isProfileComplete(user)) {
      router.push('/auth/complete-profile');
    } else if (!loading && user && user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const loadData = async () => {
      if (!user || user.role !== 'admin') return;
      
      try {
        setIsLoadingData(true);
        const [missionsData, volunteersData] = await Promise.all([
          getAllMissions(),
          getAllVolunteers(),
        ]);
        setMissions(missionsData);
        setVolunteers(volunteersData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [user]);

  const handleRefresh = async () => {
    if (!user || user.role !== 'admin') return;
    
    try {
      setIsRefreshing(true);
      const [missionsData, volunteersData] = await Promise.all([
        getAllMissions(),
        getAllVolunteers(),
      ]);
      setMissions(missionsData);
      setVolunteers(volunteersData);
      toast.success('Données actualisées');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Erreur lors de l\'actualisation');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading || !user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="w-full p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="container mx-auto flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Gestion des Affectations</h1>
          <p className="text-muted-foreground">
            Cliquez sur une case pour affecter/désaffecter un bénévole. Glissez-déposez pour déplacer une affectation.
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="flex-shrink-0"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Actualisation...' : 'Actualiser'}
        </Button>
      </div>

      {/* Stats */}
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Missions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{missions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bénévoles</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{volunteers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Affectations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {missions.reduce((acc, m) => acc + m.volunteers.length, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid - Full Width */}
      <Card className="w-full mx-auto" style={{ maxWidth: 'calc(100vw - 2rem)' }}>
        <CardHeader>
          <CardTitle>Tableau d'Affectations</CardTitle>
          <CardDescription>
            Missions en lignes, bénévoles en colonnes. Les conflits de créneaux sont détectés automatiquement.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2">
          {isLoadingData ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Chargement des données...</p>
              </div>
            </div>
          ) : (
            <AffectationsGrid
              missions={missions}
              volunteers={volunteers}
              onUpdate={(updatedMissions) => setMissions(updatedMissions)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

