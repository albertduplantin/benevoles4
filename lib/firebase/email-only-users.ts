/**
 * Fonctions pour gérer les utilisateurs "Email Only"
 */

import { doc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './config';
import { COLLECTIONS } from './collections';
import { generatePersonalToken } from '@/lib/utils/token';
import { UserClient } from '@/types';

/**
 * Marquer un utilisateur comme "Email Only" et générer son token personnel
 */
export async function setUserEmailOnly(
  userId: string,
  emailOnly: boolean
): Promise<string | null> {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    
    if (emailOnly) {
      // Générer un token unique
      let token = generatePersonalToken();
      
      // Vérifier que le token n'existe pas déjà (très improbable)
      let attempts = 0;
      while (attempts < 3) {
        const existingUser = await getUserByToken(token);
        if (!existingUser) break;
        token = generatePersonalToken();
        attempts++;
      }
      
      await updateDoc(userRef, {
        emailOnly: true,
        personalToken: token,
        updatedAt: new Date(),
      });
      
      return token;
    } else {
      // Retirer le statut email-only
      await updateDoc(userRef, {
        emailOnly: false,
        personalToken: null,
        updatedAt: new Date(),
      });
      
      return null;
    }
  } catch (error) {
    console.error('Error setting user email-only status:', error);
    throw new Error('Impossible de modifier le statut email-only de l\'utilisateur');
  }
}

/**
 * Récupérer un utilisateur par son token personnel
 */
export async function getUserByToken(token: string): Promise<UserClient | null> {
  try {
    const usersRef = collection(db, COLLECTIONS.USERS);
    const q = query(usersRef, where('personalToken', '==', token));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    
    return {
      uid: userDoc.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      photoURL: userData.photoURL,
      role: userData.role,
      responsibleForCategories: userData.responsibleForCategories,
      emailOnly: userData.emailOnly,
      personalToken: userData.personalToken,
      createdAt: userData.createdAt?.toDate(),
      updatedAt: userData.updatedAt?.toDate(),
      consents: {
        dataProcessing: userData.consents?.dataProcessing || false,
        communications: userData.consents?.communications || false,
        consentDate: userData.consents?.consentDate?.toDate() || new Date(),
      },
      notificationPreferences: userData.notificationPreferences,
    } as UserClient;
  } catch (error) {
    console.error('Error getting user by token:', error);
    return null;
  }
}

/**
 * Récupérer tous les utilisateurs "Email Only"
 */
export async function getEmailOnlyUsers(): Promise<UserClient[]> {
  try {
    const usersRef = collection(db, COLLECTIONS.USERS);
    const q = query(usersRef, where('emailOnly', '==', true));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        photoURL: data.photoURL,
        role: data.role,
        responsibleForCategories: data.responsibleForCategories,
        emailOnly: data.emailOnly,
        personalToken: data.personalToken,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        consents: {
          dataProcessing: data.consents?.dataProcessing || false,
          communications: data.consents?.communications || false,
          consentDate: data.consents?.consentDate?.toDate() || new Date(),
        },
        notificationPreferences: data.notificationPreferences,
      } as UserClient;
    });
  } catch (error) {
    console.error('Error getting email-only users:', error);
    throw new Error('Impossible de récupérer les utilisateurs email-only');
  }
}

/**
 * Regénérer le token personnel d'un utilisateur
 */
export async function regeneratePersonalToken(userId: string): Promise<string> {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('Utilisateur introuvable');
    }
    
    const userData = userDoc.data();
    if (!userData.emailOnly) {
      throw new Error('Cet utilisateur n\'est pas en mode email-only');
    }
    
    const newToken = generatePersonalToken();
    await updateDoc(userRef, {
      personalToken: newToken,
      updatedAt: new Date(),
    });
    
    return newToken;
  } catch (error) {
    console.error('Error regenerating personal token:', error);
    throw new Error('Impossible de régénérer le token personnel');
  }
}


















