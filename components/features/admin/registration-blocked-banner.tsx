'use client';

import { useEffect, useState } from 'react';
import { getAdminSettings, AdminSettings } from '@/lib/firebase/admin-settings';
import { AlertCircle } from 'lucide-react';

export function RegistrationBlockedBanner() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const adminSettings = await getAdminSettings();
        setSettings(adminSettings);
      } catch (error) {
        console.error('Erreur chargement settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  if (loading || !settings || !settings.registrationsBlocked) {
    return null;
  }

  const defaultMessage = "Les inscriptions aux missions sont temporairement fermées. Pour vous inscrire, veuillez contacter l'équipe d'organisation.";
  const message = settings.registrationBlockedMessage || defaultMessage;

  return (
    <div className="bg-red-600 text-white">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-sm sm:text-base">
              ⚠️ Inscriptions fermées
            </p>
            <p className="text-sm mt-1 whitespace-pre-wrap">
              {message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}



