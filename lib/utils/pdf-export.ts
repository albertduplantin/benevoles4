import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MissionClient, UserClient } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getCategoryResponsibleByValue, getCategoryResponsiblesByValue } from './category-responsible-helper';
import { getUserById } from '@/lib/api/users';

/**
 * Génère un PDF avec la liste des bénévoles d'une mission
 */
export async function exportMissionVolunteersPDF(
  mission: MissionClient,
  volunteers: UserClient[],
  categoryResponsible?: UserClient | null
) {
  const doc = new jsPDF();

  // En-tête
  doc.setFontSize(20);
  doc.text('Festival Films Courts de Dinan 2025', 105, 20, { align: 'center' });

  doc.setFontSize(16);
  doc.text(`Mission: ${mission.title}`, 105, 30, { align: 'center' });

  // Informations de la mission
  doc.setFontSize(10);
  let yPos = 45;

  if (mission.category) {
    doc.text(`Catégorie: ${mission.category}`, 20, yPos);
    yPos += 7;
  }

  if (categoryResponsible) {
    doc.setFont('helvetica', 'bold');
    doc.text(`Responsable: ${categoryResponsible.firstName} ${categoryResponsible.lastName}`, 20, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 5;
    doc.setFontSize(9);
    doc.text(`Email: ${categoryResponsible.email}`, 25, yPos);
    yPos += 5;
    if (categoryResponsible.phone) {
      doc.text(`Tel: ${categoryResponsible.phone}`, 25, yPos);
      yPos += 5;
    }
    doc.setFontSize(10);
    yPos += 2;
  }

  if (mission.startDate) {
    const dateStr = format(new Date(mission.startDate), "EEEE d MMMM yyyy 'à' HH'h'mm", {
      locale: fr,
    });
    doc.text(`Date: ${dateStr}`, 20, yPos);
    yPos += 7;
  }

  doc.text(`Lieu: ${mission.location}`, 20, yPos);
  yPos += 7;

  doc.text(
    `Bénévoles: ${volunteers.length} / ${mission.maxVolunteers}`,
    20,
    yPos
  );
  yPos += 7;

  doc.text(`Statut: ${getStatusLabel(mission.status)}`, 20, yPos);
  yPos += 15;

  // Tableau des bénévoles
  const tableData = volunteers.map((volunteer) => [
    `${volunteer.firstName} ${volunteer.lastName}`,
    volunteer.email,
    volunteer.phone || 'N/A',
    getRoleLabel(volunteer.role),
  ]);

  autoTable(doc, {
    head: [['Nom', 'Email', 'Téléphone', 'Rôle']],
    body: tableData,
    startY: yPos,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
  });

  // Pied de page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`,
      20,
      doc.internal.pageSize.height - 10
    );
    doc.text(
      `Page ${i} / ${pageCount}`,
      doc.internal.pageSize.width - 40,
      doc.internal.pageSize.height - 10
    );
  }

  // Télécharger le PDF
  const fileName = `mission-${mission.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-benevoles.pdf`;
  doc.save(fileName);
}

/**
 * Génère un PDF avec le rapport complet d'une mission
 */
