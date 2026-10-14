'use client';

import { useState, useMemo, useEffect } from 'react';
import { MissionClient, UserClient } from '@/types';
import {
  generateVolunteerCallMessage,
  generateVolunteerCallHTML,
  getIncompleteMissions,
  getVolunteerCallStats,
} from '@/lib/utils/volunteer-call-generator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
} from 'lucide-react';
import { getAllVolunteers } from '@/lib/api/users';

interface VolunteerCallModalV2Props {
  missions: MissionClient[];
}

type RecipientType = 'all' | 'by_category' | 'without_mission' | 'custom';

export function VolunteerCallModalV2({ missions }: VolunteerCallModalV2Props) {
  const [copied, setCopied] = useState<'text' | 'html' | null>(null);
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);

  // Filtres
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Sélection des missions
  const [selectedMissionIds, setSelectedMissionIds] = useState<Set<string>>(new Set());

  // Personnalisation
  const [customIntro, setCustomIntro] = useState('');
  const [festivalName, setFestivalName] = useState('Festival Films Courts de Dinan');
  const [festivalDates, setFestivalDates] = useState('19-23 novembre 2025');

  // Destinataires
  const [recipientType, setRecipientType] = useState<RecipientType>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [volunteers, setVolunteers] = useState<UserClient[]>([]);
  const [loadingVolunteers, setLoadingVolunteers] = useState(false);

  // Sujet de l'email
  const [emailSubject, setEmailSubject] = useState('🎬 Appel aux bénévoles - Festival Films Courts');

  // Récupérer toutes les missions incomplètes
  const allIncompleteMissions = getIncompleteMissions(missions);

  // Charger la liste des bénévoles quand le modal s'ouvre
  useEffect(() => {
    if (open && volunteers.length === 0) {
      setLoadingVolunteers(true);
      getAllVolunteers()
        .then(setVolunteers)
        .catch(err => {
          console.error('Erreur chargement bénévoles:', err);
          toast.error('Erreur lors du chargement des bénévoles');
        })
        .finally(() => setLoadingVolunteers(false));
    }
  }, [open, volunteers.length]);

  // Initialiser la sélection avec toutes les missions
  useEffect(() => {
    if (allIncompleteMissions.length > 0 && selectedMissionIds.size === 0) {
      setSelectedMissionIds(new Set(allIncompleteMissions.map(m => m.id)));
    }
  }, [allIncompleteMissions, selectedMissionIds.size]);

  // Extraire toutes les catégories uniques
  const allCategories = useMemo(() => {
    const categories = new Set(missions.map(m => m.category));
    return Array.from(categories).sort();
  }, [missions]);

  // Filtrer les missions selon les critères
  const filteredMissions = useMemo(() => {
    return allIncompleteMissions.filter(mission => {
      // Filtre par catégorie
      if (categoryFilter !== 'all' && mission.category !== categoryFilter) {
        return false;
      }

      // Filtre par urgence
      if (urgencyFilter === 'urgent' && !mission.isUrgent) {
        return false;
      }
      if (urgencyFilter === 'normal' && mission.isUrgent) {
        return false;
      }

      // Filtre par date
      if (dateFilter !== 'all' && mission.startDate) {
        const missionDate = new Date(mission.startDate);
        const today = new Date();
        const daysDiff = Math.ceil((missionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (dateFilter === 'soon' && daysDiff > 7) {
          return false;
        }
        if (dateFilter === 'later' && daysDiff <= 7) {
          return false;
        }
      }

      return true;
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
    if (recipientType === 'all') {
      return volunteers.length;
    }
    if (recipientType === 'custom') {
      return selectedUserIds.length;
    }
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
      setOpen(false);
    } catch (error: any) {
      console.error('Erreur envoi email:', error);
      toast.error(error.message || 'Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  if (allIncompleteMissions.length === 0) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <MegaphoneIcon className="h-4 w-4" />
        Appel aux bénévoles
        <Badge variant="secondary" className="ml-2">
          Toutes complètes
        </Badge>
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <MegaphoneIcon className="h-4 w-4" />
          Générer un appel aux bénévoles
          {selectedStats.urgentCount > 0 && (
            <Badge variant="destructive" className="ml-2 gap-1">
              <AlertCircleIcon className="h-3 w-3" />
              {selectedStats.urgentCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">📢 Appel aux Bénévoles (Version Améliorée)</DialogTitle>
          <DialogDescription>
            Sélectionnez les missions, personnalisez le message et envoyez directement par email
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* COLONNE GAUCHE: Sélection des missions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <FilterIcon className="h-5 w-5" />
                Sélection des Missions
              </h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleSelectAll}>
                  Tout
                </Button>
                <Button size="sm" variant="outline" onClick={handleSelectNone}>
                  Aucun
                </Button>
              </div>
            </div>

            {/* Statistiques sélection */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 bg-blue-50 rounded text-center">
                <p className="text-xl font-bold text-blue-600">{selectedStats.count}</p>
                <p className="text-xs text-blue-600">Mission{selectedStats.count > 1 ? 's' : ''}</p>
              </div>
              <div className="p-2 bg-orange-50 rounded text-center">
                <p className="text-xl font-bold text-orange-600">{selectedStats.totalPlaces}</p>
                <p className="text-xs text-orange-600">Place{selectedStats.totalPlaces > 1 ? 's' : ''}</p>
              </div>
              <div className="p-2 bg-red-50 rounded text-center">
                <p className="text-xl font-bold text-red-600">{selectedStats.urgentCount}</p>
                <p className="text-xs text-red-600">Urgent{selectedStats.urgentCount > 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Filtres */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Catégorie</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    {allCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Urgence</Label>
                <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="urgent">Urgentes</SelectItem>
                    <SelectItem value="normal">Normales</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Date</Label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="soon">Dans 7 jours</SelectItem>
                    <SelectItem value="later">Plus tard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Liste des missions avec checkboxes */}
            <div className="border rounded-lg p-3 max-h-80 overflow-y-auto space-y-2">
              {filteredMissions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Aucune mission ne correspond aux filtres
                </p>
              ) : (
                filteredMissions.map(mission => (
                  <div
                    key={mission.id}
                    className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleToggleMission(mission.id)}
                  >
                    <Checkbox
                      checked={selectedMissionIds.has(mission.id)}
                      onCheckedChange={() => handleToggleMission(mission.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{mission.title}</p>
                        {mission.isUrgent && (
                          <Badge variant="destructive" className="text-xs">URGENT</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{mission.category}</p>
                      <p className="text-xs text-gray-500">
                        {mission.maxVolunteers - mission.volunteers.length} place{mission.maxVolunteers - mission.volunteers.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* COLONNE DROITE: Personnalisation et envoi */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">✏️ Personnalisation</h3>

            {/* Options de personnalisation */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Nom du festival</Label>
                <Input
                  value={festivalName}
                  onChange={e => setFestivalName(e.target.value)}
                  className="h-9"
                  placeholder="Festival Films Courts de Dinan"
                />
              </div>
              <div>
                <Label className="text-xs">Dates du festival</Label>
                <Input
                  value={festivalDates}
                  onChange={e => setFestivalDates(e.target.value)}
                  className="h-9"
                  placeholder="19-23 novembre 2025"
                />
              </div>
              <div>
                <Label className="text-xs">Message d'introduction personnalisé (optionnel)</Label>
                <Textarea
                  value={customIntro}
                  onChange={e => setCustomIntro(e.target.value)}
                  placeholder="Bonjour à tous,&#10;&#10;J'espère que vous allez bien..."
                  className="h-20 text-sm"
                />
              </div>
            </div>

            {/* Destinataires */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <UsersIcon className="h-5 w-5" />
                Destinataires
              </h3>
              
              <div>
                <Label className="text-xs">Type de destinataires</Label>
                <Select value={recipientType} onValueChange={(v) => setRecipientType(v as RecipientType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les bénévoles</SelectItem>
                    <SelectItem value="by_category">Par catégories préférées</SelectItem>
                    <SelectItem value="without_mission">Sans mission assignée</SelectItem>
                    <SelectItem value="custom">Liste personnalisée</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {recipientType === 'by_category' && (
                <div>
                  <Label className="text-xs">Catégories</Label>
                  <div className="border rounded p-2 max-h-32 overflow-y-auto space-y-1">
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
                        <Label className="text-sm">{cat}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {recipientType === 'custom' && (
                <div>
                  <Label className="text-xs">Bénévoles (sélection personnalisée)</Label>
                  <div className="border rounded p-2 max-h-32 overflow-y-auto space-y-1">
                    {loadingVolunteers ? (
                      <p className="text-sm text-gray-500 text-center py-2">Chargement...</p>
                    ) : (
                      volunteers.map(vol => (
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
                          <Label className="text-sm">{vol.firstName} {vol.lastName}</Label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="p-2 bg-blue-50 rounded flex items-center justify-between">
                <p className="text-sm text-blue-700">Destinataires estimés:</p>
                <p className="text-lg font-bold text-blue-700">{estimatedRecipients}</p>
              </div>
            </div>

            {/* Sujet de l'email */}
            <div>
              <Label className="text-xs">Sujet de l'email</Label>
              <Input
                value={emailSubject}
                onChange={e => setEmailSubject(e.target.value)}
                placeholder="🎬 Appel aux bénévoles - Festival Films Courts"
              />
            </div>
          </div>
        </div>

        {/* Aperçu et Envoi */}
        <div className="space-y-4 border-t pt-4">
          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text">📱 WhatsApp / SMS</TabsTrigger>
              <TabsTrigger value="html">📧 Email (HTML)</TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-3">
              <div className="relative">
                <pre className="p-4 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap max-h-64 overflow-y-auto border">
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
                  className="p-4 bg-white rounded-lg border max-h-64 overflow-y-auto"
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
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="default"
              onClick={handleSendEmail}
              disabled={sending || selectedMissions.length === 0}
              className="gap-2"
            >
              {sending ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <SendIcon className="h-4 w-4" />
                  Envoyer par Email ({estimatedRecipients})
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

