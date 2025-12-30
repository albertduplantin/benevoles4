'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isProfileComplete, getUserById } from '@/lib/firebase/users';
import { getUserMissions, getAllMissions } from '@/lib/firebase/missions';
import { getAdminSettings, updateAdminSettings } from '@/lib/firebase/admin-settings';
import { MissionClient, UserClient, CategoryResponsibleClient } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ExportButtons } from '@/components/features/exports/export-buttons';
import { FullProgramExportButton } from '@/components/features/exports/full-program-export-button';
// 🚧 MODE PREVIEW : Page dédiée pour le générateur d'appel aux bénévoles (plus d'import de modal)
// Pour revenir à l'ancienne version, décommentez la ligne ci-dessous
// import { VolunteerCallModal } from '@/components/features/admin/volunteer-call-modal';
import { InstallPWAButton } from '@/components/features/pwa/install-pwa-button';
import { ResponsibleCategoriesBanner } from '@/components/features/category-responsibles/responsible-categories-banner';
import { PostFestivalReport } from '@/components/features/admin/post-festival-report';
import { RegistrationControl } from '@/components/features/admin/registration-control';
import { ALL_CATEGORIES_WITH_LABELS } from '@/lib/constants/mission-categories';
import { getGroupedCategories } from '@/lib/firebase/mission-categories-db';
import { MissionCategoryClient } from '@/types/category';
import Link from 'next/link';
import {
  CalendarIcon,
  UsersIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  TrendingUpIcon,
  FolderIcon,
  PlusIcon,
  Download,
  Loader2,
  MegaphoneIcon,
} from 'lucide-react';
import { exportVolunteerMissionGridExcel } from '@/lib/utils/excel-export';
import { toast } from 'sonner';
import { getAllVolunteers } from '@/lib/firebase/volunteers';

