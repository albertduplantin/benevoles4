'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getAdminSettings, updateAdminSettings, AdminSettings } from '@/lib/api/settings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Save, Lock, Unlock } from 'lucide-react';

export function RegistrationControl() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [registrationsBlocked, setRegistrationsBlocked] = useState(false);
  const [blockMessage, setBlockMessage] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const adminSettings = await getAdminSettings();
        setSettings(adminSettings);
        setRegistrationsBlocked(adminSettings.registrationsBlocked);
        setBlockMessage(adminSettings.registrationBlockedMessage || '');
      } catch (error) {
        console.error('Erreur chargement settings:', error);
        toast.error('Erreur lors du chargement des paramètres');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      await updateAdminSettings(
        {
          registrationsBlocked,
          registrationBlockedMessage: blockMessage.trim() || '',
        },
        user.uid
      );

      toast.success('Paramètres sauvegardés avec succès');
      
      // Recharger les settings
      const updatedSettings = await getAdminSettings();
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde des paramètres');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {registrationsBlocked ? (
            <Lock className="h-5 w-5 text-red-600" />
          ) : (
            <Unlock className="h-5 w-5 text-green-600" />
          )}
          Contrôle des Inscriptions
        </CardTitle>
        <CardDescription>
          Bloquez temporairement les inscriptions aux missions et personnalisez le message affiché
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Switch de blocage */}
        <div className={`flex items-center justify-between p-4 border-2 rounded-lg transition-all ${
          registrationsBlocked 
            ? 'bg-red-50 border-red-300' 
            : 'bg-white border-gray-300'
        }`}>
          <div className="flex-1">
            <Label htmlFor="block-registrations" className="text-base font-semibold">
              Bloquer les inscriptions aux missions
            </Label>
            <p className="text-sm text-gray-600 mt-1">
              Les bénévoles ne pourront plus s'inscrire aux missions tant que cette option est activée
            </p>
          </div>
          <div className="ml-4 flex flex-col items-center gap-1">
            <Switch
              id="block-registrations"
              checked={registrationsBlocked}
              onCheckedChange={setRegistrationsBlocked}
              className="data-[state=checked]:bg-red-600"
            />
            <span className={`text-xs font-medium ${
              registrationsBlocked ? 'text-red-600' : 'text-gray-500'
            }`}>
              {registrationsBlocked ? 'Activé' : 'Désactivé'}
            </span>
          </div>
        </div>

        {/* Message personnalisé */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="block-message" className="text-base">
              Message personnalisé {registrationsBlocked && <span className="text-red-500">*</span>}
            </Label>
            <p className="text-sm text-gray-600 mt-1">
              Ce message sera affiché dans un bandeau rouge sur toutes les pages de missions
            </p>
          </div>
          <Textarea
            id="block-message"
            value={blockMessage}
            onChange={(e) => setBlockMessage(e.target.value)}
            placeholder="Exemple : Les inscriptions sont fermées. Pour vous inscrire, veuillez appeler Sonia au 06 12 34 56 78 ou envoyer un email à sonia@festival.fr"
            className="min-h-[120px]"
            disabled={!registrationsBlocked}
          />
          {!blockMessage && registrationsBlocked && (
            <p className="text-sm text-amber-600">
              ⚠️ Si vide, un message par défaut sera affiché
            </p>
          )}
        </div>

        {/* Aperçu */}
        {registrationsBlocked && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Aperçu du bandeau</Label>
            <div className="bg-red-600 text-white p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <Lock className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">⚠️ Inscriptions fermées</p>
                  <p className="text-sm mt-1 whitespace-pre-wrap">
                    {blockMessage || "Les inscriptions aux missions sont temporairement fermées. Pour vous inscrire, veuillez contacter l'équipe d'organisation."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bouton sauvegarder */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={saving}
            size="lg"
            className="gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Sauvegarder
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

