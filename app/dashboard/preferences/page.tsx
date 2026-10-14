'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  CalendarIcon,
  ClockIcon,
  BriefcaseIcon,
  TimerIcon,
  AwardIcon,
  CarIcon,
  PackageIcon,
  SaveIcon,
  Loader2,
  HeartIcon,
} from 'lucide-react';
import { updateVolunteerPreferences } from '@/lib/api/users';
import { getGroupedCategories } from '@/lib/api/categories';
import { getAdminSettings } from '@/lib/api/settings';
import { MissionCategoryClient, VolunteerPreferences } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Switch } from '@/components/ui/switch';
import { getCategoryDescription } from '@/lib/constants/category-descriptions';
import {
  Tooltip as TooltipComponent,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

// Compétences prédéfinies
const PREDEFINED_SKILLS = [
  'Permis de conduire',
  'Premiers secours',
  'Bilingue (Anglais)',
  'Bilingue (Espagnol)',
  'Bilingue (Allemand)',
  'Autre langue',
  'Compétences techniques (son, lumière, vidéo)',
  'Expérience en animation',
  'Expérience en gestion de foule',
  'Cuisine / Service',
  'Comptabilité / Caisse',
];

// Fonction pour générer tous les jours entre deux dates
function generateFestivalDays(startDate: Date, endDate: Date): Array<{ date: string; label: string }> {
  const days: Array<{ date: string; label: string }> = [];
  
  let currentYear = startDate.getFullYear();
  let currentMonth = startDate.getMonth();
  let currentDay = startDate.getDate();
  
  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth();
  const endDay = endDate.getDate();

  while (true) {
    const current = new Date(currentYear, currentMonth, currentDay, 0, 0, 0, 0);
    const end = new Date(endYear, endMonth, endDay, 0, 0, 0, 0);
    
    if (current > end) break;
    
    // Format YYYY-MM-DD pour la valeur
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    // Format français pour le label
    const label = format(current, 'EEEE d MMMM', { locale: fr });
    
    days.push({ 
      date: dateStr, 
      label: label.charAt(0).toUpperCase() + label.slice(1) 
    });
    
    // Passer au jour suivant
    currentDay++;
    const nextDate = new Date(currentYear, currentMonth, currentDay);
    currentYear = nextDate.getFullYear();
    currentMonth = nextDate.getMonth();
    currentDay = nextDate.getDate();
  }
  
  return days;
}

export default function PreferencesPage() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  
  // États pour les données
  const [categories, setCategories] = useState<MissionCategoryClient[]>([]);
  const [festivalDays, setFestivalDays] = useState<Array<{ date: string; label: string }>>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // États pour les préférences
  const [availableDateSlots, setAvailableDateSlots] = useState<Record<string, ('morning' | 'afternoon' | 'evening')[]>>({});
  const [availableForPreFestival, setAvailableForPreFestival] = useState(false);
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);
  const [preferredTimeSlots, setPreferredTimeSlots] = useState<Array<'morning' | 'afternoon' | 'evening' | 'night'>>([]);
  const [preferredPostType, setPreferredPostType] = useState<'static' | 'dynamic' | 'both'>('both');
  const [preferredDuration, setPreferredDuration] = useState<Array<'short' | 'medium' | 'long'>>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [hasCar, setHasCar] = useState(false);
  const [canTransportEquipment, setCanTransportEquipment] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState('');

  // Redirection si non connecté
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Charger les données initiales (catégories et dates du festival)
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        setIsLoadingData(true);
        
        // Charger les catégories
        const groupedCategories = await getGroupedCategories();
        const allCategories = groupedCategories.flatMap(g => g.categories);
        setCategories(allCategories);
        
        // Charger les dates du festival
        const settings = await getAdminSettings();
        if (settings.festivalStartDate && settings.festivalEndDate) {
          const days = generateFestivalDays(settings.festivalStartDate, settings.festivalEndDate);
          setFestivalDays(days);
        }
        
        // Charger les préférences existantes
        if (user.preferences) {
          const prefs = user.preferences;
          
          // Migration : si ancien format (availableDates), convertir en availableDateSlots
          if (prefs.availableDates && prefs.availableDates.length > 0 && !prefs.availableDateSlots) {
            const converted: Record<string, ('morning' | 'afternoon' | 'evening')[]> = {};
            prefs.availableDates.forEach((date: string) => {
              converted[date] = ['morning', 'afternoon', 'evening']; // Toute la journée par défaut
            });
            setAvailableDateSlots(converted);
          } else {
            setAvailableDateSlots(prefs.availableDateSlots || {});
          }
          
          setAvailableForPreFestival(prefs.availableForPreFestival || false);
          setPreferredCategories(prefs.preferredCategories || []);
          setPreferredTimeSlots(prefs.preferredTimeSlots || []);
          setPreferredPostType(prefs.preferredPostType || 'both');
          setPreferredDuration(prefs.preferredDuration || []);
          setSkills(prefs.skills || []);
          setHasCar(prefs.hasCar || false);
          setCanTransportEquipment(prefs.canTransportEquipment || false);
          setAdditionalInfo(prefs.additionalInfo || '');
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [user]);

  // Gestion de la sélection de créneau pour une date
  const toggleDateSlot = (date: string, slot: 'morning' | 'afternoon' | 'evening') => {
    setAvailableDateSlots(prev => {
      const current = prev[date] || [];
      const updated = current.includes(slot)
        ? current.filter(s => s !== slot)
        : [...current, slot];
      
      // Si tous les créneaux sont désélectionnés, retirer la date
      if (updated.length === 0) {
        const { [date]: _, ...rest } = prev;
        return rest;
      }
      
      return {
        ...prev,
        [date]: updated,
      };
    });
  };

  // Vérifier si une date a au moins un créneau sélectionné
  const hasAnySlot = (date: string): boolean => {
    const slots = availableDateSlots[date];
    return slots && slots.length > 0;
  };

  // Gestion du clic sur une catégorie
  const toggleCategory = (categoryValue: string) => {
    setPreferredCategories(prev => 
      prev.includes(categoryValue) 
        ? prev.filter(c => c !== categoryValue)
        : [...prev, categoryValue]
    );
  };

  // Gestion des créneaux horaires
  const toggleTimeSlot = (slot: 'morning' | 'afternoon' | 'evening' | 'night') => {
    setPreferredTimeSlots(prev => 
      prev.includes(slot) 
        ? prev.filter(s => s !== slot)
        : [...prev, slot]
    );
  };

  // Gestion de la durée
  const toggleDuration = (duration: 'short' | 'medium' | 'long') => {
    setPreferredDuration(prev => 
      prev.includes(duration) 
        ? prev.filter(d => d !== duration)
        : [...prev, duration]
    );
  };

  // Gestion des compétences
  const toggleSkill = (skill: string) => {
    setSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  // Sauvegarder les préférences
  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const preferences: VolunteerPreferences = {
        availableDateSlots,
        availableForPreFestival,
        preferredCategories,
        preferredTimeSlots,
        preferredPostType,
        preferredDuration,
        skills,
        hasCar,
        canTransportEquipment,
        additionalInfo: additionalInfo.trim(),
      };

      await updateVolunteerPreferences(user.uid, preferences);
      await refreshUser();
      toast.success('Préférences enregistrées avec succès !');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Erreur lors de l\'enregistrement des préférences');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Mes Préférences</h1>
        <p className="text-muted-foreground">
          Renseignez vos préférences pour aider les administrateurs à vous affecter aux missions qui vous correspondent le mieux.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Disponibilités (dates avec créneaux) */}
        {festivalDays.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                <CardTitle>Disponibilités pendant le festival</CardTitle>
              </div>
              <CardDescription>
                Sélectionnez les jours ET les créneaux horaires où vous êtes disponible
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className="space-y-3">
                  {festivalDays.map((day) => {
                    const daySlots = availableDateSlots[day.date] || [];
                    return (
                      <div
                        key={day.date}
                        className={`p-4 border-2 rounded-lg transition-colors ${
                          hasAnySlot(day.date)
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="font-medium mb-3">{day.label}</div>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { value: 'morning', label: 'Matin', emoji: '🌅', desc: 'Jusqu\'à 13h' },
                            { value: 'afternoon', label: 'Après-midi', emoji: '☀️', desc: '13h-18h' },
                            { value: 'evening', label: 'Soir', emoji: '🌆', desc: 'Après 18h' },
                          ].map((slot) => (
                            <TooltipComponent key={slot.value}>
                              <TooltipTrigger asChild>
                                <div
                                  className={`flex items-center gap-2 p-2 border-2 rounded cursor-pointer transition-colors text-sm ${
                                    daySlots.includes(slot.value as any)
                                      ? 'border-primary bg-primary/10'
                                      : 'border-gray-300 hover:border-gray-400'
                                  }`}
                                  onClick={() => toggleDateSlot(day.date, slot.value as any)}
                                >
                                  <Checkbox
                                    checked={daySlots.includes(slot.value as any)}
                                    onCheckedChange={() => toggleDateSlot(day.date, slot.value as any)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <span>{slot.emoji}</span>
                                  <span className="flex-1">{slot.label}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{slot.desc}</p>
                              </TooltipContent>
                            </TooltipComponent>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {Object.keys(availableDateSlots).length === 0 && (
                  <p className="text-sm text-muted-foreground mt-4">
                    Aucune disponibilité sélectionnée. Sélectionnez au moins un créneau pour aider à votre affectation.
                  </p>
                )}
              </TooltipProvider>
            </CardContent>
          </Card>
        )}

        {/* Missions en amont du festival */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <CardTitle>Missions en amont du festival</CardTitle>
            </div>
            <CardDescription>
              Êtes-vous disponible pour des missions de préparation avant le festival ?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border-2 rounded-lg">
              <div className="flex-1">
                <Label htmlFor="pre-festival" className="text-base font-medium cursor-pointer">
                  Je suis disponible pour les missions en amont
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Montage, installation, préparation logistique, affichage...
                </p>
              </div>
              <Switch
                id="pre-festival"
                checked={availableForPreFestival}
                onCheckedChange={setAvailableForPreFestival}
              />
            </div>
          </CardContent>
        </Card>

        {/* Catégories préférées */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <HeartIcon className="h-5 w-5 text-primary" />
              <CardTitle>Catégories de missions préférées</CardTitle>
            </div>
            <CardDescription>
              Sélectionnez les types de missions qui vous intéressent le plus (survolez les cases pour plus d'infos)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categories.map((category) => (
                  <TooltipComponent key={category.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                          preferredCategories.includes(category.value)
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => toggleCategory(category.value)}
                      >
                        <Checkbox
                          checked={preferredCategories.includes(category.value)}
                          onCheckedChange={(checked) => toggleCategory(category.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Label className="cursor-pointer flex-1" onClick={() => toggleCategory(category.value)}>
                          {category.label}
                        </Label>
                        <HelpCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs" side="top">
                      <p className="text-sm">{getCategoryDescription(category.value)}</p>
                    </TooltipContent>
                  </TooltipComponent>
                ))}
              </div>
              {preferredCategories.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Aucune catégorie sélectionnée. Toutes les missions peuvent vous être proposées.
                </p>
              )}
            </TooltipProvider>
          </CardContent>
        </Card>

        {/* Créneaux horaires préférés */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-primary" />
              <CardTitle>Créneaux horaires préférés</CardTitle>
            </div>
            <CardDescription>
              Indiquez vos préférences horaires pour les missions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: 'morning', label: 'Matin (6h-12h)' },
                { value: 'afternoon', label: 'Après-midi (12h-18h)' },
                { value: 'evening', label: 'Soirée (18h-00h)' },
                { value: 'night', label: 'Nuit (00h-6h)' },
              ].map((slot) => (
                <div
                  key={slot.value}
                  className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    preferredTimeSlots.includes(slot.value as any)
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleTimeSlot(slot.value as any)}
                >
                  <Checkbox
                    checked={preferredTimeSlots.includes(slot.value as any)}
                    onCheckedChange={(checked) => toggleTimeSlot(slot.value as any)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Label className="cursor-pointer flex-1 text-sm" onClick={() => toggleTimeSlot(slot.value as any)}>{slot.label}</Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Type de poste et durée */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Type de poste */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BriefcaseIcon className="h-5 w-5 text-primary" />
                <CardTitle>Type de poste</CardTitle>
              </div>
              <CardDescription>
                Quel type de poste préférez-vous ?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { value: 'static', label: 'Statique', desc: 'Accueil, billetterie, caisse...' },
                { value: 'dynamic', label: 'Dynamique', desc: 'Logistique, montage, animation...' },
                { value: 'both', label: 'Les deux', desc: 'Pas de préférence particulière' },
              ].map((type) => (
                <div
                  key={type.value}
                  className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    preferredPostType === type.value
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPreferredPostType(type.value as any)}
                >
                  <Checkbox
                    checked={preferredPostType === type.value}
                    onCheckedChange={(checked) => setPreferredPostType(type.value as any)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1" onClick={() => setPreferredPostType(type.value as any)}>
                    <Label className="cursor-pointer font-medium">{type.label}</Label>
                    <p className="text-xs text-muted-foreground mt-1">{type.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Durée préférée */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TimerIcon className="h-5 w-5 text-primary" />
                <CardTitle>Durée de mission préférée</CardTitle>
              </div>
              <CardDescription>
                Quelle durée de mission vous convient ?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { value: 'short', label: 'Courte', desc: 'Moins de 3 heures' },
                { value: 'medium', label: 'Moyenne', desc: '3 à 6 heures' },
                { value: 'long', label: 'Longue', desc: 'Plus de 6 heures' },
              ].map((duration) => (
                <div
                  key={duration.value}
                  className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    preferredDuration.includes(duration.value as any)
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleDuration(duration.value as any)}
                >
                  <Checkbox
                    checked={preferredDuration.includes(duration.value as any)}
                    onCheckedChange={(checked) => toggleDuration(duration.value as any)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1" onClick={() => toggleDuration(duration.value as any)}>
                    <Label className="cursor-pointer font-medium">{duration.label}</Label>
                    <p className="text-xs text-muted-foreground mt-1">{duration.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Compétences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AwardIcon className="h-5 w-5 text-primary" />
              <CardTitle>Compétences et expériences</CardTitle>
            </div>
            <CardDescription>
              Sélectionnez vos compétences pertinentes pour le festival
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PREDEFINED_SKILLS.map((skill) => (
                <div
                  key={skill}
                  className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    skills.includes(skill)
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleSkill(skill)}
                >
                  <Checkbox
                    checked={skills.includes(skill)}
                    onCheckedChange={(checked) => toggleSkill(skill)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Label className="cursor-pointer flex-1" onClick={() => toggleSkill(skill)}>{skill}</Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Mobilité */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CarIcon className="h-5 w-5 text-primary" />
              <CardTitle>Mobilité et transport</CardTitle>
            </div>
            <CardDescription>
              Informations sur votre capacité de transport
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border-2 rounded-lg">
              <div className="flex-1">
                <Label htmlFor="has-car" className="text-base font-medium cursor-pointer">
                  Je possède un véhicule
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Peut être utile pour certaines missions
                </p>
              </div>
              <Switch
                id="has-car"
                checked={hasCar}
                onCheckedChange={setHasCar}
              />
            </div>

            <div className="flex items-center justify-between p-4 border-2 rounded-lg">
              <div className="flex-1">
                <Label htmlFor="can-transport" className="text-base font-medium cursor-pointer flex items-center gap-2">
                  <PackageIcon className="h-4 w-4" />
                  Je peux transporter du matériel
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Petit matériel ou équipement léger
                </p>
              </div>
              <Switch
                id="can-transport"
                checked={canTransportEquipment}
                onCheckedChange={setCanTransportEquipment}
              />
            </div>
          </CardContent>
        </Card>

        {/* Informations supplémentaires */}
        <Card>
          <CardHeader>
            <CardTitle>Informations supplémentaires</CardTitle>
            <CardDescription>
              Ajoutez toute information qui pourrait être utile pour votre affectation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Ex: Expérience particulière, contraintes horaires spécifiques, allergies, besoins d'accessibilité..."
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Bouton de sauvegarde */}
        <div className="flex justify-end gap-3 sticky bottom-4 bg-background p-4 border rounded-lg shadow-lg">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="min-w-[150px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <SaveIcon className="mr-2 h-4 w-4" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

