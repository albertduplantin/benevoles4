'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isProfileComplete } from '@/lib/api/users';
import {
  getAllVolunteers,
  updateVolunteerInfo,
  changeVolunteerRole,
  deleteVolunteer,
  adminRegisterVolunteer,
  adminUnregisterVolunteer,
} from '@/lib/api/users';
import { getAllMissions } from '@/lib/api/missions';
import { UserClient, MissionClient } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { CreateVolunteerModal } from '@/components/features/admin/create-volunteer-modal';
import { SearchIcon, EditIcon, Trash2Icon, UserPlusIcon, UserMinusIcon, CalendarIcon, Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { formatDateTime } from '@/lib/utils/date';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportVolunteerAssignmentsExcel, exportVolunteerMissionGridExcel } from '@/lib/utils/excel-export';
import { exportVolunteerAssignmentsPDF } from '@/lib/utils/pdf-export';

export default function VolunteersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [volunteers, setVolunteers] = useState<UserClient[]>([]);
  const [missions, setMissions] = useState<MissionClient[]>([]);
  const [isLoadingVolunteers, setIsLoadingVolunteers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVolunteer, setSelectedVolunteer] = useState<UserClient | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMissionsDialogOpen, setIsMissionsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Form states
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  });

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
        setIsLoadingVolunteers(true);
        const [volunteersData, missionsData] = await Promise.all([
          getAllVolunteers(),
          getAllMissions(),
        ]);
        setVolunteers(volunteersData);
        setMissions(missionsData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setIsLoadingVolunteers(false);
      }
    };
    loadData();
  }, [user]);

  const filteredVolunteers = volunteers.filter(
    (v) =>
      v.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getVolunteerMissions = (volunteerId: string) => {
    return missions.filter((m) => m.volunteers.includes(volunteerId));
  };

  const handleEdit = (volunteer: UserClient) => {
    setSelectedVolunteer(volunteer);
    setEditForm({
      firstName: volunteer.firstName,
      lastName: volunteer.lastName,
      phone: volunteer.phone || '',
      email: volunteer.email,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedVolunteer) return;
    
    setIsProcessing(true);
    try {
      await updateVolunteerInfo(selectedVolunteer.uid, editForm);
      
      // Mettre à jour l'état local
      setVolunteers((prev) =>
        prev.map((v) =>
          v.uid === selectedVolunteer.uid
            ? { ...v, ...editForm }
            : v
        )
      );
      
      toast.success('Bénévole mis à jour avec succès');
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating volunteer:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChangeRole = async (volunteerId: string, newRole: 'volunteer' | 'admin') => {
    setIsProcessing(true);
    try {
      await changeVolunteerRole(volunteerId, newRole);
      
      setVolunteers((prev) =>
        prev.map((v) =>
          v.uid === volunteerId ? { ...v, role: newRole } : v
        )
      );
      
      toast.success('Rôle modifié avec succès');
    } catch (error) {
      console.error('Error changing role:', error);
      toast.error('Erreur lors du changement de rôle');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedVolunteer) return;
    
    setIsProcessing(true);
    try {
      await deleteVolunteer(selectedVolunteer.uid);
      
      setVolunteers((prev) => prev.filter((v) => v.uid !== selectedVolunteer.uid));
      
      toast.success('Bénévole supprimé avec succès');
      setIsDeleteDialogOpen(false);
      setSelectedVolunteer(null);
    } catch (error) {
      console.error('Error deleting volunteer:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegisterToMission = async (missionId: string) => {
    if (!selectedVolunteer) return;
    
    setIsProcessing(true);
    try {
      await adminRegisterVolunteer(missionId, selectedVolunteer.uid);
      
      // Recharger les missions
      const updatedMissions = await getAllMissions();
      setMissions(updatedMissions);
      
      toast.success('Bénévole inscrit à la mission');
    } catch (error: any) {
      console.error('Error registering volunteer:', error);
      toast.error(error.message || 'Erreur lors de l\'inscription');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnregisterFromMission = async (missionId: string) => {
    if (!selectedVolunteer) return;
    
    setIsProcessing(true);
    try {
      await adminUnregisterVolunteer(missionId, selectedVolunteer.uid);
      
      // Recharger les missions
      const updatedMissions = await getAllMissions();
      setMissions(updatedMissions);
      
      toast.success('Bénévole désinscrit de la mission');
    } catch (error) {
      console.error('Error unregistering volunteer:', error);
      toast.error('Erreur lors de la désinscription');
    } finally {
      setIsProcessing(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'gold';
      case 'category_responsible':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrateur';
      case 'category_responsible':
        return 'Responsable de catégorie';
      default:
        return 'Bénévole';
    }
  };

  const handleVolunteerCreated = async () => {
    // Recharger la liste des bénévoles
    try {
      const volunteersData = await getAllVolunteers();
      setVolunteers(volunteersData);
    } catch (error) {
      console.error('Error reloading volunteers:', error);
    }
  };

  const handleExportAssignments = async (format: 'pdf' | 'excel') => {
    setIsExporting(true);
    try {
      if (format === 'pdf') {
        await exportVolunteerAssignmentsPDF(volunteers, missions);
        toast.success('Export PDF généré avec succès');
      } else {
        exportVolunteerAssignmentsExcel(volunteers, missions);
        toast.success('Export Excel généré avec succès');
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast.error('Erreur lors de l\'export');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportGrid = async () => {
    setIsExporting(true);
    try {
      exportVolunteerMissionGridExcel(volunteers, missions);
      toast.success('Planning visuel généré avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast.error('Erreur lors de l\'export');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading || isLoadingVolunteers) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des bénévoles...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Bénévoles</h1>
          <p className="text-muted-foreground">
            Gérez les bénévoles, leurs informations et leurs inscriptions aux missions
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="default" 
            onClick={handleExportGrid}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Export...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Planning visuel
              </>
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isExporting}>
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Export...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Affectations
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Exporter les affectations</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExportAssignments('pdf')}>
                <FileText className="mr-2 h-4 w-4" />
                PDF - Liste détaillée par bénévole
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportAssignments('excel')}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel - Tableau d'affectations
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setShowCreateModal(true)}>
            <UserPlusIcon className="h-4 w-4 mr-2" />
            Créer un bénévole
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Bénévoles</CardTitle>
          <CardDescription>
            {volunteers.length} bénévole(s) inscrit(s) au festival
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Barre de recherche */}
          <div className="mb-4 flex items-center gap-2">
            <SearchIcon className="h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher un bénévole (nom, email)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          {/* Table des bénévoles */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Missions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVolunteers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Aucun bénévole trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVolunteers.map((volunteer) => {
                    const volunteerMissions = getVolunteerMissions(volunteer.uid);
                    return (
                      <TableRow key={volunteer.uid}>
                        <TableCell className="font-medium">
                          {volunteer.firstName} {volunteer.lastName}
                        </TableCell>
                        <TableCell>{volunteer.email}</TableCell>
                        <TableCell>{volunteer.phone || 'N/A'}</TableCell>
                        <TableCell>
                          <Select
                            value={volunteer.role}
                            onValueChange={(value) =>
                              handleChangeRole(volunteer.uid, value as any)
                            }
                            disabled={isProcessing || volunteer.uid === user.uid}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue>
                                <Badge variant={getRoleBadgeVariant(volunteer.role)}>
                                  {getRoleLabel(volunteer.role)}
                                </Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="volunteer">Bénévole</SelectItem>
                              <SelectItem value="admin">Administrateur</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => {
                              setSelectedVolunteer(volunteer);
                              setIsMissionsDialogOpen(true);
                            }}
                          >
                            {volunteerMissions.length} mission(s)
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(volunteer)}
                            >
                              <EditIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={volunteer.uid === user.uid}
                              onClick={() => {
                                setSelectedVolunteer(volunteer);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2Icon className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog d'édition */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier les informations</DialogTitle>
            <DialogDescription>
              Modifiez les informations du bénévole
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                value={editForm.firstName}
                onChange={(e) =>
                  setEditForm({ ...editForm, firstName: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                value={editForm.lastName}
                onChange={(e) =>
                  setEditForm({ ...editForm, lastName: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm({ ...editForm, phone: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isProcessing}
            >
              Annuler
            </Button>
            <Button onClick={handleSaveEdit} disabled={isProcessing}>
              {isProcessing ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de gestion des missions */}
      <Dialog open={isMissionsDialogOpen} onOpenChange={setIsMissionsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Missions de {selectedVolunteer?.firstName} {selectedVolunteer?.lastName}
            </DialogTitle>
            <DialogDescription>
              Gérez les inscriptions aux missions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {missions
              .sort((a, b) => {
                // Trier pour mettre en premier les missions où le bénévole est inscrit
                if (!selectedVolunteer) return 0;
                const aIsRegistered = a.volunteers.includes(selectedVolunteer.uid);
                const bIsRegistered = b.volunteers.includes(selectedVolunteer.uid);
                
                if (aIsRegistered && !bIsRegistered) return -1;
                if (!aIsRegistered && bIsRegistered) return 1;
                
                // Pour les missions du même type (inscrit ou non), trier par date
                if (!a.startDate && !b.startDate) return 0;
                if (!a.startDate) return -1;
                if (!b.startDate) return 1;
                return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
              })
              .map((mission) => {
              const isRegistered = selectedVolunteer
                ? mission.volunteers.includes(selectedVolunteer.uid)
                : false;
              const isFull =
                mission.volunteers.length >= mission.maxVolunteers && !isRegistered;

              return (
                <div
                  key={mission.id}
                  className={`flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors ${
                    isRegistered ? 'bg-green-50 border-green-300' : ''
                  }`}
                  title={
                    mission.startDate
                      ? `📅 ${formatDateTime(mission.startDate)}`
                      : 'Mission au long cours'
                  }
                >
                  <div className="flex-1">
                    <p className="font-medium flex items-center gap-2">
                      {isRegistered && <span className="text-green-600">✓</span>}
                      {mission.title}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{mission.location}</span>
                      <span>•</span>
                      <span>{mission.volunteers.length}/{mission.maxVolunteers} bénévoles</span>
                      {mission.startDate && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {formatDateTime(mission.startDate)}
                          </span>
                        </>
                      )}
                      {!mission.startDate && (
                        <>
                          <span>•</span>
                          <span className="italic">Mission au long cours</span>
                        </>
                      )}
                    </div>
                  </div>
                  {isRegistered ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleUnregisterFromMission(mission.id)}
                      disabled={isProcessing}
                    >
                      <UserMinusIcon className="mr-2 h-4 w-4" />
                      Désinscrire
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleRegisterToMission(mission.id)}
                      disabled={isProcessing || isFull}
                    >
                      <UserPlusIcon className="mr-2 h-4 w-4" />
                      {isFull ? 'Complet' : 'Inscrire'}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le bénévole sera supprimé définitivement et
              retiré de toutes ses missions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de création de bénévole */}
      <CreateVolunteerModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onVolunteerCreated={handleVolunteerCreated}
      />
    </div>
  );
}

