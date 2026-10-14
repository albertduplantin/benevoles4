'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { MissionCategoryClient } from '@/types/category';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  archiveCategory,
  isCategoryUsed,
} from '@/lib/api/categories';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  ArchiveIcon,
  TagIcon,
  FolderIcon,
} from 'lucide-react';

export default function CategoriesManagementPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<MissionCategoryClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MissionCategoryClient | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formValue, setFormValue] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formGroup, setFormGroup] = useState('');
  const [formOrder, setFormOrder] = useState(1);

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
        setIsLoading(true);
        const data = await getAllCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error loading categories:', error);
        toast.error('Erreur lors du chargement des catégories');
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.role === 'admin') {
      loadCategories();
    }
  }, [user]);

  // Grouper les catégories
  const groupedCategories = categories.reduce((acc, cat) => {
    if (!acc[cat.group]) {
      acc[cat.group] = [];
    }
    acc[cat.group].push(cat);
    return acc;
  }, {} as Record<string, MissionCategoryClient[]>);

  // Ouvrir le dialogue pour créer
  const handleCreate = () => {
    setEditingCategory(null);
    setFormValue('');
    setFormLabel('');
    setFormGroup('');
    setFormOrder(1);
    setDialogOpen(true);
  };

  // Ouvrir le dialogue pour éditer
  const handleEdit = (category: MissionCategoryClient) => {
    setEditingCategory(category);
    setFormValue(category.value);
    setFormLabel(category.label);
    setFormGroup(category.group);
    setFormOrder(category.order);
    setDialogOpen(true);
  };

  // Sauvegarder (créer ou modifier)
  const handleSave = async () => {
    if (!user || !formLabel || !formGroup) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setIsSaving(true);

      if (editingCategory) {
        // Modification
        await updateCategory(editingCategory.id, {
          label: formLabel,
          group: formGroup,
          order: formOrder,
        });
        toast.success('Catégorie modifiée avec succès');
      } else {
        // Création
        if (!formValue) {
          toast.error('L\'identifiant est obligatoire');
          return;
        }
        await createCategory(formValue, formLabel, formGroup, formOrder, user.uid);
        toast.success('Catégorie créée avec succès');
      }

      // Recharger
      const data = await getAllCategories();
      setCategories(data);
      setDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  // Archiver une catégorie
  const handleArchive = async (category: MissionCategoryClient) => {
    if (!confirm(`Êtes-vous sûr de vouloir archiver "${category.label}" ?`)) return;

    try {
      await archiveCategory(category.id);
      toast.success('Catégorie archivée');
      const data = await getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error archiving category:', error);
      toast.error('Erreur lors de l\'archivage');
    }
  };

  // Supprimer une catégorie
  const handleDelete = async (category: MissionCategoryClient) => {
    const isUsed = await isCategoryUsed(category.value);
    
    if (isUsed) {
      toast.error('Cette catégorie est utilisée par des missions. Archivez-la plutôt.');
      return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement "${category.label}" ?`)) return;

    try {
      await deleteCategory(category.id);
      toast.success('Catégorie supprimée');
      const data = await getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Erreur lors de la suppression');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Catégories</h1>
          <p className="text-muted-foreground">
            Créez et organisez les catégories de missions
          </p>
        </div>
        <Button onClick={handleCreate}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Nouvelle catégorie
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Catégories</CardTitle>
            <TagIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actives</CardTitle>
            <TagIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categories.filter(c => c.active).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Groupes</CardTitle>
            <FolderIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(groupedCategories).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des catégories par groupe */}
      {isLoading ? (
        <p>Chargement des catégories...</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedCategories).map(([groupName, cats]) => (
            <Card key={groupName}>
              <CardHeader>
                <CardTitle>{groupName}</CardTitle>
                <CardDescription>{cats.length} catégorie(s)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {cats.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{cat.label}</p>
                          {!cat.active && <Badge variant="secondary">Archivée</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(cat)}
                        >
                          <EditIcon className="h-4 w-4" />
                        </Button>
                        {cat.active ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleArchive(cat)}
                            className="text-orange-600"
                          >
                            <ArchiveIcon className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(cat)}
                            className="text-red-600"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de création/édition */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Modifiez les informations de la catégorie'
                : 'Créez une nouvelle catégorie de mission'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!editingCategory && (
              <div className="space-y-2">
                <Label htmlFor="value">Identifiant *</Label>
                <Input
                  id="value"
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                  placeholder="ex: ma_categorie"
                  disabled={isSaving}
                />
                <p className="text-xs text-muted-foreground">
                  L'identifiant ne peut pas être modifié après création
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="label">Libellé *</Label>
              <Input
                id="label"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder="ex: Ma catégorie"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="group">Groupe *</Label>
              <Input
                id="group"
                value={formGroup}
                onChange={(e) => setFormGroup(e.target.value)}
                placeholder="ex: Mon groupe"
                disabled={isSaving}
                list="existing-groups"
              />
              <datalist id="existing-groups">
                {Object.keys(groupedCategories).map(g => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <Label htmlFor="order">Ordre d'affichage</Label>
              <Input
                id="order"
                type="number"
                value={formOrder}
                onChange={(e) => setFormOrder(parseInt(e.target.value) || 1)}
                min={1}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

