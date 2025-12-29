import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebase/admin';
import { NotificationPayload } from '@/types';

/**
 * API pour envoyer des notifications broadcast
 * POST /api/notifications/broadcast
 * 
 * Options:
 * - all: tous les utilisateurs
 * - role: par rôle (volunteer, category_responsible, admin)
 * - category: responsables d'une catégorie spécifique
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      target,
      targetValue,
      payload,
    }: {
      target: 'all' | 'role' | 'category';
      targetValue?: string;
      payload: NotificationPayload;
    } = body;

    if (!target || !payload || !payload.title || !payload.body) {
      return NextResponse.json(
        { error: 'target, payload.title et payload.body sont requis' },
        { status: 400 }
      );
    }

    const db = admin.firestore();
    let usersQuery = db.collection('users');

    // Filtrer selon la cible
    switch (target) {
      case 'role':
        if (!targetValue) {
          return NextResponse.json({ error: 'targetValue (role) requis' }, { status: 400 });
        }
        usersQuery = usersQuery.where('role', '==', targetValue) as any;
        break;

      case 'category':
        if (!targetValue) {
          return NextResponse.json({ error: 'targetValue (categoryId) requis' }, { status: 400 });
        }
        usersQuery = usersQuery.where('responsibleForCategories', 'array-contains', targetValue) as any;
        break;

      case 'all':
        // Pas de filtre
        break;

      default:
        return NextResponse.json({ error: 'target invalide' }, { status: 400 });
    }

    // Récupérer tous les utilisateurs correspondants
    const usersSnapshot = await usersQuery.get();
    const tokens: string[] = [];
    
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      
      // Vérifier les paramètres de notification
      const notifSettings = userData?.notificationSettings;
      if (notifSettings && !notifSettings.pushEnabled) {
        return;
      }
      
      // Pour les annonces générales, vérifier le paramètre spécifique
      if (payload.type === 'general_announcement' && notifSettings?.generalAnnouncements === false) {
        return;
      }
      
      const userTokens = userData?.fcmTokens || [];
      tokens.push(...userTokens);
    });

    if (tokens.length === 0) {
      return NextResponse.json(
        {
          message: 'Aucun token FCM trouvé pour cette cible',
          sent: 0,
          targetUsers: usersSnapshot.size,
        },
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

    // Envoyer les notifications par lots de 500 (limite FCM)
    const BATCH_SIZE = 500;
    let totalSuccess = 0;
    let totalFailure = 0;

    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
      const batchTokens = tokens.slice(i, i + BATCH_SIZE);
      const batchMessage = { ...message, tokens: batchTokens };
      
      const response = await admin.messaging().sendEachForMulticast(batchMessage);
      totalSuccess += response.successCount;
      totalFailure += response.failureCount;
      
      console.log(`Lot ${i / BATCH_SIZE + 1}: ${response.successCount}/${batchTokens.length} envoyées`);
    }

    console.log(`Total notifications envoyées: ${totalSuccess}/${tokens.length}`);

    return NextResponse.json({
      success: true,
      sent: totalSuccess,
      failed: totalFailure,
      total: tokens.length,
      targetUsers: usersSnapshot.size,
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi du broadcast:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du broadcast' },
      { status: 500 }
    );
  }
}