export async function exportMissionReportPDF(
  mission: MissionClient,
  volunteers: UserClient[],
  responsibles: UserClient[], // DEPRECATED - Ancien système
  categoryResponsible?: UserClient | null
) {
  const doc = new jsPDF();

  // En-tête
  doc.setFontSize(20);
  doc.text('Festival Films Courts de Dinan 2025', 105, 20, { align: 'center' });

  doc.setFontSize(16);
  doc.text('Rapport de Mission', 105, 30, { align: 'center' });

  // Titre de la mission
  doc.setFontSize(14);
  doc.text(mission.title, 105, 45, { align: 'center' });

  let yPos = 60;

  // Section Informations Générales
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Informations Générales', 20, yPos);
  yPos += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  if (mission.startDate) {
    const dateStr = format(new Date(mission.startDate), "EEEE d MMMM yyyy 'à' HH'h'mm", {
      locale: fr,
    });
    doc.text(`Date: ${dateStr}`, 25, yPos);
    yPos += 7;
  }

  doc.text(`Lieu: ${mission.location}`, 25, yPos);
  yPos += 7;

  doc.text(`Statut: ${getStatusLabel(mission.status)}`, 25, yPos);
  yPos += 7;

  doc.text(`Type: ${mission.type === 'scheduled' ? 'Planifiée' : 'Ponctuelle'}`, 25, yPos);
  yPos += 7;

  if (mission.isUrgent) {
    doc.setTextColor(239, 68, 68);
    doc.text('[URGENT] Mission Urgente', 25, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 7;
  }

  if (mission.isRecurrent) {
    doc.text('[RECURRENT] Mission Récurrente', 25, yPos);
    yPos += 7;
  }

  yPos += 5;

  // Description
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Description', 20, yPos);
  yPos += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const descriptionLines = doc.splitTextToSize(mission.description, 170);
  doc.text(descriptionLines, 25, yPos);
  yPos += descriptionLines.length * 7 + 10;

  // Section Responsable de Catégorie
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Responsable de Catégorie', 20, yPos);
  yPos += 10;

  if (categoryResponsible) {
    const responsibleData = [[
      `${categoryResponsible.firstName} ${categoryResponsible.lastName}`,
      categoryResponsible.email,
      categoryResponsible.phone || 'N/A',
    ]];

    autoTable(doc, {
      head: [['Nom', 'Email', 'Téléphone']],
      body: responsibleData,
      startY: yPos,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Aucun responsable assigné pour cette catégorie', 25, yPos);
    yPos += 15;
  }

  // Section Bénévoles
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `Bénévoles Inscrits (${volunteers.length} / ${mission.maxVolunteers})`,
    20,
    yPos
  );
  yPos += 10;

  if (volunteers.length > 0) {
    const volunteersData = volunteers.map((volunteer) => [
      `${volunteer.firstName} ${volunteer.lastName}`,
      volunteer.email,
      volunteer.phone || 'N/A',
    ]);

    autoTable(doc, {
      head: [['Nom', 'Email', 'Téléphone']],
      body: volunteersData,
      startY: yPos,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
    });
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Aucun bénévole inscrit', 25, yPos);
  }

  // Pied de page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`,
      20,
      doc.internal.pageSize.height - 10
    );
    doc.text(
      `Page ${i} / ${pageCount}`,
      doc.internal.pageSize.width - 40,
      doc.internal.pageSize.height - 10
    );
  }

  // Télécharger le PDF
  const fileName = `rapport-mission-${mission.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`;
  doc.save(fileName);
}

/**
 * Génère un PDF avec les statistiques globales
 */
