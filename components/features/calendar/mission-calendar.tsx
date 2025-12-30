'use client';

import { Calendar, momentLocalizer, Event, View } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { MissionClient, UserClient, User } from '@/types';
import { useRouter } from 'next/navigation';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils/date';
import { canEditMissionAsync, canDeleteMissionAsync } from '@/lib/utils/permissions';
import { EditIcon, TrashIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import { getGroupedCategories } from '@/lib/firebase/mission-categories-db';
import { MissionCategoryClient } from '@/types/category';
import './calendar.css';

moment.locale('fr');
const localizer = momentLocalizer(moment);

interface MissionCalendarProps {
  missions: MissionClient[];
  currentUserId?: string; // Pour afficher les badges
  currentUser?: User | UserClient | null; // Pour vérifier les permissions
  isAdmin?: boolean; // Pour compatibilité (sera déprécié)
  onDelete?: (missionId: string) => void; // Callback pour la suppression
}

interface CalendarEvent extends Event {
  resource: {
    missionId: string;
    status: string;
    isUrgent: boolean;
    isUserRegistered?: boolean;
    isUserResponsible?: boolean;
  };
}

const messages = {
  allDay: 'Journée',
  previous: 'Précédent',
  next: 'Suivant',
  today: "Aujourd'hui",
  month: 'Mois',
  week: 'Semaine',
  day: 'Jour',
  agenda: 'Agenda',
  date: 'Date',
  time: 'Heure',
  event: 'Événement',
  noEventsInRange: 'Aucune mission dans cette période',
  showMore: (total: number) => `+ ${total} mission(s)`,
};

export function MissionCalendar({ missions, currentUserId, currentUser, isAdmin, onDelete }: MissionCalendarProps) {
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState<View>('month');
  const [selectedMission, setSelectedMission] = useState<MissionClient | null>(null);
  const [canUserEdit, setCanUserEdit] = useState(false);
  const [canUserDelete, setCanUserDelete] = useState(false);
  const [showAllMissions, setShowAllMissions] = useState(false); // État pour afficher toutes les missions
  const [categoryIdToValueMap, setCategoryIdToValueMap] = useState<Map<string, string>>(new Map());

  // Charger les catégories pour le mapping ID -> value
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categories = await getGroupedCategories();
        const idToValueMap = new Map<string, string>();
        categories.forEach((group: { group: string; categories: MissionCategoryClient[] }) => {
          group.categories.forEach((cat: MissionCategoryClient) => {
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

  // Vérifier les permissions de manière asynchrone quand une mission est sélectionnée
  useEffect(() => {
    const checkPermissions = async () => {
      if (!selectedMission) {
        setCanUserEdit(false);
        setCanUserDelete(false);
        return;
      }

      if (isAdmin) {
        setCanUserEdit(true);
        setCanUserDelete(true);
        return;
      }

      if (currentUser) {
        const canEdit = await canEditMissionAsync(currentUser, selectedMission.category);
        const canDelete = await canDeleteMissionAsync(currentUser, selectedMission.category);
        setCanUserEdit(canEdit);
        setCanUserDelete(canDelete);
      } else {
        setCanUserEdit(false);
        setCanUserDelete(false);
      }
    };

    checkPermissions();
  }, [selectedMission, currentUser, isAdmin]);

  // Filtrer les missions selon le rôle et l'état showAllMissions
  const filteredMissions = useMemo(() => {
    // Pour les admins : toujours toutes les missions
    if (isAdmin) {
      return missions;
    }

    // Pour les bénévoles : toujours toutes les missions
    if (!currentUser || currentUser.role === 'volunteer') {
      return missions;
    }

    // Pour les responsables de catégorie
    if (currentUser.role === 'category_responsible' && currentUser.responsibleForCategories) {
      // Si showAllMissions est activé, montrer toutes les missions
      if (showAllMissions) {
        return missions;
      }

      // Sinon, filtrer par catégories responsables
      const responsibleCategoryValues = currentUser.responsibleForCategories
        .map((id: string) => categoryIdToValueMap.get(id))
        .filter((val: string | undefined): val is string => val !== undefined);
      
      return missions.filter(m => responsibleCategoryValues.includes(m.category));
    }

    return missions;
  }, [missions, currentUser, isAdmin, showAllMissions, categoryIdToValueMap]);

  // Convertir les missions en événements calendrier
  const events: CalendarEvent[] = filteredMissions
    .filter((mission) => mission.type === 'scheduled' && mission.startDate)
    .map((mission) => {
      const isUserRegistered = currentUserId ? mission.volunteers.includes(currentUserId) : false;
      const isUserResponsible = currentUserId ? mission.responsibles.includes(currentUserId) : false;
      
      let title = mission.title;
      if (isUserResponsible) {
        title = `👑 ${title}`;
      } else if (isUserRegistered) {
        title = `✓ ${title}`;
      }

      return {
        title,
        start: new Date(mission.startDate!),
        end: mission.endDate ? new Date(mission.endDate) : new Date(mission.startDate!),
        resource: {
          missionId: mission.id,
          status: mission.status,
          isUrgent: mission.isUrgent,
          isUserRegistered,
          isUserResponsible,
        },
      };
    });

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#3174ad';
    let borderColor = 'transparent';
    let borderWidth = '0px';
    
    // Priorité couleur : Responsable > Inscrit > Urgent > Statut
    if (event.resource.isUserResponsible) {
      backgroundColor = '#8b5cf6'; // Violet pour responsable
      borderColor = '#fbbf24'; // Bordure dorée
      borderWidth = '3px';
    } else if (event.resource.isUserRegistered) {
      backgroundColor = '#3b82f6'; // Bleu pour inscrit
      borderColor = '#22c55e'; // Bordure verte
      borderWidth = '2px';
    } else if (event.resource.isUrgent) {
      backgroundColor = '#ef4444'; // Rouge pour urgent
    } else if (event.resource.status === 'full') {
      backgroundColor = '#f97316'; // Orange pour complet
    } else if (event.resource.status === 'completed') {
      backgroundColor = '#22c55e'; // Vert pour terminé
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.9,
        color: 'white',
        border: `${borderWidth} solid ${borderColor}`,
        display: 'block',
        fontWeight: event.resource.isUserResponsible || event.resource.isUserRegistered ? '600' : 'normal',
      },
    };
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    if (isAdmin) {
      // Pour les admins, ouvrir le modal avec les options
      const mission = filteredMissions.find(m => m.id === event.resource.missionId);
      if (mission) {
        setSelectedMission(mission);
      }
    } else {
      // Pour les autres, rediriger directement
      router.push(`/dashboard/missions/${event.resource.missionId}`);
    }
  };

  const handleNavigate = useCallback((newDate: Date) => {
    setDate(newDate);
  }, []);

  const handleViewChange = useCallback((newView: View) => {
    setView(newView);
  }, []);

  // Vérifier si l'utilisateur est un responsable de catégorie
  const isCategoryResponsible = currentUser?.role === 'category_responsible' && currentUser.responsibleForCategories && currentUser.responsibleForCategories.length > 0;

  return (
    <div className="space-y-4">
      {/* Bouton pour basculer entre mes missions et toutes les missions (uniquement pour les responsables) */}
      {isCategoryResponsible && (
        <div className="flex justify-end">
          <Button
            variant={showAllMissions ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAllMissions(!showAllMissions)}
            className="gap-2"
          >
            {showAllMissions ? (
              <>
                <EyeOffIcon className="h-4 w-4" />
                Voir mes missions uniquement
              </>
            ) : (
              <>
                <EyeIcon className="h-4 w-4" />
                Voir toutes les missions
              </>
            )}
          </Button>
        </div>
      )}

      {/* Légende */}
      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#8b5cf6', border: '3px solid #fbbf24' }}></div>
          <span>👑 Responsable</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#3b82f6', border: '2px solid #22c55e' }}></div>
          <span>✓ Inscrit</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#ef4444' }}></div>
          <span>Urgent</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#f97316' }}></div>
          <span>Complet</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#22c55e' }}></div>
          <span>Terminé</span>
        </div>
      </div>

      {/* Calendrier */}
      <div className="h-[600px] bg-white p-4 rounded-lg border">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          date={date}
          view={view}
          onNavigate={handleNavigate}
          onView={handleViewChange}
          messages={messages}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={handleSelectEvent}
          views={['month', 'week', 'day', 'agenda']}
          popup
          style={{ height: '100%' }}
        />
      </div>
      
      {/* Modal pour les actions rapides */}
      {(canUserEdit || canUserDelete) && selectedMission && (
        <Dialog open={!!selectedMission} onOpenChange={(open) => !open && setSelectedMission(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedMission.title}</DialogTitle>
              <DialogDescription>
                {selectedMission.location} • {selectedMission.startDate && formatDateTime(selectedMission.startDate)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant={
                  selectedMission.status === 'published' && selectedMission.volunteers.length < selectedMission.maxVolunteers - 2
                    ? 'default'
                    : selectedMission.status === 'published' && selectedMission.volunteers.length >= selectedMission.maxVolunteers - 2 && selectedMission.volunteers.length < selectedMission.maxVolunteers
                    ? 'default'
                    : 'secondary'
                } className={
                  selectedMission.status === 'published' && selectedMission.volunteers.length >= selectedMission.maxVolunteers - 2 && selectedMission.volunteers.length < selectedMission.maxVolunteers
                    ? 'bg-yellow-500'
                    : ''
                }>
                  {selectedMission.status === 'published' && selectedMission.volunteers.length < selectedMission.maxVolunteers - 2 && 'Libre'}
                  {selectedMission.status === 'published' && selectedMission.volunteers.length >= selectedMission.maxVolunteers - 2 && selectedMission.volunteers.length < selectedMission.maxVolunteers && 'Presque complète'}
                  {((selectedMission.status === 'published' && selectedMission.volunteers.length >= selectedMission.maxVolunteers) || selectedMission.status === 'full') && 'Complète'}
                  {selectedMission.status === 'draft' && 'Brouillon'}
                  {selectedMission.status === 'cancelled' && 'Annulée'}
                  {selectedMission.status === 'completed' && 'Terminée'}
                </Badge>
                {selectedMission.isUrgent && (
                  <Badge variant="destructive">URGENT</Badge>
                )}
                <Badge variant="outline">
                  {selectedMission.volunteers.length}/{selectedMission.maxVolunteers} bénévoles
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-3">
                {selectedMission.description}
              </p>
              
              <div className="flex flex-col gap-2 pt-4">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    router.push(`/dashboard/missions/${selectedMission.id}`);
                    setSelectedMission(null);
                  }}
                >
                  <EyeIcon className="h-4 w-4" />
                  Voir les détails
                </Button>
                {canUserEdit && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      router.push(`/dashboard/missions/${selectedMission.id}/edit`);
                      setSelectedMission(null);
                    }}
                  >
                    <EditIcon className="h-4 w-4" />
                    Éditer la mission
                  </Button>
                )}
                {canUserDelete && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      if (onDelete) {
                        onDelete(selectedMission.id);
                        setSelectedMission(null);
                      }
                    }}
                  >
                    <TrashIcon className="h-4 w-4" />
                    Supprimer la mission
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

