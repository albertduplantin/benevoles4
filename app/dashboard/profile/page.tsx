'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { getInitials, getAvatarColor } from '@/lib/utils/avatar';
import { formatDateTime } from '@/lib/utils/date';
import { updateUserPreferences } from '@/lib/api/users';
import { toast } from 'sonner';
import { signOut } from 'next-auth/react';
import {
  UserIcon,
  MailIcon,
  PhoneIcon,
  CalendarIcon,
  ShieldCheckIcon,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  // États locaux pour les préférences
  const [communications, setCommunications] = useState(user?.consents.communications || false);
  const [emailNotif, setEmailNotif] = useState(user?.notificationPreferences?.email || false);
  const [smsNotif, setSmsNotif] = useState(user?.notificationPreferences?.sms || false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setCommunications(user.consents.communications);
      setEmailNotif(user.notificationPreferences?.email || false);
      setSmsNotif(user.notificationPreferences?.sms || false);
    }
  }, [user]);

  const handleUpdatePreference = async (
    type: 'communications' | 'emailNotif' | 'smsNotif',
    value: boolean
  ) => {
    if (!user) return;

    setIsSaving(true);
    try {
      let updateData: any = {};

      if (type === 'communications') {
        updateData = {
          'consents.communications': value,
        };
        setCommunications(value);
      } else if (type === 'emailNotif') {
        updateData = {
          'notificationPreferences.email': value,
        };
        setEmailNotif(value);
      } else if (type === 'smsNotif') {
        updateData = {
          'notificationPreferences.sms': value,
        };
        setSmsNotif(value);
      }

      await updateUserPreferences(user.uid, updateData);
      await refreshUser();
      toast.success('Préférences mises à jour');
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Erreur lors de la mise à jour');
      
      // Revert sur erreur
      if (type === 'communications') setCommunications(!value);
      else if (type === 'emailNotif') setEmailNotif(!value);
      else if (type === 'smsNotif') setSmsNotif(!value);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Mon Profil</h1>

      <div className="grid gap-6">
        {/* Carte principale */}
        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
            <CardDescription>Vos informations de compte</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.photoURL || undefined} alt={user.firstName} />
                  <AvatarFallback
                    className="text-2xl"
                    style={{ backgroundColor: getAvatarColor(user.uid) }}
                  >
                    {getInitials(user.firstName, user.lastName)}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Informations */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Nom complet</p>
                    <p className="font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MailIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="break-all font-medium">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Téléphone</p>
                    <p className="font-medium">{user.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <ShieldCheckIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Rôle</p>
                    <div className="mt-1">
                      {user.role === 'admin' && (
                        <Badge variant="gold">Administrateur</Badge>
                      )}
                      {user.role === 'category_responsible' && (
                        <Badge className="bg-purple-600">Responsable de catégorie</Badge>
                      )}
                      {user.role === 'volunteer' && (
                        <Badge className="bg-blue-600">Bénévole</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Membre depuis</p>
                    <p className="font-medium">
                      {formatDateTime(user.createdAt instanceof Date ? user.createdAt : new Date((user.createdAt as any).seconds * 1000))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Carte Consentements RGPD */}
        <Card>
          <CardHeader>
            <CardTitle>Consentements RGPD</CardTitle>
            <CardDescription>
              Gestion de vos données personnelles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <Label htmlFor="data-processing" className="text-base font-medium cursor-pointer">
                  Traitement des données
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  J'accepte le traitement de mes données personnelles (obligatoire)
                </p>
              </div>
              <Badge variant={user.consents.dataProcessing ? 'default' : 'secondary'} className="ml-4">
                {user.consents.dataProcessing ? 'Accepté' : 'Refusé'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 border-2 rounded-lg hover:border-gray-300 transition-colors">
              <div className="flex-1">
                <Label htmlFor="communications" className="text-base font-medium cursor-pointer">
                  Communications
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  Recevoir des notifications par email sur les missions
                </p>
              </div>
              <Switch
                id="communications"
                checked={communications}
                onCheckedChange={(checked) => handleUpdatePreference('communications', checked)}
                disabled={isSaving}
                className="ml-4"
              />
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500">
                Date du consentement : {formatDateTime(user.consents.consentDate instanceof Date ? user.consents.consentDate : new Date((user.consents.consentDate as any).seconds * 1000))}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Préférences de notification */}
        <Card>
          <CardHeader>
            <CardTitle>Préférences de notification</CardTitle>
            <CardDescription>
              Comment souhaitez-vous être contacté
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border-2 rounded-lg hover:border-gray-300 transition-colors">
              <div className="flex-1">
                <Label htmlFor="email-notif" className="text-base font-medium cursor-pointer">
                  Notifications par email
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  Recevoir des mises à jour par email
                </p>
              </div>
              <Switch
                id="email-notif"
                checked={emailNotif}
                onCheckedChange={(checked) => handleUpdatePreference('emailNotif', checked)}
                disabled={isSaving}
                className="ml-4"
              />
            </div>

            <div className="flex items-center justify-between p-4 border-2 rounded-lg hover:border-gray-300 transition-colors">
              <div className="flex-1">
                <Label htmlFor="sms-notif" className="text-base font-medium cursor-pointer">
                  Notifications par SMS
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  Recevoir des mises à jour par SMS
                </p>
              </div>
              <Switch
                id="sms-notif"
                checked={smsNotif}
                onCheckedChange={(checked) => handleUpdatePreference('smsNotif', checked)}
                disabled={isSaving}
                className="ml-4"
              />
            </div>
          </CardContent>
        </Card>

        <Button
          variant="outline"
          className="h-12 w-full border-red-200 text-base text-red-700 hover:bg-red-50"
          onClick={() => signOut({ callbackUrl: '/auth/login' })}
        >
          Se déconnecter
        </Button>
      </div>
    </div>
  );
}
