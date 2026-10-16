'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { MissionClient } from '@/types';
import { PrinterIcon } from 'lucide-react';

interface FullProgramExportButtonProps {
  missions: MissionClient[];
  allowedCategories?: string[];
}

export function FullProgramExportButton({
  missions,
  allowedCategories,
}: FullProgramExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'a4' | 'a3') => {
    try {
      setIsExporting(true);
      await (await import('@/lib/utils/pdf-export')).exportFullProgramPDF(missions, format, allowedCategories);
      setIsOpen(false);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Une erreur est survenue lors de l\'export');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-black hover:bg-gray-800">
          <PrinterIcon className="h-4 w-4 mr-2" />
          Imprimer toutes les missions
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Programme Complet des Missions</DialogTitle>
          <DialogDescription>
            Exportez le programme complet pour impression et distribution lors d'une réunion bénévoles.
            <br />
            <br />
            Organisation : missions continues en premier, puis par jour et par catégorie.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Choisissez le format :</p>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => handleExport('a4')}
                disabled={isExporting}
                className="h-auto flex flex-col items-center justify-center p-4 space-y-2"
              >
                <div className="text-2xl">📄</div>
                <div className="text-center">
                  <p className="font-semibold">Format A4</p>
                  <p className="text-xs text-muted-foreground">
                    Standard (21 × 29.7 cm)
                  </p>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleExport('a3')}
                disabled={isExporting}
                className="h-auto flex flex-col items-center justify-center p-4 space-y-2"
              >
                <div className="text-2xl">📜</div>
                <div className="text-center">
                  <p className="font-semibold">Format A3</p>
                  <p className="text-xs text-muted-foreground">
                    Grand format (29.7 × 42 cm)
                  </p>
                </div>
              </Button>
            </div>
          </div>

          {isExporting && (
            <div className="text-center text-sm text-muted-foreground">
              Génération du PDF en cours...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

