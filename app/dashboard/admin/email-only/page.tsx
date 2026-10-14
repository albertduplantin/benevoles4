'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { getAllVolunteers } from '@/lib/api/users';
import { setUserEmailOnly, regeneratePersonalToken } from '@/lib/api/users';
import { UserClient } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, getAvatarColor } from '@/lib/utils/avatar';
import { CreateVolunteerModal } from '@/components/features/admin/create-volunteer-modal';
import { toast } from 'sonner';
import {
  MailIcon,
  CopyIcon,
  RefreshCwIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  SearchIcon,
  XIcon,
  UserPlusIcon,
} from 'lucide-react';

export default function EmailOnlyVolunteersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [volunteers, setVolunteers] = useState<UserClient[]>([]);
  const [filteredVolunteers, setFilteredVolunteers] = useState<UserClient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Vérifier les permissions
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Charger les bénévoles
  useEffect(() => {
    const loadVolunteers = async () => {
      if (!user || user.role !== 'admin') return;

      try {
        setIsLoading(true);
        const allVolunteers = await getAllVolunteers();
        
        // Trier : emailOnly en premier
        allVolunteers.sort((a, b) => {
          if (a.emailOnly && !b.emailOnly) return -1;
          if (!a.emailOnly && b.emailOnly) return 1;
          return a.lastName.localeCompare(b.lastName);
        });
        
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
  }, [user]);

  // Filtrer les bénévoles
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

  const handleToggleEmailOnly = async (volunteer: UserClient) => {
    try {
      setProcessingUserId(volunteer.uid);
      const newEmailOnly = !volunteer.emailOnly;
      const token = await setUserEmailOnly(volunteer.uid, newEmailOnly);

      // Mettre à jour localement
      setVolunteers(prev =>
        prev.map(v =>
          v.uid === volunteer.uid
            ? { ...v, emailOnly: newEmailOnly, personalToken: token || undefined }
            : v
        )
      );

      if (newEmailOnly) {
        toast.success(`${volunteer.firstName} est maintenant en mode "Email uniquement"`);
      } else {
        toast.success(`${volunteer.firstName} peut maintenant se connecter normalement`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la modification');
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleCopyLink = (volunteer: UserClient) => {
    if (!volunteer.personalToken) {
      toast.error('Token non disponible');
      return;
    }

    const link = `${window.location.origin}/mes-missions?token=${volunteer.personalToken}`;
    navigator.clipboard.writeText(link);
    toast.success('Lien copié dans le presse-papier');
  };

  const handleRegenerateToken = async (volunteer: UserClient) => {
    if (!confirm(`Régénérer le lien personnel de ${volunteer.firstName} ${volunteer.lastName} ?\n\nL'ancien lien ne fonctionnera plus.`)) {
      return;
    }

    try {
      setProcessingUserId(volunteer.uid);
      const newToken = await regeneratePersonalToken(volunteer.uid);

      // Mettre à jour localement
      setVolunteers(prev =>
        prev.map(v =>
          v.uid === volunteer.uid
            ? { ...v, personalToken: newToken }
            : v
        )
      );

      toast.success('Nouveau lien généré avec succès');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la régénération');
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleVolunteerCreated = async () => {
    // Recharger la liste des bénévoles
    try {
      const allVolunteers = await getAllVolunteers();
      allVolunteers.sort((a, b) => {
        if (a.emailOnly && !b.emailOnly) return -1;
        if (!a.emailOnly && b.emailOnly) return 1;
        return a.lastName.localeCompare(b.lastName);
      });
      setVolunteers(allVolunteers);
      setFilteredVolunteers(allVolunteers);
    } catch (error) {
      console.error('Error reloading volunteers:', error);
    }
  };

  const emailOnlyCount = volunteers.filter(v => v.emailOnly).length;

  if (loading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Bénévoles "Email uniquement"</h1>
            <p className="text-muted-foreground">
              Gérez les bénévoles qui utilisent uniquement l'email (sans connexion à la plateforme)
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <UserPlusIcon className="h-4 w-4 mr-2" />
            Créer un bénévole
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total bénévoles</CardDescription>
              <CardTitle className="text-3xl">{volunteers.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Mode "Email uniquement"</CardDescription>
              <CardTitle className="text-3xl">{emailOnlyCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Connexion normale</CardDescription>
              <CardTitle className="text-3xl">{volunteers.length - emailOnlyCount}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Info */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <MailIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Comment ça fonctionne ?</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Activez le mode "Email uniquement" pour les bénévoles réfractaires à l'informatique</li>
                  <li>Un lien personnel unique est généré automatiquement</li>
                  <li>Copiez et envoyez-leur ce lien par email</li>
                  <li>Ils pourront consulter leurs missions et se désinscrire sans se connecter</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <Card>
          <CardHeader>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un bénévole..."
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
          </CardHeader>
        </Card>

        {/* Volunteers list */}
        <Card>
          <CardHeader>
            <CardTitle>
              Bénévoles ({filteredVolunteers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredVolunteers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucun bénévole trouvé
              </p>
            ) : (
              <div className="divide-y">
                {filteredVolunteers.map((volunteer) => {
                  const isProcessing = processingUserId === volunteer.uid;

                  return (
                    <div
                      key={volunteer.uid}
                      className="flex items-center justify-between py-4 gap-4"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <Avatar>
                          {volunteer.photoURL ? (
                            <AvatarImage src={volunteer.photoURL} alt={volunteer.firstName} />
                          ) : (
                            <AvatarFallback
                              style={{ backgroundColor: getAvatarColor(volunteer.email) }}
                            >
                              {getInitials(volunteer.firstName, volunteer.lastName)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium truncate">
                              {volunteer.firstName} {volunteer.lastName}
                            </p>
                            {volunteer.emailOnly && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                <MailIcon className="h-3 w-3 mr-1" />
                                Email uniquement
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {volunteer.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {volunteer.emailOnly && volunteer.personalToken && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyLink(volunteer)}
                              disabled={isProcessing}
                              title="Copier le lien personnel"
                            >
                              <CopyIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRegenerateToken(volunteer)}
                              disabled={isProcessing}
                              title="Regénérer le lien"
                            >
                              <RefreshCwIcon className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant={volunteer.emailOnly ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleToggleEmailOnly(volunteer)}
                          disabled={isProcessing}
                          className={volunteer.emailOnly ? 'bg-blue-600 hover:bg-blue-700' : ''}
                        >
                          {isProcessing ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                          ) : volunteer.emailOnly ? (
                            <>
                              <ToggleRightIcon className="h-4 w-4 mr-1" />
                              Activé
                            </>
                          ) : (
                            <>
                              <ToggleLeftIcon className="h-4 w-4 mr-1" />
                              Inactif
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de création de bénévole */}
      <CreateVolunteerModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onVolunteerCreated={handleVolunteerCreated}
      />
    </div>
  );
}

