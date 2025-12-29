import { MissionClient, UserClient } from '@/types';

/**
 * Formater une date au format iCalendar (YYYYMMDDTHHMMSS)
 */
function formatICalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * Échapper les caractères spéciaux pour le format iCalendar
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Générer un UID unique pour l'événement
 */
function generateUID(missionId: string, domain: string = 'benevoles-festival.fr'): string {
  return `mission-${missionId}@${domain}`;
}

/**
 * Générer un fichier .ics pour une mission
 */
export function generateMissionICS(mission: MissionClient, participants?: UserClient[]): string {
  const now = new Date();
  const startDate = mission.startDate ? new Date(mission.startDate) : now;
  const endDate = mission.endDate ? new Date(mission.endDate) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // +2h par défaut
  
  // Calculer la date du rappel (24h avant)
  const alarmDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
  
  // Construire la description
  let description = escapeICalText(mission.description);
  
  if (participants && participants.length > 0) {
    description += `\\n\\nParticipants (${participants.length}/${mission.maxVolunteers}):`;
    participants.forEach(p => {
      description += `\\n- ${p.firstName} ${p.lastName}`;
    });
  }
  
  // Construire le fichier .ics
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Festival Films Courts Dinan//Benevoles//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Festival Films Courts de Dinan',
    'X-WR-TIMEZONE:Europe/Paris',
    'X-WR-CALDESC:Missions bénévoles du Festival Films Courts de Dinan',
    'BEGIN:VEVENT',
    `UID:${generateUID(mission.id)}`,
    `DTSTAMP:${formatICalDate(now)}`,
    `DTSTART:${formatICalDate(startDate)}`,
    `DTEND:${formatICalDate(endDate)}`,
    `SUMMARY:${escapeICalText(mission.title)}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${escapeICalText(mission.location)}`,
    `STATUS:${mission.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'}`,
    mission.isUrgent ? 'PRIORITY:1' : 'PRIORITY:5',
    'BEGIN:VALARM',
    'TRIGGER:-P1D', // 24h avant
    'ACTION:DISPLAY',
    `DESCRIPTION:Rappel: Mission "${escapeICalText(mission.title)}" demain`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  
  return icsContent;
}

/**
 * Générer un fichier .ics pour plusieurs missions (calendrier complet)
 */
export function generateMultipleMissionsICS(
  missions: MissionClient[],
  userName?: string,
  participantsMap?: Map<string, UserClient[]>
): string {
  const now = new Date();
  
  // Filtrer les missions qui ont une date de début
  const validMissions = missions.filter(m => m.startDate);
  
  if (validMissions.length === 0) {
    throw new Error('Aucune mission avec une date de début');
  }
  
  // Construire l'en-tête du calendrier
  const calendarName = userName 
    ? `Mes Missions - ${userName}` 
    : 'Mes Missions - Festival Films Courts de Dinan';
  
  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Festival Films Courts Dinan//Benevoles//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICalText(calendarName)}`,
    'X-WR-TIMEZONE:Europe/Paris',
    'X-WR-CALDESC:Mes missions bénévoles pour le Festival Films Courts de Dinan',
  ];
  
  // Ajouter chaque mission comme événement
  validMissions.forEach(mission => {
    const startDate = new Date(mission.startDate!);
    const endDate = mission.endDate ? new Date(mission.endDate) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    
    // Construire la description
    let description = escapeICalText(mission.description);
    
    // Ajouter les participants si disponibles
    const participants = participantsMap?.get(mission.id);
    if (participants && participants.length > 0) {
      description += `\\n\\nParticipants (${participants.length}/${mission.maxVolunteers}):`;
      participants.slice(0, 10).forEach(p => {
        description += `\\n- ${p.firstName} ${p.lastName}`;
      });
      if (participants.length > 10) {
        description += `\\n... et ${participants.length - 10} autres`;
      }
    }
    
    // Ajouter l'événement
    icsLines.push(
      'BEGIN:VEVENT',
      `UID:${generateUID(mission.id)}`,
      `DTSTAMP:${formatICalDate(now)}`,
      `DTSTART:${formatICalDate(startDate)}`,
      `DTEND:${formatICalDate(endDate)}`,
      `SUMMARY:${escapeICalText(mission.title)}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${escapeICalText(mission.location)}`,
      `STATUS:${mission.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'}`,
      mission.isUrgent ? 'PRIORITY:1' : 'PRIORITY:5',
      'BEGIN:VALARM',
      'TRIGGER:-P1D', // 24h avant
      'ACTION:DISPLAY',
      `DESCRIPTION:Rappel: Mission "${escapeICalText(mission.title)}" demain à ${startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      'END:VALARM',
      'END:VEVENT'
    );
  });
  
  // Fermer le calendrier
  icsLines.push('END:VCALENDAR');
  
  return icsLines.join('\r\n');
}

/**
 * Télécharger un fichier .ics
 */
export function downloadICSFile(icsContent: string, filename: string = 'missions.ics'): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Générer et télécharger le calendrier complet des missions d'un bénévole
 */
export function exportMissionsToCalendar(
  missions: MissionClient[],
  userName?: string,
  participantsMap?: Map<string, UserClient[]>
): void {
  try {
    const icsContent = generateMultipleMissionsICS(missions, userName, participantsMap);
    const filename = userName 
      ? `missions-${userName.toLowerCase().replace(/\s+/g, '-')}.ics`
      : 'mes-missions.ics';
    downloadICSFile(icsContent, filename);
  } catch (error) {
    console.error('Error exporting missions to calendar:', error);
    throw error;
  }
}














