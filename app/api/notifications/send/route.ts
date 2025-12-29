import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebase/admin';
import { NotificationPayload, NotificationType } from '@/types';

/**
 * API pour envoyer des notifications push à des utilisateurs spécifiques
 * POST /api/notifications/send
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userIds, payload }: { userIds: string[]; payload: NotificationPayload } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'userIds est requis et doit être un tableau non vide' },
        { status: 400 }
      );
    }

    if (!payload || !payload.title || !payload.body) {
      return NextResponse.json(
        { error: 'payload.title et payload.body sont requis' },
        { status: 400 }
      );
    }

    // Récupérer les tokens FCM de tous les utilisateurs
    const db = admin.firestore();
    const tokens: string[] = [];
    
    for (const userId of userIds) {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        
        // Vérifier les paramètres de notification de l'utilisateur
        const notifSettings = userData?.notificationSettings;
        if (notifSettings && !notifSettings.pushEnabled) {
          console.log(`Notifications push désactivées pour l'utilisateur ${userId}`);
          continue;
        }
        
        // Vérifier le type de notification spécifique
        if (!shouldSendNotification(payload.type, notifSettings)) {
          console.log(`Type de notification ${payload.type} désactivé pour l'utilisateur ${userId}`);
          continue;
        }
        
        const userTokens = userData?.fcmTokens || [];
        tokens.push(...userTokens);
      }
    }

    if (tokens.length === 0) {
      return NextResponse.json(
        { message: 'Aucun token FCM trouvé pour ces utilisateurs', sent: 0 },
        { status: 200 }
      );
    }

    // Préparer le message FCM
    const message: admin.messaging.MulticastMessage = {
      tokens: tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        type: payload.type,
        url: payload.url || '/dashboard',
        missionId: payload.missionId || '',
        categoryId: payload.categoryId || '',
        ...payload.data,
      },
      webpush: {
        fcmOptions: {
          link: payload.url || '/dashboard',
        },
        notification: {
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          requireInteraction: true,
        },
      },
    };

    // Envoyer les notifications
    const response = await admin.messaging().sendEachForMulticast(message);

    console.log(`Notifications envoyées: ${response.successCount}/${tokens.length}`);

    // Nettoyer les tokens invalides
    if (response.failureCount > 0) {
      const invalidTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error('Erreur d\'envoi:', resp.error);
          // Si le token est invalide, le marquer pour suppression
          if (
            resp.error?.code === 'messaging/invalid-registration-token' ||
            resp.error?.code === 'messaging/registration-token-not-registered'
          ) {
            invalidTokens.push(tokens[idx]);
          }
        }
      });

      // Supprimer les tokens invalides de Firestore
      if (invalidTokens.length > 0) {
        await cleanupInvalidTokens(userIds, invalidTokens, db);
      }
    }

    return NextResponse.json({
      success: true,
      sent: response.successCount,
      failed: response.failureCount,
      total: tokens.length,
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi des notifications:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi des notifications' },
      { status: 500 }
    );
  }
}

/**
 * Vérifier si une notification doit être envoyée selon les paramètres de l'utilisateur
 */
function shouldSendNotification(type: NotificationType, settings: any): boolean {
  if (!settings) return true; // Par défaut, tout est activé

  switch (type) {
    case 'new_assignment':
      return settings.newAssignment !== false;
    case 'mission_update':
      return settings.missionUpdate !== false;
    case 'mission_reminder':
      return settings.missionReminder !== false;
    case 'mission_cancellation':
      return settings.missionCancellation !== false;
    case 'category_message':
      return settings.categoryMessages !== false;
    case 'general_announcement':
      return settings.generalAnnouncements !== false;
    default:
      return true;
  }
}

/**
 * Nettoyer les tokens FCM invalides de Firestore
 */
async function cleanupInvalidTokens(
  userIds: string[],
  invalidTokens: string[],
  db: FirebaseFirestore.Firestore
) {
  try {
    for (const userId of userIds) {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        const currentTokens = userData?.fcmTokens || [];
        const validTokens = currentTokens.filter((t: string) => !invalidTokens.includes(t));
        
        if (validTokens.length !== currentTokens.length) {
          await userRef.update({ fcmTokens: validTokens });
          console.log(`Tokens invalides supprimés pour l'utilisateur ${userId}`);
        }
      }
    }
  } catch (error) {
    console.error('Erreur lors du nettoyage des tokens:', error);
  }
}











