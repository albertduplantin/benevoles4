'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { MissionClient, UserClient } from '@/types';
import {
  generateVolunteerCallMessage,
  generateVolunteerCallHTML,
  getIncompleteMissions,
  generateDefaultIntroMessage,
} from '@/lib/utils/volunteer-call-generator';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  CopyIcon,
  CheckIcon,
  AlertCircleIcon,
  MegaphoneIcon,
  FilterIcon,
  SendIcon,
  Loader2Icon,
  UsersIcon,
  ArrowLeftIcon,
  SparklesIcon,
} from 'lucide-react';
import { getAllVolunteers } from '@/lib/api/users';
import { getAllMissions } from '@/lib/api/missions';

type RecipientType = 'all' | 'by_category' | 'without_mission' | 'custom';

export default function VolunteerCallPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [copied, setCopied] = useState<'text' | 'html' | null>(null);
  const [sending, setSending] = useState(false);

  // Données
  const [missions, setMissions] = useState<MissionClient[]>([]);
  const [volunteers, setVolunteers] = useState<UserClient[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Filtres
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Sélection des missions
  const [selectedMissionIds, setSelectedMissionIds] = useState<Set<string>>(new Set());
  const [hasInitialized, setHasInitialized] = useState(false);

  // Personnalisation
  const [customIntro, setCustomIntro] = useState('');
  const [festivalName, setFestivalName] = useState('Festival Films Courts de Dinan');
  const [festivalDates, setFestivalDates] = useState('19-23 novembre 2025');

  // Destinataires
  const [recipientType, setRecipientType] = useState<RecipientType>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Sujet de l'email
  const [emailSubject, setEmailSubject] = useState('🎬 Appel aux bénévoles - Festival Films Courts');

  // Vérifier l'authentification
  useEffect(() => {
    if (!loading && (!user || (user.role !== 'admin' && user.role !== 'category_responsible'))) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Charger les données
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        const [missionsData, volunteersData] = await Promise.all([
          getAllMissions(),
          getAllVolunteers(),
        ]);
        setMissions(missionsData);
        setVolunteers(volunteersData);
      } catch (error) {
        console.error('Erreur chargement données:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoadingData(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  // Récupérer toutes les missions incomplètes
  const allIncompleteMissions = useMemo(() => getIncompleteMissions(missions), [missions]);

  // Initialiser la sélection avec toutes les missions et le message par défaut (une seule fois au chargement)
  useEffect(() => {
    if (allIncompleteMissions.length > 0 && !hasInitialized) {
      setSelectedMissionIds(new Set(allIncompleteMissions.map(m => m.id)));
      
      // Calculer le total de places restantes pour le message par défaut
      const totalPlaces = allIncompleteMissions.reduce(
        (sum, m) => sum + (m.maxVolunteers - m.volunteers.length),
        0
      );
      
      // Pré-remplir le message d'introduction
      const defaultMessage = generateDefaultIntroMessage(totalPlaces, festivalName, festivalDates);
      setCustomIntro(defaultMessage);
      
      setHasInitialized(true);
    }
  }, [allIncompleteMissions, hasInitialized, festivalName, festivalDates]);

  // Extraire toutes les catégories uniques
  const allCategories = useMemo(() => {
    const categories = new Set(missions.map(m => m.category));
    return Array.from(categories).sort();
  }, [missions]);

  // Filtrer et trier les missions selon les critères
  const filteredMissions = useMemo(() => {
    const filtered = allIncompleteMissions.filter(mission => {
      if (categoryFilter !== 'all' && mission.category !== categoryFilter) return false;
      if (urgencyFilter === 'urgent' && !mission.isUrgent) return false;
      if (urgencyFilter === 'normal' && mission.isUrgent) return false;

      if (dateFilter !== 'all' && mission.startDate) {
        const missionDate = new Date(mission.startDate);
        const today = new Date();
        const daysDiff = Math.ceil((missionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (dateFilter === 'soon' && daysDiff > 7) return false;
        if (dateFilter === 'later' && daysDiff <= 7) return false;
      }

      return true;
    });

    // Trier par date (les plus proches en premier)
    return filtered.sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : Infinity;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : Infinity;
      return dateA - dateB;
    });
  }, [allIncompleteMissions, categoryFilter, urgencyFilter, dateFilter]);

  // Missions sélectionnées
  const selectedMissions = useMemo(() => {
    return filteredMissions.filter(m => selectedMissionIds.has(m.id));
  }, [filteredMissions, selectedMissionIds]);

  // Statistiques des missions sélectionnées
  const selectedStats = useMemo(() => {
    const totalPlaces = selectedMissions.reduce(
      (sum, m) => sum + (m.maxVolunteers - m.volunteers.length),
      0
    );
    const urgentCount = selectedMissions.filter(m => m.isUrgent).length;
    return {
      count: selectedMissions.length,
      totalPlaces,
      urgentCount,
    };
  }, [selectedMissions]);

  // Mettre à jour le message quand les missions sélectionnées changent
  useEffect(() => {
    if (hasInitialized && selectedStats.totalPlaces > 0) {
      const updatedMessage = generateDefaultIntroMessage(
        selectedStats.totalPlaces,
        festivalName,
        festivalDates
      );
      setCustomIntro(updatedMessage);
    }
  }, [selectedStats.totalPlaces, festivalName, festivalDates, hasInitialized]);

  // Générer les messages avec les options
  const textMessage = useMemo(() => {
    return generateVolunteerCallMessage(selectedMissions, {
      customIntro,
      festivalName,
      festivalDates,
    });
  }, [selectedMissions, customIntro, festivalName, festivalDates]);

  const htmlMessage = useMemo(() => {
    return generateVolunteerCallHTML(selectedMissions, {
      customIntro,
      festivalName,
      festivalDates,
    });
  }, [selectedMissions, customIntro, festivalName, festivalDates]);

  // Calculer le nombre de destinataires estimé
  const estimatedRecipients = useMemo(() => {
    if (recipientType === 'all') return volunteers.length;
    if (recipientType === 'custom') return selectedUserIds.length;
    if (recipientType === 'by_category') {
      return volunteers.filter(v =>
        v.preferences?.preferredCategories?.some(cat => selectedCategories.includes(cat))
      ).length;
    }
    if (recipientType === 'without_mission') {
      const assignedUserIds = new Set(
        missions.filter(m => m.status === 'published').flatMap(m => m.volunteers)
      );
      return volunteers.filter(v => !assignedUserIds.has(v.uid)).length;
    }
    return 0;
  }, [recipientType, volunteers, selectedUserIds, selectedCategories, missions]);

  const handleToggleMission = (missionId: string) => {
    const newSet = new Set(selectedMissionIds);
    if (newSet.has(missionId)) {
      newSet.delete(missionId);
    } else {
      newSet.add(missionId);
    }
    setSelectedMissionIds(newSet);
  };

  const handleSelectAll = () => {
    setSelectedMissionIds(new Set(filteredMissions.map(m => m.id)));
  };

  const handleSelectNone = () => {
    setSelectedMissionIds(new Set());
  };

  const handleCopy = async (content: string, type: 'text' | 'html') => {
    try {
      if (type === 'html') {
        const blob = new Blob([content], { type: 'text/html' });
        const clipboardItem = new ClipboardItem({
          'text/html': blob,
          'text/plain': new Blob([content], { type: 'text/plain' }),
        });
        await navigator.clipboard.write([clipboardItem]);
      } else {
        await navigator.clipboard.writeText(content);
      }

      setCopied(type);
      toast.success('Message copié !');
      setTimeout(() => setCopied(null), 3000);
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
      toast.error('Erreur lors de la copie');
    }
  };

  const handleSendEmail = async () => {
    if (selectedMissions.length === 0) {
      toast.error('Veuillez sélectionner au moins une mission');
      return;
    }

    if (!customIntro || customIntro.trim() === '') {
      toast.error('Le message d\'introduction est obligatoire');
      return;
    }

    if (recipientType === 'custom' && selectedUserIds.length === 0) {
      toast.error('Veuillez sélectionner au moins un destinataire');
      return;
    }

    if (recipientType === 'by_category' && selectedCategories.length === 0) {
      toast.error('Veuillez sélectionner au moins une catégorie');
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/volunteer-calls/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientType,
          categoryIds: selectedCategories,
          userIds: selectedUserIds,
          subject: emailSubject,
          htmlContent: htmlMessage,
          textContent: textMessage,
          missionIds: selectedMissions.map(m => m.id),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi');
      }

      toast.success(`✅ Email envoyé à ${data.recipientCount} bénévole(s) !`);
      router.push('/dashboard/overview');
    } catch (error: any) {
      console.error('Erreur envoi email:', error);
      toast.error(error.message || 'Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2Icon className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (allIncompleteMissions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => router.push('/dashboard/overview')} className="mb-6">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Retour au dashboard
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Aucune mission incomplète</CardTitle>
            <CardDescription>
              Toutes les missions sont complètes ! Aucun appel nécessaire pour le moment.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* En-tête */}
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.push('/dashboard/overview')} className="mb-4">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Retour au dashboard
        </Button>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-blue-100 rounded-lg">
            <MegaphoneIcon className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Appel aux Bénévoles</h1>
            <p className="text-gray-600">Générez et envoyez un appel personnalisé</p>
          </div>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{selectedStats.count}</p>
              <p className="text-sm text-gray-600">Mission{selectedStats.count > 1 ? 's' : ''} sélectionnée{selectedStats.count > 1 ? 's' : ''}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">{selectedStats.totalPlaces}</p>
              <p className="text-sm text-gray-600">Place{selectedStats.totalPlaces > 1 ? 's' : ''} à pourvoir</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">{selectedStats.urgentCount}</p>
              <p className="text-sm text-gray-600">Mission{selectedStats.urgentCount > 1 ? 's' : ''} urgente{selectedStats.urgentCount > 1 ? 's' : ''}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{estimatedRecipients}</p>
              <p className="text-sm text-gray-600">Destinataire{estimatedRecipients > 1 ? 's' : ''}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLONNE 1: Sélection des missions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FilterIcon className="h-5 w-5" />
              Sélection des Missions
            </CardTitle>
            <CardDescription>
              Choisissez les missions à inclure dans l'appel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Boutons de sélection */}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleSelectAll} className="flex-1">
                Tout sélectionner
              </Button>
              <Button size="sm" variant="outline" onClick={handleSelectNone} className="flex-1">
                Tout désélectionner
              </Button>
            </div>

            {/* Filtres */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold">Catégorie</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {allCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Urgence</Label>
                <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="urgent">Urgentes uniquement</SelectItem>
                    <SelectItem value="normal">Normales uniquement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Date</Label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les dates</SelectItem>
                    <SelectItem value="soon">Dans les 7 jours</SelectItem>
                    <SelectItem value="later">Plus tard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Liste des missions avec checkboxes */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
              {filteredMissions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Aucune mission ne correspond aux filtres
                </p>
              ) : (
                filteredMissions.map(mission => (
                  <div
                    key={mission.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-200"
                    onClick={() => handleToggleMission(mission.id)}
                  >
                    <Checkbox
                      checked={selectedMissionIds.has(mission.id)}
                      onCheckedChange={() => handleToggleMission(mission.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{mission.title}</p>
                        {mission.isUrgent && (
                          <Badge variant="destructive" className="text-xs">URGENT</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{mission.category}</p>
                      <p className="text-xs text-blue-600 font-medium mt-1">
                        {mission.maxVolunteers - mission.volunteers.length} place{mission.maxVolunteers - mission.volunteers.length > 1 ? 's' : ''} restante{mission.maxVolunteers - mission.volunteers.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* COLONNE 2 & 3: Personnalisation et Destinataires */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personnalisation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SparklesIcon className="h-5 w-5" />
                Personnalisation du Message
              </CardTitle>
              <CardDescription>
                Adaptez le message à votre contexte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nom du festival</Label>
                  <Input
                    value={festivalName}
                    onChange={e => setFestivalName(e.target.value)}
                    placeholder="Festival Films Courts de Dinan"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Dates du festival</Label>
                  <Input
                    value={festivalDates}
                    onChange={e => setFestivalDates(e.target.value)}
                    placeholder="19-23 novembre 2025"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="flex items-center gap-1">
                  Message d'introduction <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  value={customIntro}
                  onChange={e => setCustomIntro(e.target.value)}
                  placeholder="Bonjour à tous,&#10;&#10;J'espère que vous allez bien..."
                  className="mt-1 h-24"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Le nombre de places est calculé automatiquement selon les missions sélectionnées
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Destinataires */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5" />
                Destinataires
              </CardTitle>
              <CardDescription>
                Choisissez à qui envoyer l'appel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Type de destinataires</Label>
                <Select value={recipientType} onValueChange={(v) => setRecipientType(v as RecipientType)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex flex-col items-start">
                        <span>Tous les bénévoles</span>
                        <span className="text-xs text-gray-500">Envoyer à tous les inscrits</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="by_category">
                      <div className="flex flex-col items-start">
                        <span>Par catégories préférées</span>
                        <span className="text-xs text-gray-500">Cibler selon les préférences</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="without_mission">
                      <div className="flex flex-col items-start">
                        <span>Sans mission assignée</span>
                        <span className="text-xs text-gray-500">Bénévoles sans mission</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="custom">
                      <div className="flex flex-col items-start">
                        <span>Liste personnalisée</span>
                        <span className="text-xs text-gray-500">Sélection manuelle</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {recipientType === 'by_category' && (
                <div>
                  <Label>Sélectionner les catégories</Label>
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto mt-1 space-y-2">
                    {allCategories.map(cat => (
                      <div key={cat} className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedCategories.includes(cat)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCategories([...selectedCategories, cat]);
                            } else {
                              setSelectedCategories(selectedCategories.filter(c => c !== cat));
                            }
                          }}
                        />
                        <Label className="text-sm cursor-pointer">{cat}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {recipientType === 'custom' && (
                <div>
                  <Label>Sélectionner les bénévoles</Label>
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto mt-1 space-y-2">
                    {volunteers.map(vol => (
                      <div key={vol.uid} className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedUserIds.includes(vol.uid)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedUserIds([...selectedUserIds, vol.uid]);
                            } else {
                              setSelectedUserIds(selectedUserIds.filter(id => id !== vol.uid));
                            }
                          }}
                        />
                        <Label className="text-sm cursor-pointer">
                          {vol.firstName} {vol.lastName}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label>Sujet de l'email</Label>
                <Input
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  placeholder="🎬 Appel aux bénévoles - Festival Films Courts"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Aperçu et Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Aperçu et Envoi</CardTitle>
              <CardDescription>
                Prévisualisez votre message avant de l'envoyer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="text" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text">📱 WhatsApp / SMS</TabsTrigger>
                  <TabsTrigger value="html">📧 Email (HTML)</TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-3">
                  <div className="relative">
                    <pre className="p-4 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap max-h-96 overflow-y-auto border">
                      {textMessage}
                    </pre>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-2 right-2"
                      onClick={() => handleCopy(textMessage, 'text')}
                    >
                      {copied === 'text' ? (
                        <>
                          <CheckIcon className="h-4 w-4 mr-2" />
                          Copié !
                        </>
                      ) : (
                        <>
                          <CopyIcon className="h-4 w-4 mr-2" />
                          Copier
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="html" className="space-y-3">
                  <div className="relative">
                    <div
                      className="p-4 bg-white rounded-lg border max-h-96 overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: htmlMessage }}
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-2 right-2"
                      onClick={() => handleCopy(htmlMessage, 'html')}
                    >
                      {copied === 'html' ? (
                        <>
                          <CheckIcon className="h-4 w-4 mr-2" />
                          Copié !
                        </>
                      ) : (
                        <>
                          <CopyIcon className="h-4 w-4 mr-2" />
                          Copier
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Boutons d'action */}
              <div className="flex gap-3 justify-end pt-4">
                <Button variant="outline" onClick={() => router.push('/dashboard/overview')}>
                  Annuler
                </Button>
                <Button
                  variant="default"
                  size="lg"
                  onClick={handleSendEmail}
                  disabled={sending || selectedMissions.length === 0}
                  className="gap-2"
                >
                  {sending ? (
                    <>
                      <Loader2Icon className="h-5 w-5 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <SendIcon className="h-5 w-5" />
                      Envoyer par Email ({estimatedRecipients})
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

