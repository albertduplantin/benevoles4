'use client';

import { useEffect } from 'react';

/**
 * La base gratuite s'endort après quelques minutes d'inactivité et met 1 à 3 secondes à se réveiller.
 * On la réveille dès l'arrivée sur la page de connexion, pendant que la personne tape son adresse :
 * quand elle valide, la base est prête.
 */
export function WakeDatabase() {
  useEffect(() => {
    fetch('/api/health', { cache: 'no-store' }).catch(() => {});
  }, []);
  return null;
}