export default function DashboardOverviewPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [missions, setMissions] = useState<MissionClient[]>([]);
  const [allMissions, setAllMissions] = useState<MissionClient[]>([]);
  const [isLoadingMissions, setIsLoadingMissions] = useState(true);
  const [autoApprove, setAutoApprove] = useState(false);
  const [festivalStartDate, setFestivalStartDate] = useState<string>('');
  const [festivalEndDate, setFestivalEndDate] = useState<string>('');
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [allVolunteersMap, setAllVolunteersMap] = useState<Map<string, UserClient>>(new Map());
  const [responsibleCategories, setResponsibleCategories] = useState<CategoryResponsibleClient[]>([]);
  const [categoryIdToValueMap, setCategoryIdToValueMap] = useState<Map<string, string>>(new Map());
  const [isExportingGrid, setIsExportingGrid] = useState(false);

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      router.push('/auth/login');
    } else if (!isProfileComplete(user)) {
      router.push('/auth/complete-profile');
    }
  }, [user, loading, router]);

  // Charger les catégories depuis Firestore pour créer le mapping ID -> value
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const groupedCategories = await getGroupedCategories();
        const idToValueMap = new Map<string, string>();
        
        groupedCategories.forEach(group => {
          group.categories.forEach(cat => {
            idToValueMap.set(cat.id, cat.value);
          });
        });
        
        setCategoryIdToValueMap(idToValueMap);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    loadCategories();
  }, []);

  // Charger les catégories dont l'utilisateur est responsable
  useEffect(() => {
    const loadResponsibleCategories = async () => {
      if (!user || user.role !== 'category_responsible') return;
      try {
        const response = await fetch(`/api/my-categories?userId=${user.uid}`);
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        setResponsibleCategories(data.categories || []);
      } catch (error) {
        console.error('Error loading responsible categories:', error);
      }
    };
    loadResponsibleCategories();
  }, [user]);

  // Charger les missions
  useEffect(() => {
    const loadMissions = async () => {
      if (!user) return;
      try {
        setIsLoadingMissions(true);
        const userMissions = await getUserMissions(user.uid);
        setMissions(userMissions);

        if (user.role === 'admin' || user.role === 'category_responsible') {
          const all = await getAllMissions();
          setAllMissions(all);
        }

        if (user.role === 'admin') {
          const allMissionsForAdmin = await getAllMissions();
          const uniqueVolunteerIds = new Set<string>();
          
          allMissionsForAdmin.forEach((mission) => {
            mission.volunteers.forEach((uid) => uniqueVolunteerIds.add(uid));
            mission.responsibles.forEach((uid) => uniqueVolunteerIds.add(uid));
          });

          const volunteersMap = new Map<string, UserClient>();
          for (const uid of uniqueVolunteerIds) {
            try {
              const volunteer = await getUserById(uid);
              if (volunteer) {
                volunteersMap.set(uid, volunteer);
              }
            } catch (error) {
              console.error(`Error loading volunteer ${uid}:`, error);
            }
          }
          setAllVolunteersMap(volunteersMap);
        }
      } catch (error) {
        console.error('Error loading missions:', error);
      } finally {
        setIsLoadingMissions(false);
      }
    };
    loadMissions();
  }, [user]);

  // Fonction pour exporter le planning visuel
  const handleExportGrid = async () => {
    setIsExportingGrid(true);
    try {
      // Charger tous les bénévoles pour l'export
      const volunteersData = await getAllVolunteers();
      exportVolunteerMissionGridExcel(volunteersData, allMissions);
      toast.success('Planning visuel généré avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast.error('Erreur lors de l\'export');
    } finally {
      setIsExportingGrid(false);
    }
  };

  // Charger les paramètres admin
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      
      if (user.role !== 'admin') {
        setIsLoadingSettings(false);
        return;
      }
      
      try {
        setIsLoadingSettings(true);
        const settings = await getAdminSettings();
        setAutoApprove(settings.autoApproveResponsibility);
        
        // Charger les dates du festival
        if (settings.festivalStartDate) {
          setFestivalStartDate(settings.festivalStartDate.toISOString().split('T')[0]);
        }
        if (settings.festivalEndDate) {
          setFestivalEndDate(settings.festivalEndDate.toISOString().split('T')[0]);
        }
      } catch (error) {
        console.error('Error loading admin settings:', error);
      } finally {
        setIsLoadingSettings(false);
      }
    };
    loadSettings();
  }, [user]);

  const handleToggleAutoApprove = async (checked: boolean) => {
    if (!user || user.role !== 'admin') return;
    
    setIsSavingSettings(true);
    try {
      await updateAdminSettings({ autoApproveResponsibility: checked }, user.uid);
      setAutoApprove(checked);
    } catch (error) {
      console.error('Error updating settings:', error);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSaveFestivalDates = async () => {
    if (!user || user.role !== 'admin') return;
    
    if (!festivalStartDate || !festivalEndDate) {
      alert('Veuillez sélectionner les deux dates');
      return;
    }

    const startDate = new Date(festivalStartDate);
    const endDate = new Date(festivalEndDate);

    if (startDate > endDate) {
      alert('La date de début doit être antérieure à la date de fin');
      return;
    }
    
    setIsSavingSettings(true);
    try {
      await updateAdminSettings({ 
        festivalStartDate: startDate,
        festivalEndDate: endDate 
      }, user.uid);
      alert('Dates du festival enregistrées avec succès !');
    } catch (error) {
      console.error('Error updating festival dates:', error);
      alert('Erreur lors de l\'enregistrement des dates');
    } finally {
      setIsSavingSettings(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  // Statistiques
  const upcomingMissions = missions.filter(
    (m) => m.startDate && new Date(m.startDate) > new Date()
  );
  const completedMissions = missions.filter((m) => m.status === 'completed');
  
  // Stats admin
  const totalMissions = allMissions.length;
  const publishedMissions = allMissions.filter((m) => m.status === 'published').length;
  const pendingRequests = allMissions.reduce(
    (sum, m) => sum + (m.pendingResponsibles?.length || 0),
    0
  );
  const totalVolunteers = new Set(
    allMissions.flatMap((m) => m.volunteers)
  ).size;

  // Missions coordonnées par le responsable
  const responsibleCategoryIds = responsibleCategories.map(c => c.categoryId);
  
  // Convertir les IDs Firestore en valeurs textuelles pour la comparaison
  const responsibleCategoryValues = responsibleCategoryIds
    .map((id: string) => categoryIdToValueMap.get(id))
    .filter((val: string | undefined): val is string => val !== undefined);
  
  const coordinatingMissions = allMissions.filter((m) =>
    responsibleCategoryValues.includes(m.category)
  );

  const isAdmin = user.role === 'admin';
  const isResponsible = user.role === 'category_responsible';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          {isAdmin ? 'Tableau de bord Admin' : isResponsible ? 'Tableau de bord Responsable' : 'Mon Tableau de bord'}
        </h1>
        <p className="text-muted-foreground">
          Bienvenue, {user.firstName} 👋
        </p>
      </div>

      {/* Bandeau pour les responsables de catégorie */}
      <ResponsibleCategoriesBanner />

      {/* Stats Cards */}
      {isAdmin ? (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Missions</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMissions}</div>
              <p className="text-xs text-muted-foreground">
                {publishedMissions} publiées
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bénévoles Actifs</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVolunteers}</div>
              <p className="text-xs text-muted-foreground">
                Inscrits aux missions
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Demandes</CardTitle>
              <AlertCircleIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingRequests}</div>
              <p className="text-xs text-muted-foreground">
                En attente validation
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de Remplissage</CardTitle>
              <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalMissions > 0
                  ? Math.round(
                      (allMissions.reduce((sum, m) => sum + m.volunteers.length, 0) /
                        allMissions.reduce((sum, m) => sum + m.maxVolunteers, 0)) *
                        100
                    )
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">
                Moyenne globale
              </p>
            </CardContent>
          </Card>
        </div>
      ) : isResponsible ? (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mes Catégories</CardTitle>
              <FolderIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{responsibleCategories.length}</div>
              <p className="text-xs text-muted-foreground">
                Catégories assignées
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Missions Coordonnées</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{coordinatingMissions.length}</div>
              <p className="text-xs text-muted-foreground">
                Dans mes catégories
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mes Missions</CardTitle>
              <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{missions.length}</div>
              <p className="text-xs text-muted-foreground">
                {upcomingMissions.length} à venir
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Terminées</CardTitle>
              <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedMissions.length}</div>
              <p className="text-xs text-muted-foreground">
                Missions accomplies
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mes Missions</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{missions.length}</div>
              <p className="text-xs text-muted-foreground">
                Missions inscrites
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">À Venir</CardTitle>
              <AlertCircleIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingMissions.length}</div>
              <p className="text-xs text-muted-foreground">
                Missions futures
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Terminées</CardTitle>
              <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedMissions.length}</div>
              <p className="text-xs text-muted-foreground">
                Missions accomplies
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Prochaines Missions - Bénévole uniquement */}
      {!isAdmin && !isResponsible && upcomingMissions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🎯</span>
                  Mes Prochaines Missions
                </CardTitle>
                <CardDescription>
                  Les {Math.min(upcomingMissions.length, 5)} missions les plus proches
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/missions?filter=my">Voir toutes mes missions</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingMissions
                .sort((a, b) => {
                  const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
                  const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
                  return dateA - dateB;
                })
                .slice(0, 5)
                .map((mission) => {
                  const daysUntil = mission.startDate
                    ? Math.ceil((new Date(mission.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    : null;
                  const isUrgent = mission.isUrgent;
                  const isSoon = daysUntil !== null && daysUntil <= 3;
                  
                  return (
                    <Link
                      key={mission.id}
                      href={`/dashboard/missions/${mission.id}`}
                      className={`block p-4 rounded-lg transition-all hover:shadow-md ${
                        isUrgent ? 'bg-red-50 border-2 border-red-200' : 
                        isSoon ? 'bg-orange-50 border-2 border-orange-200' : 
                        'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-base">{mission.title}</h3>
                            {isUrgent && (
                              <Badge variant="destructive" className="text-xs">
                                🚨 URGENT
                              </Badge>
                            )}
                            {isSoon && !isUrgent && (
                              <Badge className="bg-orange-500 text-xs">
                                ⏰ Bientôt
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4" />
                              {mission.startDate
                                ? new Date(mission.startDate).toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'Date à définir'}
                            </p>
                            <p className="flex items-center gap-2">
                              📍 {mission.location}
                            </p>
                            <p className="flex items-center gap-2">
                              👥 {mission.volunteers.length}/{mission.maxVolunteers} bénévoles
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {daysUntil !== null && (
                            <div className={`text-sm font-semibold ${
                              isUrgent ? 'text-red-600' : 
                              isSoon ? 'text-orange-600' : 
                              'text-blue-600'
                            }`}>
                              {daysUntil === 0 ? "Aujourd'hui !" : 
                               daysUntil === 1 ? 'Demain' : 
                               `Dans ${daysUntil} jours`}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions Rapides - Bénévole uniquement */}
      {!isAdmin && !isResponsible && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              Actions Rapides
            </CardTitle>
            <CardDescription>
              Accès rapide aux fonctionnalités principales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button asChild variant="default" className="h-auto py-4 flex flex-col gap-2">
                <Link href="/dashboard/missions">
                  <CalendarIcon className="h-6 w-6" />
                  <span className="font-semibold">Découvrir les missions</span>
                  <span className="text-xs opacity-80">Toutes les missions disponibles</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4 flex flex-col gap-2">
                <Link href="/dashboard/missions?filter=my">
                  <CheckCircleIcon className="h-6 w-6" />
                  <span className="font-semibold">Mes missions</span>
                  <span className="text-xs opacity-80">{missions.length} mission{missions.length > 1 ? 's' : ''} inscrite{missions.length > 1 ? 's' : ''}</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Planning - Bénévole uniquement */}
      {!isAdmin && !isResponsible && missions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">📄</span>
              Mon Planning
            </CardTitle>
            <CardDescription>
              Exportez votre planning personnel en PDF
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExportButtons
              type="volunteer-planning"
              missions={missions}
              volunteerName={`${user.firstName} ${user.lastName}`}
              allParticipants={new Map()}
            />
          </CardContent>
        </Card>
      )}

      {/* Installer l'application - Bénévole uniquement (Mobile) */}
      {!isAdmin && !isResponsible && (
        <Card className="md:hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">📱</span>
              Installer l'application
            </CardTitle>
            <CardDescription>
              Accédez rapidement au festival depuis votre écran d'accueil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InstallPWAButton variant="black" />
          </CardContent>
        </Card>
      )}

      {/* Actions Admin */}
      {isAdmin && !isLoadingSettings && (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Communication */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">📢</span>
                  Communication
                </CardTitle>
                <CardDescription>
                  Générez des appels aux bénévoles (Version Améliorée 🚀)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* 🚧 MODE PREVIEW : Nouvelle version - page dédiée au lieu d'un modal */}
                {/* Pour revenir à l'ancienne version, commentez les 3 lignes ci-dessous et décommentez celle d'après */}
                <Button 
                  onClick={() => router.push('/dashboard/volunteer-call')}
                  className="w-full"
                  size="lg"
                >
                  <MegaphoneIcon className="h-5 w-5 mr-2" />
                  Générer un appel aux bénévoles
                  {allMissions.filter(m => m.status === 'published' && m.volunteers.length < m.maxVolunteers && m.isUrgent).length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {allMissions.filter(m => m.status === 'published' && m.volunteers.length < m.maxVolunteers && m.isUrgent).length} urgent{allMissions.filter(m => m.status === 'published' && m.volunteers.length < m.maxVolunteers && m.isUrgent).length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </Button>
                {/* <VolunteerCallModal missions={allMissions} /> */}
              </CardContent>
            </Card>

            {/* Exports */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">📄</span>
                  Exports
                </CardTitle>
                <CardDescription>
                  Téléchargez les données en PDF ou Excel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Programme Complet</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Pour impression et réunions bénévoles
                  </p>
                  <FullProgramExportButton missions={allMissions} />
                </div>

                <div className="border-t pt-4">
                  <Label className="text-sm font-semibold mb-2 block">Planning Visuel</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Tableau croisé bénévoles × missions avec couleurs par catégorie
                  </p>
                  <Button 
                    onClick={handleExportGrid}
                    disabled={isExportingGrid || allMissions.length === 0}
                    className="w-full"
                  >
                    {isExportingGrid ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Export en cours...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Planning visuel (Excel)
                      </>
                    )}
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <Label className="text-sm font-semibold mb-2 block">Statistiques</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Rapports et données du festival
                  </p>
                  <ExportButtons
                    type="global"
                    missions={allMissions}
                    totalVolunteers={totalVolunteers}
                    allVolunteers={allVolunteersMap}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contrôle des Inscriptions */}
          <div className="space-y-4">
            <RegistrationControl />
          </div>

          {/* Rapports et Analyses */}
          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Rapports et Analyses
              </CardTitle>
              <CardDescription>
                Generez des rapports detailles pour vos bilans et presentations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Rapport Post-Festival</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Un PDF complet avec toutes les statistiques : benevoles mobilises, repartition par categorie, 
                    top 15 des plus actifs, taux de remplissage, missions urgentes et bien plus.
                  </p>
                  <PostFestivalReport 
                    missions={allMissions}
                    allVolunteers={allVolunteersMap}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Actions Responsable */}
      {isResponsible && responsibleCategories.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Créer une mission */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">➕</span>
                Nouvelle Mission
              </CardTitle>
              <CardDescription>
                Créez une mission dans vos catégories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" size="lg">
                <Link href="/dashboard/missions/new">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Créer une mission
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Communication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📢</span>
                Communication
              </CardTitle>
              <CardDescription>
                Appelez des bénévoles pour vos missions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* 🚧 MODE PREVIEW : Nouvelle version - page dédiée au lieu d'un modal */}
              <Button 
                onClick={() => router.push('/dashboard/volunteer-call')}
                className="w-full"
                size="lg"
              >
                <MegaphoneIcon className="h-5 w-5 mr-2" />
                Générer un appel aux bénévoles
                {coordinatingMissions.filter(m => m.status === 'published' && m.volunteers.length < m.maxVolunteers && m.isUrgent).length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {coordinatingMissions.filter(m => m.status === 'published' && m.volunteers.length < m.maxVolunteers && m.isUrgent).length} urgent{coordinatingMissions.filter(m => m.status === 'published' && m.volunteers.length < m.maxVolunteers && m.isUrgent).length > 1 ? 's' : ''}
                  </Badge>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Exports - Pleine largeur */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📄</span>
                Exports de vos missions
              </CardTitle>
              <CardDescription>
                Téléchargez vos missions en PDF ou Excel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Programme Complet</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Pour impression et réunions bénévoles
                  </p>
                  <FullProgramExportButton 
                    missions={coordinatingMissions} 
                    allowedCategories={responsibleCategoryValues}
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-2 block">Statistiques</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Rapports de vos missions
                  </p>
                  <ExportButtons
                    type="global"
                    missions={coordinatingMissions}
                    totalVolunteers={new Set(coordinatingMissions.flatMap(m => m.volunteers)).size}
                    allVolunteers={allVolunteersMap}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Installer l'application - Responsable (Mobile uniquement) */}
          <Card className="md:hidden md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📱</span>
                Installer l'application
              </CardTitle>
              <CardDescription>
                Accédez rapidement au festival depuis votre écran d'accueil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InstallPWAButton variant="black" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Catégories et Missions Coordonnées (Responsable) */}
      {!isAdmin && isResponsible && (
        <>
          {/* Mes Catégories */}
          {responsibleCategories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Mes Catégories</CardTitle>
                <CardDescription>
                  Les catégories dont vous êtes responsable
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {responsibleCategories.map((cat) => {
                    const categoryLabel = ALL_CATEGORIES_WITH_LABELS.find(
                      c => c.value === cat.categoryId
                    )?.label || cat.categoryLabel;
                    return (
                      <Badge key={cat.id} variant="secondary" className="text-sm">
                        <FolderIcon className="h-3 w-3 mr-1" />
                        {categoryLabel}
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Missions Coordonnées */}
          {coordinatingMissions.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Missions que je coordonne</CardTitle>
                    <CardDescription>
                      Les missions de mes catégories
                    </CardDescription>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard/missions">Voir tout</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {coordinatingMissions.slice(0, 5).map((mission) => {
                    const categoryLabel = ALL_CATEGORIES_WITH_LABELS.find(
                      c => c.value === mission.category
                    )?.label || mission.category;
                    return (
                      <Link
                        key={mission.id}
                        href={`/dashboard/missions/${mission.id}`}
                        className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{mission.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {categoryLabel} • {mission.volunteers.length}/{mission.maxVolunteers} bénévoles
                            </p>
                          </div>
                          <Badge className="bg-purple-600">👑 Responsable</Badge>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Paramètres Admin */}
      {isAdmin && !isLoadingSettings && (
        <Card>
          <CardHeader>
            <CardTitle>Paramètres Administrateur</CardTitle>
            <CardDescription>
              Configuration générale du système
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <h3 className="text-base font-semibold mb-2">Dates du Festival</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Définissez les dates de début et fin du festival. Les bénévoles pourront ensuite filtrer les missions par jour.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="festival-start">Date de début</Label>
                  <input
                    type="date"
                    id="festival-start"
                    value={festivalStartDate}
                    onChange={(e) => setFestivalStartDate(e.target.value)}
                    disabled={isSavingSettings}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="festival-end">Date de fin</Label>
                  <input
                    type="date"
                    id="festival-end"
                    value={festivalEndDate}
                    onChange={(e) => setFestivalEndDate(e.target.value)}
                    disabled={isSavingSettings}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <Button
                onClick={handleSaveFestivalDates}
                disabled={isSavingSettings || !festivalStartDate || !festivalEndDate}
                className="mt-4"
              >
                {isSavingSettings ? 'Enregistrement...' : 'Enregistrer les dates'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

