'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getAllVolunteers } from '@/lib/api/users';
import { adminRegisterVolunteer, adminUnregisterVolunteer } from '@/lib/api/users';
import { UserClient } from '@/types';
import { SearchIcon, UserPlusIcon, UserMinusIcon, XIcon, MailIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface AssignVolunteerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  missionId: string;
  missionTitle: string;
  currentVolunteers: string[]; // UIDs des bénévoles actuellement inscrits
  maxVolunteers: number;
  onVolunteerAssigned: () => void; // Callback pour rafraîchir la liste
}

export function AssignVolunteerModal({
  open,
  onOpenChange,
  missionId,
  missionTitle,
  currentVolunteers,
  maxVolunteers,
  onVolunteerAssigned
}: AssignVolunteerModalProps) {
  const [volunteers, setVolunteers] = useState<UserClient[]>([]);
  const [filteredVolunteers, setFilteredVolunteers] = useState<UserClient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [processingVolunteerId, setProcessingVolunteerId] = useState<string | null>(null);

  // Charger tous les bénévoles
  useEffect(() => {
    const loadVolunteers = async () => {
      if (!open) return;
      
      try {
        setIsLoading(true);
        const allVolunteers = await getAllVolunteers();
        setVolunteers(allVolunteers);
        setFilteredVolunteers(allVolunteers);
      } catch (error) {
        console.error('Error loading volunteers:', error);
        toast.error('Erreur lors du chargement des bénévoles');
      } finally {
        setIsLoading(false);
      }
    };

    loadVolunteers();
  }, [open]);

  // Filtrer les bénévoles selon la recherche
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredVolunteers(volunteers);
      return;
    }

    const search = searchTerm.toLowerCase();
    const filtered = volunteers.filter(v => 
      v.firstName?.toLowerCase().includes(search) ||
      v.lastName?.toLowerCase().includes(search) ||
      v.email?.toLowerCase().includes(search)
    );
    setFilteredVolunteers(filtered);
  }, [searchTerm, volunteers]);

  const handleAssign = async (volunteerId: string) => {
    try {
      setProcessingVolunteerId(volunteerId);
      await adminRegisterVolunteer(missionId, volunteerId);
      toast.success('Bénévole assigné avec succès');
      onVolunteerAssigned();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'assignation');
    } finally {
      setProcessingVolunteerId(null);
    }
  };

  const handleUnassign = async (volunteerId: string) => {
    try {
      setProcessingVolunteerId(volunteerId);
      await adminUnregisterVolunteer(missionId, volunteerId);
      toast.success('Bénévole retiré avec succès');
      onVolunteerAssigned();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du retrait');
    } finally {
      setProcessingVolunteerId(null);
    }
  };

  const isFull = currentVolunteers.length >= maxVolunteers;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Assigner des bénévoles</DialogTitle>
          <DialogDescription>
            {missionTitle} • {currentVolunteers.length}/{maxVolunteers} bénévoles
          </DialogDescription>
        </DialogHeader>

        {/* Barre de recherche */}
        <div className="space-y-2">
          <Label htmlFor="search">Rechercher un bénévole</Label>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Nom, prénom ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchTerm('')}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Liste des bénévoles */}
        <div className="flex-1 overflow-y-auto border rounded-md">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Chargement...</p>
              </div>
            </div>
          ) : filteredVolunteers.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <p className="text-sm text-muted-foreground">
                {searchTerm ? 'Aucun bénévole trouvé' : 'Aucun bénévole disponible'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredVolunteers.map((volunteer) => {
                const isAssigned = currentVolunteers.includes(volunteer.uid);
                const isProcessing = processingVolunteerId === volunteer.uid;
                const canAssign = !isAssigned && !isFull;

                return (
                  <div
                    key={volunteer.uid}
                    className="flex items-center justify-between p-4 hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">
                          {volunteer.firstName} {volunteer.lastName}
                        </p>
                        {isAssigned && (
                          <Badge variant="secondary" className="text-xs">
                            Inscrit
                          </Badge>
                        )}
                        {volunteer.emailOnly && (
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                            <MailIcon className="h-3 w-3 mr-1" />
                            Email uniquement
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{volunteer.email}</p>
                      {volunteer.phone && (
                        <p className="text-sm text-muted-foreground">{volunteer.phone}</p>
                      )}
                    </div>

                    <div>
                      {isAssigned ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnassign(volunteer.uid)}
                          disabled={isProcessing}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {isProcessing ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
                          ) : (
                            <>
                              <UserMinusIcon className="h-4 w-4 mr-2" />
                              Retirer
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleAssign(volunteer.uid)}
                          disabled={isProcessing || !canAssign}
                        >
                          {isProcessing ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          ) : (
                            <>
                              <UserPlusIcon className="h-4 w-4 mr-2" />
                              {isFull ? 'Complet' : 'Assigner'}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

