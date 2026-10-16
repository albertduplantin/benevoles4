'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { MissionClient, UserClient } from '@/types';

interface ExportButtonsProps {
  type: 'mission' | 'global' | 'volunteer-planning';
  mission?: MissionClient;
  missions?: MissionClient[];
  volunteers?: UserClient[];
  responsibles?: UserClient[]; // DEPRECATED - Ancien système
  categoryResponsible?: UserClient | null; // Nouveau système
  totalVolunteers?: number;
  allVolunteers?: Map<string, UserClient>;
  volunteerName?: string;
  allParticipants?: Map<string, UserClient[]>;
}

export function ExportButtons({
  type,
  mission,
  missions,
  volunteers = [],
  responsibles = [],
  categoryResponsible,
  totalVolunteers = 0,
  allVolunteers,
  volunteerName = '',
  allParticipants,
}: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'pdf' | 'excel', exportType: string) => {
    setIsExporting(true);
    try {
      if (type === 'mission' && mission) {
        // Exports pour une mission spécifique
        if (format === 'pdf') {
          if (exportType === 'volunteers') {
            await (await import('@/lib/utils/pdf-export')).exportMissionVolunteersPDF(mission, volunteers, categoryResponsible);
          } else if (exportType === 'report') {
            await (await import('@/lib/utils/pdf-export')).exportMissionReportPDF(mission, volunteers, responsibles, categoryResponsible);
          }
        } else if (format === 'excel') {
          if (exportType === 'volunteers') {
            (await import('@/lib/utils/excel-export')).exportMissionVolunteersExcel(mission, volunteers, categoryResponsible);
          } else if (exportType === 'report') {
            (await import('@/lib/utils/excel-export')).exportMissionReportExcel(mission, volunteers, responsibles, categoryResponsible);
          }
        }
      } else if (type === 'global' && missions) {
        // Exports globaux
        if (format === 'pdf') {
          if (exportType === 'stats') {
            await (await import('@/lib/utils/pdf-export')).exportGlobalStatsPDF(missions, totalVolunteers);
          } else if (exportType === 'planning' && allVolunteers) {
            await (await import('@/lib/utils/pdf-export')).exportGlobalPlanningPDF(missions, allVolunteers);
          }
        } else if (format === 'excel') {
          if (exportType === 'stats') {
            (await import('@/lib/utils/excel-export')).exportGlobalStatsExcel(missions, totalVolunteers);
          } else if (exportType === 'full' && allVolunteers) {
            (await import('@/lib/utils/excel-export')).exportFullDataExcel(missions, allVolunteers);
          } else if (exportType === 'planning' && allVolunteers) {
            (await import('@/lib/utils/excel-export')).exportGlobalPlanningExcel(missions, allVolunteers);
          }
        }
      } else if (type === 'volunteer-planning' && missions && allParticipants) {
        // Export planning personnel bénévole
        if (format === 'pdf') {
          await (await import('@/lib/utils/pdf-export')).exportVolunteerPlanningPDF(missions, volunteerName, allParticipants);
        } else if (format === 'excel') {
          await (await import('@/lib/utils/excel-export')).exportVolunteerPlanningExcel(missions, volunteerName, allParticipants);
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export. Veuillez réessayer.');
    } finally {
      setIsExporting(false);
    }
  };

  if (type === 'mission') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Export en cours...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Exporter
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Exporter au format</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="text-xs font-normal text-gray-500">
            Liste des bénévoles
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleExport('pdf', 'volunteers')}>
            <FileText className="mr-2 h-4 w-4" />
            PDF - Liste bénévoles
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('excel', 'volunteers')}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel - Liste bénévoles
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="text-xs font-normal text-gray-500">
            Rapport complet
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleExport('pdf', 'report')}>
            <FileText className="mr-2 h-4 w-4" />
            PDF - Rapport complet
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('excel', 'report')}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel - Rapport complet
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (type === 'volunteer-planning') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="default" disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Export en cours...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Exporter mon planning
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Mon planning personnel</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => handleExport('pdf', 'planning')}>
            <FileText className="mr-2 h-4 w-4" />
            PDF - Planning + Contacts
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('excel', 'planning')}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel - Planning + Contacts
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Type === 'global'
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Export en cours...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Exporter les données
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Exporter au format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs font-normal text-gray-500">
          Planning Global (avec contacts)
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleExport('pdf', 'planning')}>
          <FileText className="mr-2 h-4 w-4" />
          PDF - Planning + Contacts
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('excel', 'planning')}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Excel - Planning + Contacts
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs font-normal text-gray-500">
          Statistiques
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleExport('pdf', 'stats')}>
          <FileText className="mr-2 h-4 w-4" />
          PDF - Statistiques
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('excel', 'stats')}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Excel - Statistiques
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs font-normal text-gray-500">
          Export complet (archivage)
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleExport('excel', 'full')}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Excel - Toutes les données
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