export async function exportGlobalStatsPDF(
  missions: MissionClient[],
  totalVolunteers: number
) {
  const doc = new jsPDF();

  // En-tête
  doc.setFontSize(20);
  doc.text('Festival Films Courts de Dinan 2025', 105, 20, { align: 'center' });

  doc.setFontSize(16);
  doc.text('Rapport de Statistiques', 105, 30, { align: 'center' });

  let yPos = 50;

  // Statistiques Générales
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Statistiques Générales', 20, yPos);
  yPos += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const totalMissions = missions.length;
  const publishedMissions = missions.filter((m) => m.status === 'published').length;
  const completedMissions = missions.filter((m) => m.status === 'completed').length;
  const totalSlots = missions.reduce((sum, m) => sum + m.maxVolunteers, 0);
  const filledSlots = missions.reduce((sum, m) => sum + m.volunteers.length, 0);
  const fillRate = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;

  doc.text(`Total des missions: ${totalMissions}`, 25, yPos);
  yPos += 7;
  doc.text(`Missions publiées: ${publishedMissions}`, 25, yPos);
  yPos += 7;
  doc.text(`Missions terminées: ${completedMissions}`, 25, yPos);
  yPos += 7;
  doc.text(`Total bénévoles actifs: ${totalVolunteers}`, 25, yPos);
  yPos += 7;
  doc.text(`Places disponibles: ${totalSlots}`, 25, yPos);
  yPos += 7;
  doc.text(`Places occupées: ${filledSlots}`, 25, yPos);
  yPos += 7;
  doc.text(`Taux de remplissage: ${fillRate}%`, 25, yPos);
  yPos += 15;

  // Tableau des missions
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Détail des Missions', 20, yPos);
  yPos += 10;

  const missionsData = missions.map((mission) => [
    mission.title,
    getStatusLabel(mission.status),
    `${mission.volunteers.length}/${mission.maxVolunteers}`,
    mission.startDate
      ? format(new Date(mission.startDate), 'dd/MM/yyyy', { locale: fr })
      : 'N/A',
  ]);

  autoTable(doc, {
    head: [['Mission', 'Statut', 'Bénévoles', 'Date']],
    body: missionsData,
    startY: yPos,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
  });

  // Pied de page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`,
      20,
      doc.internal.pageSize.height - 10
    );
    doc.text(
      `Page ${i} / ${pageCount}`,
      doc.internal.pageSize.width - 40,
      doc.internal.pageSize.height - 10
    );
  }

  // Télécharger le PDF
  const fileName = `statistiques-festival-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}

/**
 * Génère un PDF avec le planning global de toutes les missions (Admin)
 */
export async function exportGlobalPlanningPDF(
  missions: MissionClient[],
  allVolunteers: Map<string, UserClient>
) {
  const doc = new jsPDF();
  let currentPage = 1;

  // En-tête
  doc.setFontSize(20);
  doc.text('Festival Films Courts de Dinan 2025', 105, 20, { align: 'center' });

  doc.setFontSize(16);
  doc.text('Planning Global du Festival', 105, 30, { align: 'center' });

  doc.setFontSize(10);
  doc.text(
    `Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`,
    105,
    40,
    { align: 'center' }
  );

  let yPos = 55;

  // Trier les missions par date
  const sortedMissions = missions
    .filter((m) => m.status !== 'cancelled')
    .sort((a, b) => {
      if (!a.startDate) return 1;
      if (!b.startDate) return -1;
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });

  // Statistiques globales
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Résumé Global', 20, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const totalVolunteers = new Set(sortedMissions.flatMap((m) => m.volunteers)).size;
  const totalSlots = sortedMissions.reduce((sum, m) => sum + m.maxVolunteers, 0);
  const filledSlots = sortedMissions.reduce((sum, m) => sum + m.volunteers.length, 0);
  const fillRate = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;

  doc.text(`Total missions: ${sortedMissions.length}`, 25, yPos);
  yPos += 6;
  doc.text(`Total bénévoles uniques: ${totalVolunteers}`, 25, yPos);
  yPos += 6;
  doc.text(`Places remplies: ${filledSlots} / ${totalSlots} (${fillRate}%)`, 25, yPos);
  yPos += 10;

  // Ligne de séparation
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPos, 190, yPos);
  yPos += 10;

  // Pour chaque mission
  sortedMissions.forEach((mission, index) => {
    // Vérifier si on a besoin d'une nouvelle page
    if (yPos > 240) {
      doc.addPage();
      currentPage++;
      yPos = 20;
    }

    // Titre de la mission
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const missionTitle = `${index + 1}. ${mission.title}`;
    doc.text(missionTitle, 20, yPos);
    yPos += 7;

    // Info de la mission
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    if (mission.startDate) {
      const dateStr = format(
        new Date(mission.startDate),
        "EEEE d MMMM yyyy 'de' HH'h'mm",
        { locale: fr }
      );
      const endStr = mission.endDate
        ? ` à ${format(new Date(mission.endDate), "HH'h'mm", { locale: fr })}`
        : '';
      doc.text(`Date: ${dateStr}${endStr}`, 25, yPos);
      yPos += 5;
    }

    doc.text(`Lieu: ${mission.location}`, 25, yPos);
    yPos += 5;

    doc.text(
      `Bénévoles: ${mission.volunteers.length}/${mission.maxVolunteers} | Statut: ${getStatusLabel(mission.status)}`,
      25,
      yPos
    );
    yPos += 5;

    if (mission.isUrgent) {
      doc.setTextColor(239, 68, 68);
      doc.text('[URGENT]', 25, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 5;
    }

    // Liste des bénévoles
    if (mission.volunteers.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Bénévoles inscrits:', 25, yPos);
      yPos += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      mission.volunteers.slice(0, 5).forEach((volunteerId) => {
        const volunteer = allVolunteers.get(volunteerId);
        if (volunteer) {
          const isResponsible = mission.responsibles.includes(volunteerId);
          const responsibleTag = isResponsible ? ' [RESPONSABLE]' : '';
          const volunteerInfo = `- ${volunteer.firstName} ${volunteer.lastName}${responsibleTag} | ${volunteer.phone || 'N/A'} | ${volunteer.email}`;
          const lines = doc.splitTextToSize(volunteerInfo, 165);
          doc.text(lines, 30, yPos);
          yPos += lines.length * 4;
        }
      });

      if (mission.volunteers.length > 5) {
        doc.text(`... et ${mission.volunteers.length - 5} autre(s) bénévole(s)`, 30, yPos);
        yPos += 4;
      }
    } else {
      doc.setTextColor(150, 150, 150);
      doc.text('Aucun bénévole inscrit', 25, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 5;
    }

    yPos += 3;

    // Ligne de séparation
    doc.setDrawColor(220, 220, 220);
    doc.line(20, yPos, 190, yPos);
    yPos += 8;
  });

  // Pied de page sur toutes les pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Page ${i} / ${totalPages}`, 105, 285, { align: 'center' });
  }

  // Télécharger le PDF
  const fileName = `planning-global-festival-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}

/**
 * Génère un PDF avec le planning personnel d'un bénévole
 */
export async function exportVolunteerPlanningPDF(
  missions: MissionClient[],
  volunteerName: string,
  allParticipants: Map<string, UserClient[]>
) {
  const doc = new jsPDF();

  // En-tête
  doc.setFontSize(20);
  doc.text('Festival Films Courts de Dinan 2025', 105, 20, { align: 'center' });

  doc.setFontSize(16);
  doc.text('Mon Planning Bénévole', 105, 30, { align: 'center' });

  doc.setFontSize(12);
  doc.text(volunteerName, 105, 40, { align: 'center' });

  let yPos = 55;

  // Trier les missions par date
  const sortedMissions = missions.sort((a, b) => {
    if (!a.startDate) return 1;
    if (!b.startDate) return -1;
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });

  // Pour chaque mission - Utiliser une boucle asynchrone
  for (let index = 0; index < sortedMissions.length; index++) {
    const mission = sortedMissions[index];
    
    // Vérifier si on a besoin d'une nouvelle page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    // Titre de la mission
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. ${cleanTextForPDF(mission.title)}`, 20, yPos);
    yPos += 8;

    // Infos de la mission
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    if (mission.category) {
      doc.text(`Categorie: ${cleanTextForPDF(mission.category)}`, 25, yPos);
      yPos += 6;
    }

    if (mission.startDate) {
      const dateStr = format(
        new Date(mission.startDate),
        "EEEE d MMMM yyyy 'a' HH'h'mm",
        { locale: fr }
      );
      doc.text(`Date: ${cleanTextForPDF(dateStr)}`, 25, yPos);
      yPos += 6;
    }

    doc.text(`Lieu: ${cleanTextForPDF(mission.location)}`, 25, yPos);
    yPos += 6;

    doc.text(`Statut: ${getStatusLabel(mission.status)}`, 25, yPos);
    yPos += 6;

    // Description
    const cleanedDescription = cleanTextForPDF(mission.description);
    const descLines = doc.splitTextToSize(cleanedDescription, 160);
    doc.text(descLines, 25, yPos);
    yPos += descLines.length * 5 + 5;

    // Contacts
    doc.setFont('helvetica', 'bold');
    doc.text('Contacts:', 25, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'normal');

    // Récupérer et afficher le(s) responsable(s) de catégorie en premier
    if (mission.category) {
      try {
        const categoryResponsibles = await getCategoryResponsiblesByValue(mission.category);
        if (categoryResponsibles.length > 0) {
          for (const categoryResponsible of categoryResponsibles) {
            doc.setTextColor(59, 130, 246); // Bleu pour le distinguer
            doc.setFont('helvetica', 'bold');
            const responsibleContact = `- ${cleanTextForPDF(categoryResponsible.firstName)} ${cleanTextForPDF(categoryResponsible.lastName)} (Responsable) - ${categoryResponsible.phone || 'N/A'} - ${categoryResponsible.email}`;
            const responsibleLines = doc.splitTextToSize(responsibleContact, 155);
            doc.text(responsibleLines, 30, yPos);
            yPos += responsibleLines.length * 5;
            doc.setTextColor(0, 0, 0); // Retour au noir
            doc.setFont('helvetica', 'normal');
          }
        }
      } catch (error) {
        console.error('Error fetching category responsibles for export:', error);
      }
    }

    // Afficher les autres participants
    const participants = allParticipants.get(mission.id) || [];
    if (participants.length > 0) {
      participants.slice(0, 3).forEach((participant) => {
        const contact = `- ${cleanTextForPDF(participant.firstName)} ${cleanTextForPDF(participant.lastName)} - ${participant.phone || 'N/A'} - ${participant.email}`;
        const contactLines = doc.splitTextToSize(contact, 155);
        doc.text(contactLines, 30, yPos);
        yPos += contactLines.length * 5;
      });

      if (participants.length > 3) {
        doc.text(`+ ${participants.length - 3} autre(s) benevole(s)`, 30, yPos);
        yPos += 5;
      }
    }

    yPos += 5;

    // Ligne de séparation
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, 190, yPos);
    yPos += 10;
  }

  // Pied de page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`,
      20,
      doc.internal.pageSize.height - 10
    );
    doc.text(
      `Page ${i} / ${pageCount}`,
      doc.internal.pageSize.width - 40,
      doc.internal.pageSize.height - 10
    );
  }

  // Télécharger le PDF
  const fileName = `mon-planning-benevole-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}

// Helpers
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Brouillon',
    published: 'Publiee',
    full: 'Complete',
    cancelled: 'Annulee',
    completed: 'Terminee',
  };
  return labels[status] || status;
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    volunteer: 'Benevole',
    mission_responsible: 'Responsable',
    admin: 'Administrateur',
  };
  return labels[role] || role;
}

/**
 * Nettoie le texte pour l'export PDF en remplaçant les caractères spéciaux
 * et les symboles qui ne sont pas supportés par jsPDF
 */
function cleanTextForPDF(text: string): string {
  if (!text) return '';
  
  return text
    // Remplacer les cases à cocher et symboles
    .replace(/[☑✓✔]/g, '- ')
    .replace(/[☐✗✘]/g, '- ')
    .replace(/[•●]/g, '- ')
    // Remplacer les accents et caractères spéciaux français
    .replace(/[éèêë]/g, 'e')
    .replace(/[àâä]/g, 'a')
    .replace(/[îï]/g, 'i')
    .replace(/[ôö]/g, 'o')
    .replace(/[ùûü]/g, 'u')
    .replace(/[ÿ]/g, 'y')
    .replace(/[ç]/g, 'c')
    .replace(/[ÉÈÊË]/g, 'E')
    .replace(/[ÀÂÄÅ]/g, 'A')
    .replace(/[ÎÏ]/g, 'I')
    .replace(/[ÔÖ]/g, 'O')
    .replace(/[ÙÛÜ]/g, 'U')
    .replace(/[Ç]/g, 'C')
    // Remplacer les apostrophes typographiques
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    // Remplacer les tirets spéciaux
    .replace(/[–—]/g, '-')
    // Remplacer les espaces insécables
    .replace(/\u00A0/g, ' ')
    // Supprimer les autres caractères non ASCII
    .replace(/[^\x00-\x7F]/g, '');
}

/**
 * Génère un PDF avec le programme complet de toutes les missions
 * pour impression et distribution lors d'une réunion bénévoles
 * 
 * Organisation : Missions continues d'abord, puis par jour et par catégorie
 */
export async function exportFullProgramPDF(
  missions: MissionClient[],
  pageFormat: 'a4' | 'a3' = 'a4',
  allowedCategories?: string[] // Pour filtrer les missions par catégorie (responsables)
) {
  // Créer le document avec le format approprié
  const orientation = pageFormat === 'a3' ? 'landscape' : 'portrait';
  const doc = new jsPDF({
    orientation,
    format: pageFormat === 'a3' ? 'a3' : 'a4',
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const marginLeft = 15;
  const marginRight = pageWidth - 15;
  const contentWidth = marginRight - marginLeft;

  // Filtrer par catégories autorisées si nécessaire
  let filteredMissions = missions;
  if (allowedCategories && allowedCategories.length > 0) {
    filteredMissions = missions.filter(m => allowedCategories.includes(m.category));
  }

  // Séparer missions continues et missions datées
  const continuousMissions = filteredMissions.filter(m => !m.startDate);
  const datedMissions = filteredMissions.filter(m => m.startDate);

  // Grouper les missions datées par jour
  const missionsByDay = new Map<string, MissionClient[]>();
  datedMissions.forEach(mission => {
    if (mission.startDate) {
      const dayKey = format(new Date(mission.startDate), 'yyyy-MM-dd', { locale: fr });
      if (!missionsByDay.has(dayKey)) {
        missionsByDay.set(dayKey, []);
      }
      missionsByDay.get(dayKey)!.push(mission);
    }
  });

  // Trier les jours
  const sortedDays = Array.from(missionsByDay.keys()).sort();

  // Trier les missions de chaque jour par catégorie puis par heure
  sortedDays.forEach(day => {
    const dayMissions = missionsByDay.get(day)!;
    dayMissions.sort((a, b) => {
      // Trier par catégorie
      const catCompare = a.category.localeCompare(b.category);
      if (catCompare !== 0) return catCompare;
      
      // Puis par heure
      if (a.startDate && b.startDate) {
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      }
      return 0;
    });
  });

  // Trier les missions continues par catégorie
  continuousMissions.sort((a, b) => a.category.localeCompare(b.category));

  // ========== EN-TÊTE ==========
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Festival Films Courts de Dinan 2025', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(16);
  doc.text('Programme Complet des Missions', pageWidth / 2, 30, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Document genere le ${format(new Date(), 'dd/MM/yyyy a HH:mm', { locale: fr })}`,
    pageWidth / 2,
    38,
    { align: 'center' }
  );

  let yPos = 50;

  // ========== MISSIONS CONTINUES ==========
  if (continuousMissions.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235); // Bleu
    doc.text('MISSIONS CONTINUES (sans date fixe)', marginLeft, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 8;

    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, yPos, marginRight, yPos);
    yPos += 8;

    let currentCategory = '';

    for (const mission of continuousMissions) {
      // Afficher le nom de la catégorie si elle change
      if (mission.category !== currentCategory) {
        if (currentCategory !== '') {
          yPos += 5; // Espace entre catégories
        }
        currentCategory = mission.category;
        
        // Vérifier si on a besoin d'une nouvelle page
        if (yPos > pageHeight - 40) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(139, 92, 246); // Violet pour la catégorie
        doc.text(`Categorie: ${mission.category}`, marginLeft, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 7;
      }

      // Vérifier si on a besoin d'une nouvelle page
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 20;
      }

      // Titre de la mission
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const missionTitle = mission.isUrgent ? `[URGENT] ${mission.title}` : mission.title;
      doc.text(missionTitle, marginLeft + 5, yPos);
      yPos += 6;

      // Détails
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      doc.text(`Lieu: ${mission.location}`, marginLeft + 8, yPos);
      yPos += 5;

      doc.text(
        `Places: ${mission.volunteers.length}/${mission.maxVolunteers} | Statut: ${getStatusLabel(mission.status)}`,
        marginLeft + 8,
        yPos
      );
      yPos += 5;

      // Description
      if (mission.description) {
        const descLines = doc.splitTextToSize(`Description: ${mission.description}`, contentWidth - 10);
        doc.text(descLines, marginLeft + 8, yPos);
        yPos += descLines.length * 4.5 + 3;
      }

      // Récupérer les responsables de catégorie
      const categoryResponsibles = await getCategoryResponsiblesByValue(mission.category);
      
      // Récupérer les bénévoles inscrits
      const volunteers: UserClient[] = [];
      for (const volunteerId of mission.volunteers) {
        try {
          const volunteer = await getUserById(volunteerId);
          if (volunteer) volunteers.push(volunteer);
        } catch (error) {
          console.error(`Erreur lors de la récupération du bénévole ${volunteerId}:`, error);
        }
      }

      // Afficher les responsables
      if (categoryResponsibles.length > 0) {
        yPos += 3;
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(37, 99, 235); // Bleu
        doc.text(`Responsable${categoryResponsibles.length > 1 ? 's' : ''} :`, marginLeft + 8, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 5;

        for (const resp of categoryResponsibles) {
          doc.setFont('helvetica', 'normal');
          doc.text(`${resp.firstName} ${resp.lastName} - ${resp.email}${resp.phone ? ' - ' + resp.phone : ''}`, marginLeft + 12, yPos);
          yPos += 4;
        }
      }

      // Afficher les bénévoles
      if (volunteers.length > 0) {
        yPos += 3;
        doc.setFont('helvetica', 'bold');
        doc.text(`Benevoles inscrits (${volunteers.length}) :`, marginLeft + 8, yPos);
        doc.setFont('helvetica', 'normal');
        yPos += 5;

        for (const vol of volunteers) {
          // Vérifier si on a besoin d'une nouvelle page
          if (yPos > pageHeight - 20) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(`${vol.firstName} ${vol.lastName} - ${vol.email}${vol.phone ? ' - ' + vol.phone : ''}`, marginLeft + 12, yPos);
          yPos += 4;
        }
      }

      yPos += 4;
    }

    yPos += 10;
  }

  // ========== MISSIONS PAR JOUR ==========
  for (let dayIndex = 0; dayIndex < sortedDays.length; dayIndex++) {
    const day = sortedDays[dayIndex];
    const dayMissions = missionsByDay.get(day)!;
    const dayDate = new Date(day);
    
    // Vérifier si on a besoin d'une nouvelle page pour le jour
    if (yPos > pageHeight - 40 || (dayIndex > 0 && yPos > 60)) {
      doc.addPage();
      yPos = 20;
    }

    // En-tête du jour
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38); // Rouge
    const dayHeader = format(dayDate, "EEEE d MMMM yyyy", { locale: fr }).toUpperCase();
    doc.text(dayHeader, marginLeft, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 8;

    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, yPos, marginRight, yPos);
    yPos += 8;

    let currentCategory = '';

    for (const mission of dayMissions) {
      // Afficher le nom de la catégorie si elle change
      if (mission.category !== currentCategory) {
        if (currentCategory !== '') {
          yPos += 5; // Espace entre catégories
        }
        currentCategory = mission.category;
        
        // Vérifier si on a besoin d'une nouvelle page
        if (yPos > pageHeight - 40) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(139, 92, 246); // Violet pour la catégorie
        doc.text(`Categorie: ${mission.category}`, marginLeft, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 7;
      }

      // Vérifier si on a besoin d'une nouvelle page
      if (yPos > pageHeight - 70) {
        doc.addPage();
        yPos = 20;
      }

      // Horaire et titre
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const timeStr = mission.startDate
        ? format(new Date(mission.startDate), "HH'h'mm", { locale: fr })
        : '';
      const endTimeStr = mission.endDate
        ? ` - ${format(new Date(mission.endDate), "HH'h'mm", { locale: fr })}`
        : '';
      const missionTitle = mission.isUrgent ? `[URGENT] ${mission.title}` : mission.title;
      
      doc.text(`Horaire: ${timeStr}${endTimeStr}`, marginLeft + 5, yPos);
      yPos += 6;
      doc.text(missionTitle, marginLeft + 5, yPos);
      yPos += 6;

      // Détails
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      doc.text(`Lieu: ${mission.location}`, marginLeft + 8, yPos);
      yPos += 5;

      doc.text(
        `Places: ${mission.volunteers.length}/${mission.maxVolunteers} | Statut: ${getStatusLabel(mission.status)}`,
        marginLeft + 8,
        yPos
      );
      yPos += 5;

      // Description
      if (mission.description) {
        const descLines = doc.splitTextToSize(`Description: ${mission.description}`, contentWidth - 10);
        doc.text(descLines, marginLeft + 8, yPos);
        yPos += descLines.length * 4.5 + 3;
      }

      // Badge récurrent si applicable
      if (mission.isRecurrent) {
        doc.setTextColor(16, 185, 129); // Vert
        doc.text('[RECURRENTE] Mission recurrente', marginLeft + 8, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 5;
      }

      // Récupérer les responsables de catégorie
      const categoryResponsibles = await getCategoryResponsiblesByValue(mission.category);
      
      // Récupérer les bénévoles inscrits
      const volunteers: UserClient[] = [];
      for (const volunteerId of mission.volunteers) {
        try {
          const volunteer = await getUserById(volunteerId);
          if (volunteer) volunteers.push(volunteer);
        } catch (error) {
          console.error(`Erreur lors de la récupération du bénévole ${volunteerId}:`, error);
        }
      }

      // Afficher les responsables
      if (categoryResponsibles.length > 0) {
        yPos += 3;
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(37, 99, 235); // Bleu
        doc.text(`Responsable${categoryResponsibles.length > 1 ? 's' : ''} :`, marginLeft + 8, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 5;

        for (const resp of categoryResponsibles) {
          // Vérifier si on a besoin d'une nouvelle page
          if (yPos > pageHeight - 20) {
            doc.addPage();
            yPos = 20;
          }
          doc.setFont('helvetica', 'normal');
          doc.text(`${resp.firstName} ${resp.lastName} - ${resp.email}${resp.phone ? ' - ' + resp.phone : ''}`, marginLeft + 12, yPos);
          yPos += 4;
        }
      }

      // Afficher les bénévoles
      if (volunteers.length > 0) {
        yPos += 3;
        doc.setFont('helvetica', 'bold');
        doc.text(`Benevoles inscrits (${volunteers.length}) :`, marginLeft + 8, yPos);
        doc.setFont('helvetica', 'normal');
        yPos += 5;

        for (const vol of volunteers) {
          // Vérifier si on a besoin d'une nouvelle page
          if (yPos > pageHeight - 20) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(`${vol.firstName} ${vol.lastName} - ${vol.email}${vol.phone ? ' - ' + vol.phone : ''}`, marginLeft + 12, yPos);
          yPos += 4;
        }
      }

      yPos += 4;
    }

    yPos += 12;
  }

  // ========== PIED DE PAGE ==========
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      'Festival Films Courts de Dinan 2025 - Programme des Missions',
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(`Page ${i} / ${totalPages}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
  }

  // Télécharger le PDF
  const categoryLabel = allowedCategories && allowedCategories.length > 0
    ? '-mes-categories'
    : '-complet';
  const fileName = `programme-missions${categoryLabel}-${pageFormat}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}

/**
 * Génère un PDF avec les affectations de tous les bénévoles
 * Liste chaque bénévole avec toutes ses missions
 */
export async function exportVolunteerAssignmentsPDF(
  volunteers: UserClient[],
  missions: MissionClient[]
) {
  const doc = new jsPDF();

  // En-tête
  doc.setFontSize(20);
  doc.text('Festival Films Courts de Dinan 2025', 105, 20, { align: 'center' });

  doc.setFontSize(16);
  doc.text('Affectations des Bénévoles', 105, 30, { align: 'center' });

  // Statistiques
  doc.setFontSize(10);
  const volunteersWithMissions = volunteers.filter((v) =>
    missions.some((m) => m.volunteers.includes(v.uid))
  ).length;
  const volunteersWithoutMissions = volunteers.length - volunteersWithMissions;

  doc.text(`Total bénévoles: ${volunteers.length}`, 20, 45);
  doc.text(`Avec missions: ${volunteersWithMissions}`, 20, 52);
  doc.text(`Sans mission: ${volunteersWithoutMissions}`, 20, 59);
  doc.text(`Total missions: ${missions.length}`, 120, 45);

  let yPos = 75;

  // Trier les bénévoles par nom
  const sortedVolunteers = [...volunteers].sort((a, b) =>
    a.lastName.localeCompare(b.lastName)
  );

  for (const volunteer of sortedVolunteers) {
    // Trouver toutes les missions du bénévole
    const volunteerMissions = missions
      .filter((m) => m.volunteers.includes(volunteer.uid))
      .sort((a, b) => {
        if (!a.startDate && !b.startDate) return 0;
        if (!a.startDate) return -1;
        if (!b.startDate) return 1;
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      });

    // Vérifier si on a besoin d'une nouvelle page
    const neededHeight = 25 + (volunteerMissions.length * 20);
    if (yPos + neededHeight > 270) {
      doc.addPage();
      yPos = 20;
    }

    // Informations du bénévole
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `${volunteer.firstName} ${volunteer.lastName}`,
      20,
      yPos
    );
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    yPos += 5;
    doc.text(`Email: ${volunteer.email}`, 25, yPos);
    yPos += 5;
    if (volunteer.phone) {
      doc.text(`Tel: ${volunteer.phone}`, 25, yPos);
      yPos += 5;
    }
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `${volunteerMissions.length} mission${volunteerMissions.length > 1 ? 's' : ''}`,
      25,
      yPos
    );
    doc.setFont('helvetica', 'normal');
    yPos += 7;

    // Tableau des missions du bénévole
    if (volunteerMissions.length > 0) {
      const tableData = volunteerMissions.map((mission) => {
        const startDate = mission.startDate ? new Date(mission.startDate) : null;
        const endDate = mission.endDate ? new Date(mission.endDate) : null;

        return [
          mission.title,
          startDate
            ? format(startDate, 'dd/MM/yyyy', { locale: fr })
            : 'Au long cours',
          startDate && endDate
            ? `${format(startDate, 'HH:mm', { locale: fr })} - ${format(endDate, 'HH:mm', { locale: fr })}`
            : '',
          mission.location,
          mission.category || 'N/A',
        ];
      });

      autoTable(doc, {
        head: [['Mission', 'Date', 'Horaire', 'Lieu', 'Catégorie']],
        body: tableData,
        startY: yPos,
        margin: { left: 25 },
        styles: { fontSize: 8 },
        headStyles: { fillColor: [37, 99, 235], fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 25 },
          2: { cellWidth: 30 },
          3: { cellWidth: 40 },
          4: { cellWidth: 25 },
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    } else {
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text('Aucune mission affectée', 25, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 10;
    }

    // Ligne de séparation
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, 190, yPos);
    yPos += 10;
  }

  // Pied de page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`,
      20,
      doc.internal.pageSize.height - 10
    );
    doc.text(
      `Page ${i} / ${pageCount}`,
      doc.internal.pageSize.width - 40,
      doc.internal.pageSize.height - 10,
      { align: 'right' }
    );
  }

  // Télécharger le PDF
  const fileName = `affectations-benevoles-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}

