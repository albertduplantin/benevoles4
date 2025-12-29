'use client';

import { useEffect } from 'react';

/**
 * Provider pour enregistrer le Service Worker Firebase Messaging
 * Doit être placé dans le layout principal
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Enregistrer le Service Worker pour Firebase Messaging
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('✅ Service Worker enregistré:', registration.scope);
        })
        .catch((error) => {
          console.error('❌ Erreur d\'enregistrement du Service Worker:', error);
        });
    }
  }, []);

  return <>{children}</>;
}











