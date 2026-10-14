'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { CategoryResponsibleClient, UserClient } from '@/types';
import { getGroupedCategories } from '@/lib/api/categories';
import { MissionCategoryClient } from '@/types/category';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { UserPlusIcon, UserMinusIcon, UsersIcon, CrownIcon } from 'lucide-react';

export default function CategoryResponsiblesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [assignments, setAssignments] = useState<CategoryResponsibleClient[]>([]);
  const [volunteers, setVolunteers] = useState<UserClient[]>([]);
  const [groupedCategories, setGroupedCategories] = useState<Array<{ group: string; categories: MissionCategoryClient[] }>>([]);
  const [allCategories, setAllCategories] = useState<MissionCategoryClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Redirection si pas admin
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Charger les catégories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const grouped = await getGroupedCategories();
        setGroupedCategories(grouped);
        
        // Aplatir pour avoir toutes les catégories
        const all = grouped.flatMap(g => g.categories);
        setAllCategories(all);
      } catch (error) {
        console.error('Error loading categories:', error);
        toast.error('Erreur lors du chargement des catégories');
      }
    };

    if (user?.role === 'admin') {
      loadCategories();
    }
  }, [user]);

  // Charger les données (assignations et bénévoles)
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/category-responsibles');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const data = await response.json();
        console.log('📊 Données reçues:', data);
        console.log('👥 Bénévoles:', data.volunteers?.length || 0);
        console.log('📋 Assignations:', data.assignments?.length || 0);
        setAssignments(data.assignments || []);
        setVolunteers(data.volunteers || []);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.role === 'admin') {
      loadData();
    }
  }, [user]);

  // Obtenir TOUS les responsables d'une catégorie
  const getResponsiblesForCategory = (categoryId: string): UserClient[] => {
    const categoryAssignments = assignments.filter(a => a.categoryId === categoryId);
    return categoryAssignments
      .map(assignment => volunteers.find(v => v.uid === assignment.responsibleId))
      .filter((v): v is UserClient => v !== undefined);
  };

  // Assigner un responsable
  const handleAssign = async () => {
    if (!selectedCategory || !selectedVolunteer || !user) return;

    const category = allCategories.find(c => c.id === selectedCategory);
    if (!category) return;

    try {
      setIsAssigning(true);
      const response = await fetch('/api/category-responsibles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: selectedCategory, // ID Firestore de la catégorie
          categoryLabel: category.label,
          responsibleId: selectedVolunteer,
          adminId: user.uid,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign responsible');
      }

      // Recharger les données
      const dataResponse = await fetch('/api/category-responsibles');
      const data = await dataResponse.json();
      setAssignments(data.assignments);
      setVolunteers(data.volunteers);

      toast.success('Responsable assigné avec succès');
      setDialogOpen(false);
      setSelectedCategory(null);
      setSelectedVolunteer('');
    } catch (error: any) {
      console.error('Error assigning responsible:', error);
      toast.error(error.message || 'Erreur lors de l\'assignation');
    } finally {
      setIsAssigning(false);
    }
  };

  // Retirer un responsable
  const handleRemove = async (categoryId: string, responsibleId: string, responsibleName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir retirer ${responsibleName} comme responsable ?`)) return;

    try {
      const response = await fetch(`/api/category-responsibles?categoryId=${categoryId}&responsibleId=${responsibleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove responsible');
      }

      // Recharger les données
      const dataResponse = await fetch('/api/category-responsibles');
      const data = await dataResponse.json();
      setAssignments(data.assignments);
      setVolunteers(data.volunteers);

      toast.success('Responsable retiré avec succès');
    } catch (error: any) {
      console.error('Error removing responsible:', error);
      toast.error(error.message || 'Erreur lors du retrait');
    }
  };

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Responsables de Catégories</h1>
          <p className="text-muted-foreground">
            Gérez les responsables pour chaque catégorie de missions
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <UserPlusIcon className="h-4 w-4 mr-2" />
          Assigner un responsable
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Catégories</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allCategories.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Catégories Assignées</CardTitle>
            <CrownIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sans Responsable</CardTitle>
            <UserPlusIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allCategories.length - assignments.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des catégories */}
      {isLoading || groupedCategories.length === 0 ? (
        <p>Chargement...</p>
      ) : (
        <div className="space-y-6">
          {groupedCategories.map((group) => (
            <Card key={group.group}>
              <CardHeader>
                <CardTitle>{group.group}</CardTitle>
                <CardDescription>
                  Gérez les responsables de cette famille de catégories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {group.categories.map((category) => {
                    const responsibles = getResponsiblesForCategory(category.id);
                    return (
                      <div
                        key={category.id}
                        className="p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">{category.label}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCategory(category.id);
                              setDialogOpen(true);
                            }}
                          >
                            <UserPlusIcon className="h-4 w-4 mr-2" />
                            Ajouter un responsable
                          </Button>
                        </div>
                        
                        {responsibles.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Aucun responsable assigné
                          </p>
                        ) : (
                          <div className="space-y-2 mt-2">
                            {responsibles.map((responsible) => (
                              <div
                                key={responsible.uid}
                                className="flex items-center justify-between p-2 bg-white rounded border"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">👑</span>
                                  <div>
                                    <p className="text-sm font-medium">
                                      {responsible.firstName} {responsible.lastName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {responsible.email}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemove(
                                    category.id,
                                    responsible.uid,
                                    `${responsible.firstName} ${responsible.lastName}`
                                  )}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <UserMinusIcon className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog d'assignation */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assigner un responsable</DialogTitle>
            <DialogDescription>
              Choisissez une catégorie et un bénévole à promouvoir comme responsable
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select value={selectedCategory || ''} onValueChange={setSelectedCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {groupedCategories.flatMap((group) =>
                    group.categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {group.group} - {cat.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="volunteer">Bénévole</Label>
              <Select value={selectedVolunteer} onValueChange={setSelectedVolunteer}>
                <SelectTrigger id="volunteer">
                  <SelectValue placeholder="Sélectionner un bénévole" />
                </SelectTrigger>
                <SelectContent>
                  {volunteers.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Aucun bénévole disponible
                    </div>
                  ) : (
                    volunteers.map((vol) => (
                      <SelectItem key={vol.uid} value={vol.uid}>
                        {vol.firstName} {vol.lastName} ({vol.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {volunteers.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Tous les bénévoles sont déjà responsables ou aucun bénévole n'est inscrit
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedCategory || !selectedVolunteer || isAssigning}
            >
              {isAssigning ? 'Assignation...' : 'Assigner'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

