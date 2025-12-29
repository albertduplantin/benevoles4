'use client';

import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isProfileComplete } from '@/lib/firebase/users';
import { getNotificationSettings, updateNotificationSettings } from '@/lib/firebase/fcm-tokens';
import { NotificationSettings } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, BellIcon, BellOffIcon, SaveIcon } from 'lucide-react';

export default function NotificationSettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { isSupported, permission, isLoading: isNotifLoading, isEnabled, enableNotifications, disableNotifications } = useNotifications();
  
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    } else if (!loading && user && !isProfileComplete(user)) {
      router.push('/auth/complete-profile');
    }
  }, [user, loading, router]);

  // Charger les paramètres de notification
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      
      try {
        setIsLoadingSettings(true);
        const userSettings = await getNotificationSettings(user.uid);
        setSettings(userSettings);
      } catch (error) {
        console.error('Error loading notification settings:', error);
        toast.error('Erreur lors du chargement des paramètres');
      } finally {
        setIsLoadingSettings(false);
      }
    };

    loadSettings();
  }, [user]);

  const handleTogglePush = async () => {
    if (isEnabled) {
      // Désactiver
      const success = await disableNotifications();
      if (success && settings) {
        const newSettings = { ...settings, pushEnabled: false };
        setSettings(newSettings);
        await updateNotificationSettings(user!.uid, newSettings);
      }
    } else {
      // Activer
      const success = await enableNotifications();
      if (success && settings) {
        const newSettings = { ...settings, pushEnabled: true };
        setSettings(newSettings);
        await updateNotificationSettings(user!.uid, newSettings);
      }
    }
  };

  const handleSaveSettings = async () => {
    if (!user || !settings) return;

    try {
      setIsSaving(true);
      await updateNotificationSettings(user.uid, settings);
      toast.success('Paramètres sauvegardés avec succès');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erreur lors de la sauvegarde des paramètres');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  if (loading || isLoadingSettings || !user || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <BellIcon className="h-8 w-8" />
          Paramètres de notification
        </h1>
        <p className="text-muted-foreground">
          Gérez vos préférences de notification push et email
        </p>
      </div>

      {/* Notifications Push */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications Push</CardTitle>
          <CardDescription>
            Recevez des notifications en temps réel sur cet appareil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isSupported ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Les notifications push ne sont pas supportées par votre navigateur
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">
                    {isEnabled ? '🔔 Notifications activées' : '🔕 Notifications désactivées'}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {permission === 'denied'
                      ? 'Vous avez refusé les notifications. Veuillez modifier les paramètres de votre navigateur.'
                      : isEnabled
                        ? 'Vous recevez des notifications push sur cet appareil'
                        : 'Activer pour recevoir des notifications en temps réel'}
                  </p>
                </div>
                {permission !== 'denied' && (
                  <Button
                    onClick={handleTogglePush}
                    disabled={isNotifLoading}
                    variant={isEnabled ? 'destructive' : 'default'}
                  >
                    {isNotifLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isEnabled ? (
                      <>
                        <BellOffIcon className="h-4 w-4 mr-2" />
                        Désactiver
                      </>
                    ) : (
                      <>
                        <BellIcon className="h-4 w-4 mr-2" />
                        Activer
                      </>
                    )}
                  </Button>
                )}
              </div>

              {permission === 'denied' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    Pour activer les notifications, vous devez autoriser les notifications dans les paramètres de votre navigateur, puis recharger cette page.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Types de notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Types de notifications</CardTitle>
          <CardDescription>
            Choisissez les types de notifications que vous souhaitez recevoir
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-enabled">Notifications par email</Label>
              <p className="text-sm text-muted-foreground">
                Recevoir les notifications importantes par email
              </p>
            </div>
            <Switch
              id="email-enabled"
              checked={settings.emailEnabled}
              onCheckedChange={(checked) => updateSetting('emailEnabled', checked)}
            />
          </div>

          <hr />

          {/* Nouvelle affectation */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="new-assignment">Nouvelle affectation</Label>
              <p className="text-sm text-muted-foreground">
                Vous avez été affecté(e) à une mission
              </p>
            </div>
            <Switch
              id="new-assignment"
              checked={settings.newAssignment}
              onCheckedChange={(checked) => updateSetting('newAssignment', checked)}
            />
          </div>

          {/* Modification de mission */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="mission-update">Modification de mission</Label>
              <p className="text-sm text-muted-foreground">
                Une mission à laquelle vous êtes inscrit a été modifiée
              </p>
            </div>
            <Switch
              id="mission-update"
              checked={settings.missionUpdate}
              onCheckedChange={(checked) => updateSetting('missionUpdate', checked)}
            />
          </div>

          {/* Rappel de mission */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="mission-reminder">Rappel de mission</Label>
              <p className="text-sm text-muted-foreground">
                Rappel 24h avant vos missions
              </p>
            </div>
            <Switch
              id="mission-reminder"
              checked={settings.missionReminder}
              onCheckedChange={(checked) => updateSetting('missionReminder', checked)}
            />
          </div>

          {/* Annulation de mission */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="mission-cancel">Annulation de mission</Label>
              <p className="text-sm text-muted-foreground">
                Une mission à laquelle vous êtes inscrit a été annulée
              </p>
            </div>
            <Switch
              id="mission-cancel"
              checked={settings.missionCancellation}
              onCheckedChange={(checked) => updateSetting('missionCancellation', checked)}
            />
          </div>

          {/* Messages de catégorie */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="category-messages">Messages de catégorie</Label>
              <p className="text-sm text-muted-foreground">
                Messages des responsables de catégorie
              </p>
            </div>
            <Switch
              id="category-messages"
              checked={settings.categoryMessages}
              onCheckedChange={(checked) => updateSetting('categoryMessages', checked)}
            />
          </div>

          {/* Annonces générales */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="general-announcements">Annonces générales</Label>
              <p className="text-sm text-muted-foreground">
                Annonces importantes du festival
              </p>
            </div>
            <Switch
              id="general-announcements"
              checked={settings.generalAnnouncements}
              onCheckedChange={(checked) => updateSetting('generalAnnouncements', checked)}
            />
          </div>

          <Button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="w-full mt-4"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <SaveIcon className="h-4 w-4 mr-2" />
                Sauvegarder les paramètres
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Informations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">📌 À propos des notifications</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground">
          <p>• Les notifications push nécessitent l'autorisation de votre navigateur</p>
          <p>• Vous pouvez activer les notifications sur plusieurs appareils</p>
          <p>• Les notifications par email sont toujours envoyées pour les actions importantes</p>
          <p>• Vous pouvez modifier ces paramètres à tout moment</p>
        </CardContent>
      </Card>
    </div>
  );
}











