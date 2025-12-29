import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from './config';
import { COLLECTIONS } from './collections';
import { NotificationSettings } from '@/types';

const USERS = COLLECTIONS.USERS;

/**
 * Paramètres de notification par défaut
 */
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  pushEnabled: true,
  emailEnabled: true,
  newAssignment: true,
  missionUpdate: true,
  missionReminder: true,
  missionCancellation: true,
  categoryMessages: true,
  generalAnnouncements: true,
};

/**
 * Sauvegarder le token FCM d'un utilisateur
 */
export async function saveFCMToken(userId: string, token: string): Promise<void> {
  try {
    const userRef = doc(db, USERS, userId);
    
    // Ajouter le token au tableau (évite les doublons avec arrayUnion)
    await updateDoc(userRef, {
      fcmTokens: arrayUnion(token),
    });
    
    console.log('Token FCM sauvegardé avec succès');
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du token FCM:', error);
    throw new Error('Impossible de sauvegarder le token de notification');
  }
}

/**
 * Supprimer un token FCM d'un utilisateur
 */
export async function removeFCMToken(userId: string, token: string): Promise<void> {
  try {
    const userRef = doc(db, USERS, userId);
    
    await updateDoc(userRef, {
      fcmTokens: arrayRemove(token),
    });
    
    console.log('Token FCM supprimé avec succès');
  } catch (error) {
    console.error('Erreur lors de la suppression du token FCM:', error);
    throw new Error('Impossible de supprimer le token de notification');
  }
}

/**
 * Récupérer les tokens FCM d'un utilisateur
 */
export async function getUserFCMTokens(userId: string): Promise<string[]> {
  try {
    const userRef = doc(db, USERS, userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return [];
    }
    
    const userData = userDoc.data();
    return userData.fcmTokens || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des tokens FCM:', error);
    return [];
  }
}

/**
 * Mettre à jour les paramètres de notification d'un utilisateur
 */
export async function updateNotificationSettings(
  userId: string,
  settings: Partial<NotificationSettings>
): Promise<void> {
  try {
    const userRef = doc(db, USERS, userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('Utilisateur introuvable');
    }
    
    const userData = userDoc.data();
    const currentSettings = userData.notificationSettings || DEFAULT_NOTIFICATION_SETTINGS;
    
    // Fusionner les paramètres actuels avec les nouveaux
    const updatedSettings: NotificationSettings = {
      ...currentSettings,
      ...settings,
    };
    
    await updateDoc(userRef, {
      notificationSettings: updatedSettings,
    });
    
    console.log('Paramètres de notification mis à jour');
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres:', error);
    throw new Error('Impossible de mettre à jour les paramètres de notification');
  }
}

/**
 * Récupérer les paramètres de notification d'un utilisateur
 */
export async function getNotificationSettings(userId: string): Promise<NotificationSettings> {
  try {
    const userRef = doc(db, USERS, userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return DEFAULT_NOTIFICATION_SETTINGS;
    }
    
    const userData = userDoc.data();
    return userData.notificationSettings || DEFAULT_NOTIFICATION_SETTINGS;
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error);
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

/**
 * Initialiser les paramètres de notification pour un nouvel utilisateur
 */
export async function initializeNotificationSettings(userId: string): Promise<void> {
  try {
    const userRef = doc(db, USERS, userId);
    
    await updateDoc(userRef, {
      notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,
    });
    
    console.log('Paramètres de notification initialisés');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des paramètres:', error);
    // Ne pas lancer d'erreur, ce n'est pas critique
  }
}











