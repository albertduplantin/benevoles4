import { db } from './config';
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getDocs, limit } from 'firebase/firestore';

/**
 * Créer une notification dans Firestore et déclencher l'envoi d'email
 * Cette fonction peut être appelée côté client après une inscription
 */
export async function notifyRegistration(
  missionId: string,
  volunteerId: string,
  volunteerName: string
): Promise<void> {
  try {
    // Appeler l'API de notifications
    // Utiliser l'URL complète si on est côté serveur, relative si côté client
    const apiUrl = typeof window !== 'undefined' 
      ? '/api/notifications/registration'
      : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/registration`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        missionId,
        volunteerId,
        volunteerName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erreur API notifications:', errorData);
      throw new Error(errorData.error || 'Erreur lors de l\'envoi des notifications');
    }

    const data = await response.json();
    console.log(`✅ Notifications envoyées: ${data.notified} destinataire(s)`);
  } catch (error) {
    console.error('Erreur lors de l\'envoi des notifications:', error);
    // Ne pas bloquer l'inscription si les notifications échouent
    throw error;
  }
}

/**
 * Créer une notification Firestore directement (sans email)
 * Utile si l'API n'est pas accessible
 */
export async function createNotificationDirect(
  userId: string,
  type: string,
  title: string,
  message: string,
  missionId?: string,
  missionTitle?: string
): Promise<void> {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      type,
      title,
      message,
      missionId,
      missionTitle,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error);
    throw error;
  }
}



