'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  ClockIcon,
  PlusIcon,
  CheckCircle2Icon,
  AlertCircleIcon
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils/date';
import Link from 'next/link';
import { toast } from 'sonner';

interface Mission {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'scheduled' | 'ongoing';
  startDate: string | null;
  endDate: string | null;
  location: string;
  maxVolunteers: number;
  status: 'draft' | 'published' | 'full' | 'cancelled' | 'completed';
  isUrgent: boolean;
  isRecurrent: boolean;
  volunteers: string[];
  waitlist: string[];
  createdAt: string;
  updatedAt: string;
}

export default function MissionsPage() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<string | null>(null);

  useEffect(() => {
    fetchMissions();
  }, []);

  const fetchMissions = async () => {
    try {
      const response = await fetch('/api/missions?status=published');
      if (!response.ok) throw new Error('Failed to fetch missions');
      const data = await response.json();
      setMissions(data.missions || []);
    } catch (error) {
      console.error('Error fetching missions:', error);
      toast.error('Erreur lors du chargement des missions');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (missionId: string) => {
    setRegistering(missionId);
    try {
      const response = await fetch(`/api/missions/${missionId}/register`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to register');
      }

      const data = await response.json();

      if (data.onWaitlist) {
        toast.success('Ajouté à la liste d\'attente');
      } else {
        toast.success('Inscription réussie!');
      }

      fetchMissions();
    } catch (error: any) {
      console.error('Error registering:', error);
      toast.error(error.message || 'Erreur lors de l\'inscription');
    } finally {
      setRegistering(null);
    }
  };

  const handleUnregister = async (missionId: string) => {
    setRegistering(missionId);
    try {
      const response = await fetch(`/api/missions/${missionId}/register`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to unregister');
      }

      toast.success('Désinscription réussie');
      fetchMissions();
    } catch (error) {
      console.error('Error unregistering:', error);
      toast.error('Erreur lors de la désinscription');
    } finally {
      setRegistering(null);
    }
  };

  const isRegistered = (mission: Mission) => {
    return mission.volunteers.includes(user?.id || '');
  };

  const isOnWaitlist = (mission: Mission) => {
    return mission.waitlist.includes(user?.id || '');
  };

  const getSpotsLeft = (mission: Mission) => {
    return mission.maxVolunteers - mission.volunteers.length;
  };

  const getStatusBadge = (mission: Mission) => {
    if (mission.status === 'full') {
      return <Badge variant="destructive">Complet</Badge>;
    }
    if (mission.isUrgent) {
      return <Badge className="bg-orange-500">Urgent</Badge>;
    }
    const spotsLeft = getSpotsLeft(mission);
    if (spotsLeft <= 2) {
      return <Badge variant="secondary">{spotsLeft} places</Badge>;
    }
    return <Badge variant="outline">{spotsLeft} places</Badge>;
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Missions disponibles</h1>
          <p className="text-gray-600 mt-2">
            Choisissez vos missions pour le festival
          </p>
        </div>
        {user.role === 'admin' && (
          <Link href="/dashboard/missions/new">
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Créer une mission
            </Button>
          </Link>
        )}
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : missions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircleIcon className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune mission disponible</h3>
            <p className="text-gray-600 text-center">
              Les missions seront bientôt publiées. Revenez plus tard!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {missions.map((mission) => (
            <Card key={mission.id} className={isRegistered(mission) ? 'border-green-500 border-2' : ''}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{mission.title}</CardTitle>
                  {getStatusBadge(mission)}
                </div>
                <CardDescription>{mission.category}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                  {mission.description}
                </p>

                <div className="space-y-2 text-sm">
                  {mission.startDate && (
                    <div className="flex items-center text-gray-600">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {formatDateTime(mission.startDate)}
                    </div>
                  )}
                  <div className="flex items-center text-gray-600">
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    {mission.location}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <UsersIcon className="h-4 w-4 mr-2" />
                    {mission.volunteers.length} / {mission.maxVolunteers} bénévoles
                  </div>
                  {mission.type === 'ongoing' && (
                    <div className="flex items-center text-gray-600">
                      <ClockIcon className="h-4 w-4 mr-2" />
                      Mission continue
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  {isRegistered(mission) ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleUnregister(mission.id)}
                      disabled={registering === mission.id}
                    >
                      <CheckCircle2Icon className="h-4 w-4 mr-2 text-green-600" />
                      Inscrit - Se désinscrire
                    </Button>
                  ) : isOnWaitlist(mission) ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleUnregister(mission.id)}
                      disabled={registering === mission.id}
                    >
                      <AlertCircleIcon className="h-4 w-4 mr-2 text-orange-600" />
                      Liste d'attente - Retirer
                    </Button>
                  ) : mission.status === 'full' ? (
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => handleRegister(mission.id)}
                      disabled={registering === mission.id}
                    >
                      <AlertCircleIcon className="h-4 w-4 mr-2" />
                      Rejoindre liste d'attente
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleRegister(mission.id)}
                      disabled={registering === mission.id}
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      {registering === mission.id ? 'Inscription...' : 'S\'inscrire'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
