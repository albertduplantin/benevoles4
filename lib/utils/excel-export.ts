import * as XLSX from 'xlsx-js-style';
import { MissionClient, UserClient } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getCategoryResponsibleByValue } from './category-responsible-helper';

/**
 * Génère un fichier Excel avec la liste des bénévoles d'une mission
 */
export function exportMissionVolunteersExcel(
  mission: MissionClient,
  volunteers: UserClient[],
  categoryResponsible?: UserClient | null
) {
  // Créer un nouveau workbook
  const wb = XLSX.utils.book_new();

  // Préparer les données
  const data = volunteers.map((volunteer) => ({
    Nom: volunteer.lastName,
    Prénom: volunteer.firstName,
    Email: volunteer.email,
    Téléphone: volunteer.phone || 'N/A',
    Rôle: getRoleLabel(volunteer.role),
  }));

  // Créer la feuille
  const ws = XLSX.utils.json_to_sheet(data);

  // Définir la largeur des colonnes
  ws['!cols'] = [
    { wch: 15 }, // Nom
    { wch: 15 }, // Prénom
    { wch: 25 }, // Email
    { wch: 15 }, // Téléphone
    { wch: 15 }, // Rôle
  ];

  // Ajouter la feuille au workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Bénévoles');

  // Ajouter une feuille pour le responsable de catégorie
  if (categoryResponsible) {
    const responsibleData = [{
      Nom: categoryResponsible.firstName,
      Prénom: categoryResponsible.lastName,
      Email: categoryResponsible.email,
      Téléphone: categoryResponsible.phone || 'N/A',
      Catégorie: mission.category,
    }];
    
    const wsResp = XLSX.utils.json_to_sheet(responsibleData);
    wsResp['!cols'] = [
      { wch: 15 }, // Nom
      { wch: 15 }, // Prénom
      { wch: 25 }, // Email
      { wch: 15 }, // Téléphone
      { wch: 20 }, // Catégorie
    ];
    XLSX.utils.book_append_sheet(wb, wsResp, 'Responsable');
  }

  // Télécharger le fichier
  const fileName = `mission-${mission.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-benevoles.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Génère un fichier Excel avec le rapport complet d'une mission
 */
export function exportMissionReportExcel(
  mission: MissionClient,
  volunteers: UserClient[],
  responsibles: UserClient[], // DEPRECATED - Ancien système
  categoryResponsible?: UserClient | null
) {
  const wb = XLSX.utils.book_new();

  // Feuille 1: Informations de la mission
  const missionInfo = [
    ['Titre', mission.title],
    ['Description', mission.description],
    ['Catégorie', mission.category || 'N/A'],
    ['Lieu', mission.location],
    ['Statut', getStatusLabel(mission.status)],
    ['Type', mission.type === 'scheduled' ? 'Planifiée' : 'Ponctuelle'],
    [
      'Date de début',
      mission.startDate
        ? format(new Date(mission.startDate), "dd/MM/yyyy 'à' HH'h'mm", { locale: fr })
        : 'N/A',
    ],
    [
      'Date de fin',
      mission.endDate
        ? format(new Date(mission.endDate), "dd/MM/yyyy 'à' HH'h'mm", { locale: fr })
        : 'N/A',
    ],
    ['Bénévoles max', mission.maxVolunteers.toString()],
    ['Bénévoles inscrits', volunteers.length.toString()],
    ['Places restantes', (mission.maxVolunteers - volunteers.length).toString()],
    ['Urgente', mission.isUrgent ? 'Oui' : 'Non'],
    ['Récurrente', mission.isRecurrent ? 'Oui' : 'Non'],
  ];

  const wsInfo = XLSX.utils.aoa_to_sheet(missionInfo);
  wsInfo['!cols'] = [{ wch: 20 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsInfo, 'Informations');

  // Feuille 2: Responsable de Catégorie
  if (categoryResponsible) {
    const responsibleData = [{
      Nom: categoryResponsible.firstName,
      Prénom: categoryResponsible.lastName,
      Email: categoryResponsible.email,
      Téléphone: categoryResponsible.phone || 'N/A',
      Catégorie: mission.category,
    }];

    const wsResp = XLSX.utils.json_to_sheet(responsibleData);
    wsResp['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsResp, 'Responsable');
  } else {
    // Feuille vide si pas de responsable
    const wsResp = XLSX.utils.aoa_to_sheet([['Aucun responsable assigné à cette catégorie']]);
    wsResp['!cols'] = [{ wch: 50 }];
    XLSX.utils.book_append_sheet(wb, wsResp, 'Responsable');
  }

  // Feuille 3: Bénévoles
  const volunteersData = volunteers.map((volunteer) => ({
    Nom: volunteer.firstName,
    Prénom: volunteer.lastName,
    Email: volunteer.email,
    Téléphone: volunteer.phone || 'N/A',
    Rôle: getRoleLabel(volunteer.role),
  }));

  const wsVol = XLSX.utils.json_to_sheet(volunteersData);
  wsVol['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsVol, 'Bénévoles');

  // Télécharger le fichier
  const fileName = `rapport-mission-${mission.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Génère un fichier Excel avec les statistiques globales
 */
export function exportGlobalStatsExcel(
  missions: MissionClient[],
  totalVolunteers: number
) {
  const wb = XLSX.utils.book_new();

  // Feuille 1: Statistiques générales
  const totalMissions = missions.length;
  const publishedMissions = missions.filter((m) => m.status === 'published').length;
  const completedMissions = missions.filter((m) => m.status === 'completed').length;
  const totalSlots = missions.reduce((sum, m) => sum + m.maxVolunteers, 0);
  const filledSlots = missions.reduce((sum, m) => sum + m.volunteers.length, 0);
  const fillRate = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;

  const stats = [
    ['Indicateur', 'Valeur'],
    ['Total des missions', totalMissions],
    ['Missions publiées', publishedMissions],
    ['Missions terminées', completedMissions],
    ['Total bénévoles actifs', totalVolunteers],
    ['Places disponibles', totalSlots],
    ['Places occupées', filledSlots],
    ['Taux de remplissage', `${fillRate}%`],
    ['', ''],
    ['Rapport généré le', format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })],
  ];

  const wsStats = XLSX.utils.aoa_to_sheet(stats);
  wsStats['!cols'] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsStats, 'Statistiques');

  // Feuille 2: Liste détaillée des missions
  const missionsData = missions.map((mission) => ({
    Titre: mission.title,
    Statut: getStatusLabel(mission.status),
    Type: mission.type === 'scheduled' ? 'Planifiée' : 'Ponctuelle',
    Date: mission.startDate
      ? format(new Date(mission.startDate), 'dd/MM/yyyy HH:mm', { locale: fr })
      : 'N/A',
    Lieu: mission.location,
    'Bénévoles inscrits': mission.volunteers.length,
    'Places max': mission.maxVolunteers,
    'Taux remplissage': `${Math.round((mission.volunteers.length / mission.maxVolunteers) * 100)}%`,
    Urgente: mission.isUrgent ? 'Oui' : 'Non',
    Récurrente: mission.isRecurrent ? 'Oui' : 'Non',
  }));

  const wsMissions = XLSX.utils.json_to_sheet(missionsData);
  wsMissions['!cols'] = [
    { wch: 30 }, // Titre
    { wch: 12 }, // Statut
    { wch: 12 }, // Type
    { wch: 18 }, // Date
    { wch: 20 }, // Lieu
    { wch: 15 }, // Bénévoles inscrits
    { wch: 12 }, // Places max
    { wch: 18 }, // Taux remplissage
    { wch: 10 }, // Urgente
    { wch: 12 }, // Récurrente
  ];
  XLSX.utils.book_append_sheet(wb, wsMissions, 'Missions');

  // Feuille 3: Missions par statut
  const statusCounts = missions.reduce((acc, mission) => {
    acc[mission.status] = (acc[mission.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    Statut: getStatusLabel(status),
    'Nombre de missions': count,
  }));

  const wsStatus = XLSX.utils.json_to_sheet(statusData);
  wsStatus['!cols'] = [{ wch: 20 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsStatus, 'Par Statut');

  // Télécharger le fichier
  const fileName = `statistiques-festival-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Génère un fichier Excel avec toutes les données pour archivage
 */
export function exportFullDataExcel(
  missions: MissionClient[],
  allVolunteers: Map<string, UserClient>
) {
  const wb = XLSX.utils.book_new();

  // Feuille 1: Toutes les missions
  const missionsData = missions.map((mission) => ({
    ID: mission.id,
    Titre: mission.title,
    Description: mission.description,
    Statut: getStatusLabel(mission.status),
    Type: mission.type === 'scheduled' ? 'Planifiée' : 'Ponctuelle',
    'Date début': mission.startDate
      ? format(new Date(mission.startDate), 'dd/MM/yyyy HH:mm', { locale: fr })
      : 'N/A',
    'Date fin': mission.endDate
      ? format(new Date(mission.endDate), 'dd/MM/yyyy HH:mm', { locale: fr })
      : 'N/A',
    Lieu: mission.location,
    'Places max': mission.maxVolunteers,
    'Bénévoles inscrits': mission.volunteers.length,
    Urgente: mission.isUrgent ? 'Oui' : 'Non',
    Récurrente: mission.isRecurrent ? 'Oui' : 'Non',
    'Créée le': format(new Date(mission.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr }),
  }));

  const wsMissions = XLSX.utils.json_to_sheet(missionsData);
  wsMissions['!cols'] = [
    { wch: 25 }, // ID
    { wch: 30 }, // Titre
    { wch: 40 }, // Description
    { wch: 12 }, // Statut
    { wch: 12 }, // Type
    { wch: 18 }, // Date début
    { wch: 18 }, // Date fin
    { wch: 20 }, // Lieu
    { wch: 12 }, // Places max
    { wch: 15 }, // Bénévoles inscrits
    { wch: 10 }, // Urgente
    { wch: 12 }, // Récurrente
    { wch: 18 }, // Créée le
  ];
  XLSX.utils.book_append_sheet(wb, wsMissions, 'Missions');

  // Feuille 2: Tous les bénévoles
  const volunteersData = Array.from(allVolunteers.values())
    .filter((volunteer) => volunteer.email) // Filtrer les entrées vides
    .map((volunteer) => ({
      ID: volunteer.uid,
      Nom: volunteer.firstName,
      Prénom: volunteer.lastName,
      Email: volunteer.email,
      Téléphone: volunteer.phone || 'N/A',
      Rôle: getRoleLabel(volunteer.role),
      'Inscrit le': volunteer.createdAt 
        ? format(new Date(volunteer.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })
        : 'N/A',
    }));

  const wsVolunteers = XLSX.utils.json_to_sheet(volunteersData);
  wsVolunteers['!cols'] = [
    { wch: 30 }, // ID
    { wch: 15 }, // Nom
    { wch: 15 }, // Prénom
    { wch: 25 }, // Email
    { wch: 15 }, // Téléphone
    { wch: 15 }, // Rôle
    { wch: 18 }, // Inscrit le
  ];
  XLSX.utils.book_append_sheet(wb, wsVolunteers, 'Bénévoles');

  // Feuille 3: Inscriptions (relation mission-bénévole)
  const registrations: any[] = [];
  missions.forEach((mission) => {
    mission.volunteers.forEach((volunteerId) => {
      const volunteer = allVolunteers.get(volunteerId);
      if (volunteer) {
        registrations.push({
          'ID Mission': mission.id,
          'Titre Mission': mission.title,
          'Date Mission': mission.startDate
            ? format(new Date(mission.startDate), 'dd/MM/yyyy', { locale: fr })
            : 'N/A',
          'ID Bénévole': volunteer.uid,
          'Nom Bénévole': `${volunteer.firstName} ${volunteer.lastName}`,
          'Email Bénévole': volunteer.email,
        });
      }
    });
  });

  const wsRegistrations = XLSX.utils.json_to_sheet(registrations);
  wsRegistrations['!cols'] = [
    { wch: 25 }, // ID Mission
    { wch: 30 }, // Titre Mission
    { wch: 15 }, // Date Mission
    { wch: 30 }, // ID Bénévole
    { wch: 25 }, // Nom Bénévole
    { wch: 25 }, // Email Bénévole
  ];
  XLSX.utils.book_append_sheet(wb, wsRegistrations, 'Inscriptions');

  // Télécharger le fichier
  const fileName = `export-complet-festival-${format(new Date(), 'yyyy-MM-dd-HHmm')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Génère un fichier Excel avec le planning global de toutes les missions (Admin)
 */
export function exportGlobalPlanningExcel(
  missions: MissionClient[],
  allVolunteers: Map<string, UserClient>
) {
  const wb = XLSX.utils.book_new();

  // Trier les missions par date
  const sortedMissions = missions
    .filter(m => m.status !== 'cancelled')
    .sort((a, b) => {
      if (!a.startDate) return 1;
      if (!b.startDate) return -1;
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });

  // Feuille 1: Planning Global
  const planningData = sortedMissions.map((mission) => ({
    Titre: mission.title,
    Date: mission.startDate
      ? format(new Date(mission.startDate), "EEEE d MMMM yyyy 'à' HH'h'mm", { locale: fr })
      : 'Date non définie',
    'Heure début': mission.startDate
      ? format(new Date(mission.startDate), 'HH:mm', { locale: fr })
      : 'N/A',
    'Heure fin': mission.endDate
      ? format(new Date(mission.endDate), 'HH:mm', { locale: fr })
      : 'N/A',
    Lieu: mission.location,
    Statut: getStatusLabel(mission.status),
    Type: mission.type === 'scheduled' ? 'Planifiée' : 'Ponctuelle',
    'Bénévoles inscrits': mission.volunteers.length,
    'Places totales': mission.maxVolunteers,
    'Places restantes': mission.maxVolunteers - mission.volunteers.length,
    Urgent: mission.isUrgent ? 'Oui' : 'Non',
    'Nombre responsables': mission.responsibles.length,
  }));

  const wsPlanning = XLSX.utils.json_to_sheet(planningData);
  wsPlanning['!cols'] = [
    { wch: 30 }, // Titre
    { wch: 35 }, // Date
    { wch: 12 }, // Heure début
    { wch: 12 }, // Heure fin
    { wch: 25 }, // Lieu
    { wch: 12 }, // Statut
    { wch: 12 }, // Type
    { wch: 18 }, // Bénévoles inscrits
    { wch: 15 }, // Places totales
    { wch: 18 }, // Places restantes
    { wch: 10 }, // Urgent
    { wch: 18 }, // Nombre responsables
  ];
  XLSX.utils.book_append_sheet(wb, wsPlanning, 'Planning Global');

  // Feuille 2: Bénévoles par Mission
  const volunteersData: any[] = [];
  sortedMissions.forEach((mission) => {
    // Header de mission
    volunteersData.push({
      Mission: `--- ${mission.title.toUpperCase()} ---`,
      Date: mission.startDate
        ? format(new Date(mission.startDate), 'dd/MM/yyyy HH:mm', { locale: fr })
        : 'N/A',
      Nom: '',
      Prénom: '',
      Téléphone: '',
      Email: '',
      Rôle: '',
      'Est Responsable': '',
    });

    // Bénévoles de la mission
    mission.volunteers.forEach((volunteerId) => {
      const volunteer = allVolunteers.get(volunteerId);
      if (volunteer) {
        volunteersData.push({
          Mission: mission.title,
          Date: mission.startDate
            ? format(new Date(mission.startDate), 'dd/MM/yyyy', { locale: fr })
            : 'N/A',
          Nom: volunteer.lastName,
          Prénom: volunteer.firstName,
          Téléphone: volunteer.phone || 'N/A',
          Email: volunteer.email,
          Rôle: getRoleLabel(volunteer.role),
          'Est Responsable': mission.responsibles.includes(volunteerId) ? 'Oui' : 'Non',
        });
      }
    });

    // Ligne vide entre les missions
    volunteersData.push({
      Mission: '',
      Date: '',
      Nom: '',
      Prénom: '',
      Téléphone: '',
      Email: '',
      Rôle: '',
      'Est Responsable': '',
    });
  });

  const wsVolunteers = XLSX.utils.json_to_sheet(volunteersData);
  wsVolunteers['!cols'] = [
    { wch: 30 }, // Mission
    { wch: 15 }, // Date
    { wch: 20 }, // Nom
    { wch: 20 }, // Prénom
    { wch: 15 }, // Téléphone
    { wch: 30 }, // Email
    { wch: 15 }, // Rôle
    { wch: 18 }, // Est Responsable
  ];
  XLSX.utils.book_append_sheet(wb, wsVolunteers, 'Bénévoles par Mission');

  // Feuille 3: Statistiques par Mission
  const statsData = sortedMissions.map((mission) => ({
    Mission: mission.title,
    Date: mission.startDate
      ? format(new Date(mission.startDate), 'dd/MM/yyyy', { locale: fr })
      : 'N/A',
    'Bénévoles': mission.volunteers.length,
    'Capacité': mission.maxVolunteers,
    'Taux remplissage': `${Math.round((mission.volunteers.length / mission.maxVolunteers) * 100)}%`,
    'Responsables': mission.responsibles.length,
    Statut: getStatusLabel(mission.status),
  }));

  const wsStats = XLSX.utils.json_to_sheet(statsData);
  wsStats['!cols'] = [
    { wch: 30 }, // Mission
    { wch: 12 }, // Date
    { wch: 12 }, // Bénévoles
    { wch: 10 }, // Capacité
    { wch: 16 }, // Taux remplissage
    { wch: 14 }, // Responsables
    { wch: 12 }, // Statut
  ];
  XLSX.utils.book_append_sheet(wb, wsStats, 'Statistiques');

  // Télécharger le fichier
  const fileName = `planning-global-festival-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Génère un fichier Excel avec le planning personnel d'un bénévole
 */
export async function exportVolunteerPlanningExcel(
  missions: MissionClient[],
  volunteerName: string,
  allParticipants: Map<string, UserClient[]> // Map mission.id -> participants
) {
  const wb = XLSX.utils.book_new();

  // Feuille 1: Mon Planning
  const planningData = missions
    .sort((a, b) => {
      if (!a.startDate) return 1;
      if (!b.startDate) return -1;
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    })
    .map((mission) => ({
      Titre: mission.title,
      Date: mission.startDate
        ? format(new Date(mission.startDate), "EEEE d MMMM yyyy 'à' HH'h'mm", { locale: fr })
        : 'Date non définie',
      Heure: mission.startDate
        ? format(new Date(mission.startDate), 'HH:mm', { locale: fr })
        : 'N/A',
      Lieu: mission.location,
      Statut: getStatusLabel(mission.status),
      Description: mission.description.length > 100
        ? mission.description.substring(0, 100) + '...'
        : mission.description,
    }));

  const wsPlanning = XLSX.utils.json_to_sheet(planningData);
  wsPlanning['!cols'] = [
    { wch: 30 }, // Titre
    { wch: 30 }, // Date
    { wch: 10 }, // Heure
    { wch: 25 }, // Lieu
    { wch: 12 }, // Statut
    { wch: 50 }, // Description
  ];
  XLSX.utils.book_append_sheet(wb, wsPlanning, 'Mon Planning');

  // Feuille 2: Contacts par Mission
  const contactsData: any[] = [];
  
  for (const mission of missions) {
    const participants = allParticipants.get(mission.id) || [];
    
    // Ajouter un header pour chaque mission
    contactsData.push({
      Mission: `--- ${mission.title.toUpperCase()} ---`,
      'Catégorie': mission.category || 'N/A',
      Nom: '',
      Téléphone: '',
      Email: '',
      Rôle: '',
    });

    // Ajouter d'abord le responsable de catégorie
    if (mission.category) {
      try {
        const categoryResponsible = await getCategoryResponsibleByValue(mission.category);
        if (categoryResponsible) {
          contactsData.push({
            Mission: mission.title,
            'Catégorie': mission.category,
            Nom: `${categoryResponsible.firstName} ${categoryResponsible.lastName}`,
            Téléphone: categoryResponsible.phone || 'N/A',
            Email: categoryResponsible.email,
            Rôle: '⭐ RESPONSABLE CATÉGORIE',
          });
        }
      } catch (error) {
        console.error('Error fetching category responsible for Excel export:', error);
      }
    }

    // Ajouter les autres participants
    participants.forEach((participant) => {
      contactsData.push({
        Mission: mission.title,
        'Catégorie': mission.category || 'N/A',
        Nom: `${participant.firstName} ${participant.lastName}`,
        Téléphone: participant.phone || 'N/A',
        Email: participant.email,
        Rôle: getRoleLabel(participant.role),
      });
    });

    // Ligne vide entre les missions
    contactsData.push({
      Mission: '',
      'Catégorie': '',
      Nom: '',
      Téléphone: '',
      Email: '',
      Rôle: '',
    });
  }

  const wsContacts = XLSX.utils.json_to_sheet(contactsData);
  wsContacts['!cols'] = [
    { wch: 30 }, // Mission
    { wch: 25 }, // Catégorie
    { wch: 25 }, // Nom
    { wch: 15 }, // Téléphone
    { wch: 30 }, // Email
    { wch: 25 }, // Rôle
  ];
  XLSX.utils.book_append_sheet(wb, wsContacts, 'Contacts');

  // Télécharger le fichier
  const fileName = `mon-planning-benevole-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Génère un fichier Excel avec les affectations de tous les bénévoles
 * Liste chaque bénévole avec toutes ses missions
 */
export function exportVolunteerAssignmentsExcel(
  volunteers: UserClient[],
  missions: MissionClient[]
) {
  const wb = XLSX.utils.book_new();

  // Préparer les données : chaque ligne = un bénévole avec une mission
  const assignmentsData: any[] = [];

  volunteers
    .sort((a, b) => a.lastName.localeCompare(b.lastName))
    .forEach((volunteer) => {
      // Trouver toutes les missions où ce bénévole est inscrit
      const volunteerMissions = missions
        .filter((m) => m.volunteers.includes(volunteer.uid))
        .sort((a, b) => {
          // Trier par date
          if (!a.startDate && !b.startDate) return 0;
          if (!a.startDate) return -1;
          if (!b.startDate) return 1;
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        });

      if (volunteerMissions.length === 0) {
        // Bénévole sans mission
        assignmentsData.push({
          Nom: volunteer.lastName,
          Prénom: volunteer.firstName,
          Email: volunteer.email,
          Téléphone: volunteer.phone || 'N/A',
          'Nombre de missions': 0,
          'Titre mission': 'Aucune mission',
          Date: '',
          Horaire: '',
          Lieu: '',
          Catégorie: '',
        });
      } else {
        // Pour chaque mission, créer une ligne
        volunteerMissions.forEach((mission, index) => {
          const startDate = mission.startDate ? new Date(mission.startDate) : null;
          const endDate = mission.endDate ? new Date(mission.endDate) : null;

          assignmentsData.push({
            Nom: index === 0 ? volunteer.lastName : '', // Afficher le nom uniquement sur la 1ère ligne
            Prénom: index === 0 ? volunteer.firstName : '',
            Email: index === 0 ? volunteer.email : '',
            Téléphone: index === 0 ? (volunteer.phone || 'N/A') : '',
            'Nombre de missions': index === 0 ? volunteerMissions.length : '',
            'Titre mission': mission.title,
            Date: startDate
              ? format(startDate, 'dd/MM/yyyy', { locale: fr })
              : 'Au long cours',
            Horaire: startDate && endDate
              ? `${format(startDate, 'HH:mm', { locale: fr })} - ${format(endDate, 'HH:mm', { locale: fr })}`
              : '',
            Lieu: mission.location,
            Catégorie: mission.category || 'N/A',
          });
        });

        // Ajouter une ligne vide entre chaque bénévole
        assignmentsData.push({
          Nom: '',
          Prénom: '',
          Email: '',
          Téléphone: '',
          'Nombre de missions': '',
          'Titre mission': '',
          Date: '',
          Horaire: '',
          Lieu: '',
          Catégorie: '',
        });
      }
    });

  // Créer la feuille
  const ws = XLSX.utils.json_to_sheet(assignmentsData);

  // Définir la largeur des colonnes
  ws['!cols'] = [
    { wch: 20 }, // Nom
    { wch: 20 }, // Prénom
    { wch: 30 }, // Email
    { wch: 15 }, // Téléphone
    { wch: 18 }, // Nombre de missions
    { wch: 40 }, // Titre mission
    { wch: 15 }, // Date
    { wch: 20 }, // Horaire
    { wch: 30 }, // Lieu
    { wch: 25 }, // Catégorie
  ];

  // Ajouter la feuille au workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Affectations');

  // Créer une feuille de statistiques
  const statsData = [
    ['STATISTIQUES GLOBALES', ''],
    ['', ''],
    ['Nombre total de bénévoles', volunteers.length],
    ['Nombre total de missions', missions.length],
    [
      'Bénévoles avec missions',
      volunteers.filter((v) => missions.some((m) => m.volunteers.includes(v.uid))).length,
    ],
    [
      'Bénévoles sans mission',
      volunteers.filter((v) => !missions.some((m) => m.volunteers.includes(v.uid))).length,
    ],
  ];

  const wsStats = XLSX.utils.aoa_to_sheet(statsData);
  wsStats['!cols'] = [{ wch: 35 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsStats, 'Statistiques');

  // Télécharger le fichier
  const fileName = `affectations-benevoles-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Génère un tableau croisé Excel : bénévoles (lignes) × missions (colonnes) avec couleurs par catégorie
 */
export function exportVolunteerMissionGridExcel(
  volunteers: UserClient[],
  missions: MissionClient[]
) {
  const wb = XLSX.utils.book_new();

  // Grouper les missions par catégorie
  const missionsByCategory = new Map<string, MissionClient[]>();
  missions.forEach((mission) => {
    const category = mission.category || 'Sans catégorie';
    if (!missionsByCategory.has(category)) {
      missionsByCategory.set(category, []);
    }
    missionsByCategory.get(category)!.push(mission);
  });

  // Trier les missions par catégorie, puis par date
  const sortedCategories = Array.from(missionsByCategory.keys()).sort();
  sortedCategories.forEach((category) => {
    missionsByCategory.get(category)!.sort((a, b) => {
      if (!a.startDate && !b.startDate) return 0;
      if (!a.startDate) return -1;
      if (!b.startDate) return 1;
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
  });

  // Trier les bénévoles par nom
  const sortedVolunteers = [...volunteers].sort((a, b) =>
    a.lastName.localeCompare(b.lastName)
  );

  // Créer les en-têtes - INVERSÉ : bénévoles en colonnes
  const headers: string[] = ['Mission'];
  sortedVolunteers.forEach((volunteer) => {
    headers.push(`${volunteer.firstName} ${volunteer.lastName}`);
  });

  // Créer les lignes de données - Une ligne par mission
  const data: any[][] = [headers];
  const missionCategories: string[] = []; // Pour tracer quelle ligne appartient à quelle catégorie

  sortedCategories.forEach((category) => {
    const categoryMissions = missionsByCategory.get(category)!;
    categoryMissions.forEach((mission) => {
      // Formater le nom de la mission avec date et heure
      let missionLabel = mission.title;
      if (mission.startDate) {
        const dateStr = format(new Date(mission.startDate), 'dd/MM', { locale: fr });
        const timeStr = format(new Date(mission.startDate), 'HH:mm', { locale: fr });
        missionLabel = `${dateStr} ${timeStr} - ${mission.title}`;
      }

      const row: any[] = [missionLabel];
      missionCategories.push(category);

      // Pour chaque bénévole, vérifier s'il est affecté
      sortedVolunteers.forEach((volunteer) => {
        const isAssigned = mission.volunteers.includes(volunteer.uid);
        row.push(isAssigned ? 'X' : '');
      });

      data.push(row);
    });
  });

  // Créer la feuille
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Définir la largeur des colonnes
  const colWidths = [{ wch: 40 }]; // Colonne des missions (plus large pour date + titre)
  sortedVolunteers.forEach(() => colWidths.push({ wch: 4 })); // Colonnes bénévoles (étroites)
  ws['!cols'] = colWidths;

  // Définir la hauteur de la ligne d'en-tête pour les noms en rotation
  ws['!rows'] = [{ hpt: 120 }]; // Hauteur de 120 pour l'en-tête

  // Appliquer les couleurs et styles - Couleurs vives pour meilleure visibilité
  const categoryColors: Record<string, { fgColor: { rgb: string } }> = {};
  const colors = [
    'FFFF00', // Jaune vif
    'FF9900', // Orange vif
    '00CCFF', // Bleu ciel
    '00FF00', // Vert vif
    'FF66CC', // Rose vif
    'CC66FF', // Violet vif
    'FF6600', // Orange rouge
    '00FFFF', // Cyan vif
    'FFCC00', // Or
    '66FF66', // Vert clair
    'FF3399', // Rose fuchsia
    '9999FF', // Bleu lavande
  ];
  
  let colorIndex = 0;
  sortedCategories.forEach((category) => {
    categoryColors[category] = { fgColor: { rgb: colors[colorIndex % colors.length] } };
    colorIndex++;
  });

  // Pas de fusion nécessaire avec la nouvelle orientation

  // Appliquer les styles aux cellules
  const range = XLSX.utils.decode_range(ws['!ref']!);
  
  for (let C = range.s.c; C <= range.e.c; ++C) {
    for (let R = range.s.r; R <= range.e.r; ++R) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      
      if (!ws[cellAddress]) {
        // Créer une cellule vide pour pouvoir appliquer les styles
        ws[cellAddress] = { t: 's', v: '' };
      }

      // En-tête (ligne 0)
      if (R === 0) {
        ws[cellAddress].s = {
          fill: { 
            patternType: 'solid',
            fgColor: { rgb: 'D0D0D0' },
            bgColor: { rgb: 'D0D0D0' }
          },
          font: { 
            bold: true, 
            sz: 8,
            name: 'Arial'
          },
          alignment: { 
            horizontal: 'center', 
            vertical: 'center',
            textRotation: C === 0 ? 0 : 90 // Rotation à 90° pour les noms de bénévoles
          },
          border: {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' },
          },
        };
      }

      // Cellules de données (lignes > 0)
      if (R > 0) {
        const category = missionCategories[R - 1]; // -1 car première ligne est l'en-tête
        const cellValue = ws[cellAddress]?.v;
        const isAssigned = cellValue === 'X';
        
        // Construire le style de la cellule
        const cellStyle: any = {
          font: { 
            sz: 9,
            name: 'Arial',
            bold: isAssigned // X en gras
          },
          alignment: { 
            horizontal: C === 0 ? 'left' : 'center', 
            vertical: 'center',
            wrapText: C === 0
          },
          border: {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' },
          },
        };
        
        // Appliquer la couleur de catégorie
        if (category && categoryColors[category]) {
          const colorRgb = categoryColors[category].fgColor.rgb;
          
          // Colonne A (Mission) : toujours colorée selon la catégorie
          if (C === 0) {
            cellStyle.fill = {
              patternType: 'solid',
              fgColor: { rgb: colorRgb },
              bgColor: { rgb: colorRgb }
            };
          }
          // Autres colonnes : colorées seulement si X présent
          else if (isAssigned) {
            cellStyle.fill = {
              patternType: 'solid',
              fgColor: { rgb: colorRgb },
              bgColor: { rgb: colorRgb }
            };
          }
        }
        
        ws[cellAddress].s = cellStyle;
      }
    }
  }

  // Figer les volets (première colonne et première ligne)
  ws['!freeze'] = { xSplit: 1, ySplit: 1 };

  XLSX.utils.book_append_sheet(wb, ws, 'Planning Visuel');

  // Créer une feuille de légende
  const legendData = [
    ['LÉGENDE DES CATÉGORIES', ''],
    ['', ''],
  ];
  
  const categoryStartRow = 2;
  sortedCategories.forEach((category) => {
    const missionCount = missionsByCategory.get(category)!.length;
    legendData.push([category, `${missionCount} mission${missionCount > 1 ? 's' : ''}`]);
  });

  legendData.push(['', '']);
  legendData.push(['STATISTIQUES', '']);
  legendData.push(['Total bénévoles', volunteers.length.toString()]);
  legendData.push(['Total missions', missions.length.toString()]);
  legendData.push([
    'Bénévoles avec missions',
    volunteers.filter((v) => missions.some((m) => m.volunteers.includes(v.uid))).length.toString(),
  ]);

  const wsLegend = XLSX.utils.aoa_to_sheet(legendData);
  wsLegend['!cols'] = [{ wch: 30 }, { wch: 20 }];
  
  // Appliquer les couleurs aux catégories dans la légende
  sortedCategories.forEach((category, index) => {
    const rowIndex = categoryStartRow + index;
    const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: 0 });
    if (wsLegend[cellAddress]) {
      const colorRgb = categoryColors[category]?.fgColor?.rgb || 'FFFFFF';
      wsLegend[cellAddress].s = {
        fill: {
          patternType: 'solid',
          fgColor: { rgb: colorRgb },
          bgColor: { rgb: colorRgb }
        },
        font: { 
          bold: true,
          name: 'Arial'
        },
        alignment: { horizontal: 'left', vertical: 'center' },
        border: {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
        },
      };
    }
  });
  
  XLSX.utils.book_append_sheet(wb, wsLegend, 'Légende');

  // Télécharger le fichier avec support des styles
  const fileName = `planning-visuel-benevoles-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(wb, fileName, { bookType: 'xlsx', type: 'binary' });
}

// Helpers
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Brouillon',
    published: 'Publiée',
    full: 'Complète',
    cancelled: 'Annulée',
    completed: 'Terminée',
  };
  return labels[status] || status;
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    volunteer: 'Bénévole',
    mission_responsible: 'Responsable',
    admin: 'Administrateur',
  };
  return labels[role] || role;
}

