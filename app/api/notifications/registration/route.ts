import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebase/admin';
import { Resend } from 'resend';

export const runtime = 'nodejs';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * API pour notifier les responsables et admins lors d'une inscription à une mission
 * POST /api/notifications/registration
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      missionId,
      volunteerId,
      volunteerName,
    } = body;

    if (!missionId || !volunteerId || !volunteerName) {
      return NextResponse.json(
        { error: 'missionId, volunteerId et volunteerName sont requis' },
        { status: 400 }
      );
    }

    const db = admin.firestore();

    // Récupérer les informations de la mission
    const missionDoc = await db.collection('missions').doc(missionId).get();
    
    if (!missionDoc.exists) {
      return NextResponse.json(
        { error: 'Mission introuvable' },
        { status: 404 }
      );
    }

    const mission = missionDoc.data();
    const missionTitle = mission?.title || 'Mission sans titre';
    const missionCategory = mission?.category || '';

    // 1. Récupérer tous les admins
    const adminsSnapshot = await db.collection('users')
      .where('role', '==', 'admin')
      .get();

    const admins = adminsSnapshot.docs.map(doc => ({
      uid: doc.id,
      email: doc.data().email,
      firstName: doc.data().firstName,
    })).filter(u => u.email);

    // 2. Récupérer les responsables de la catégorie de la mission
    let responsibles: Array<{ uid: string; email: string; firstName: string }> = [];
    
    if (missionCategory) {
      // Trouver l'ID de la catégorie
      const categorySnapshot = await db.collection('missionCategories')
        .where('value', '==', missionCategory)
        .limit(1)
        .get();

      if (!categorySnapshot.empty) {
        const categoryId = categorySnapshot.docs[0].id;

        // Récupérer les responsables de cette catégorie
        const responsiblesSnapshot = await db.collection('categoryResponsibles')
          .where('categoryId', '==', categoryId)
          .get();

        // Récupérer les infos des responsables
        const responsibleIds = responsiblesSnapshot.docs.map(doc => doc.data().responsibleId);
        
        if (responsibleIds.length > 0) {
          const responsiblesUsersPromises = responsibleIds.map(id => 
            db.collection('users').doc(id).get()
          );
          const responsiblesUsersDocs = await Promise.all(responsiblesUsersPromises);
          
          responsibles = responsiblesUsersDocs
            .filter(doc => doc.exists)
            .map(doc => ({
              uid: doc.id,
              email: doc.data()!.email,
              firstName: doc.data()!.firstName,
            }))
            .filter(u => u.email);
        }
      }
    }

    // Combiner admins et responsables (sans doublons)
    const recipients = new Map<string, { uid: string; email: string; firstName: string }>();
    
    admins.forEach(admin => recipients.set(admin.uid, admin));
    responsibles.forEach(resp => recipients.set(resp.uid, resp));

    const recipientList = Array.from(recipients.values());

    if (recipientList.length === 0) {
      console.log('⚠️ Aucun destinataire trouvé pour les notifications');
      return NextResponse.json({
        success: true,
        message: 'Aucun destinataire à notifier',
        notified: 0,
      });
    }

    // 3. Créer les notifications dans Firestore
    const notificationPromises = recipientList.map(recipient =>
      db.collection('notifications').add({
        userId: recipient.uid,
        type: 'volunteer_registration',
        title: '🆕 Nouvelle inscription',
        message: `${volunteerName} s'est inscrit(e) à la mission "${missionTitle}"`,
        missionId: missionId,
        missionTitle: missionTitle,
        volunteerName: volunteerName,
        volunteerId: volunteerId,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    );

    await Promise.all(notificationPromises);

    // 4. Envoyer les emails si la clé API Resend est configurée
    let emailsSent = 0;

    if (process.env.RESEND_API_KEY) {
      const emailPromises = recipientList.map(recipient =>
        resend.emails.send({
          from: 'Festival Films Courts <onboarding@resend.dev>',
          to: recipient.email,
          subject: `🆕 Nouvelle inscription - ${missionTitle}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">🆕 Nouvelle inscription</h2>
              <p>Bonjour ${recipient.firstName},</p>
              <p><strong>${volunteerName}</strong> vient de s'inscrire à la mission :</p>
              <div style="background: #f3f4f6; padding: 16px; margin: 16px 0; border-radius: 8px; border-left: 4px solid #2563eb;">
                <h3 style="margin: 0 0 8px 0; color: #1f2937;">${missionTitle}</h3>
                ${missionCategory ? `<p style="margin: 4px 0; color: #4b5563;">📁 ${missionCategory}</p>` : ''}
              </div>
              <p>Places restantes : <strong>${mission?.maxVolunteers - mission?.volunteers.length} / ${mission?.maxVolunteers}</strong></p>
              <a href="https://benevoles3.vercel.app/dashboard/missions/${missionId}" 
                 style="display: inline-block; margin-top: 16px; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Voir la mission
              </a>
              <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
                Vous recevez cet email car vous êtes ${recipients.has(recipient.uid) && admins.some(a => a.uid === recipient.uid) ? 'administrateur' : 'responsable de catégorie'} sur la plateforme.
              </p>
            </div>
          `,
        })
      );

      const results = await Promise.allSettled(emailPromises);
      emailsSent = results.filter(r => r.status === 'fulfilled').length;
    } else {
      console.log('⚠️ RESEND_API_KEY non configurée - Emails non envoyés');
    }

    console.log(`✅ ${recipientList.length} notification(s) créée(s), ${emailsSent} email(s) envoyé(s)`);

    return NextResponse.json({
      success: true,
      notified: recipientList.length,
      emailsSent: emailsSent,
      recipients: recipientList.map(r => ({
        email: r.email,
        firstName: r.firstName,
      })),
    });

  } catch (error: any) {
    console.error('Erreur lors de l\'envoi des notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'envoi des notifications' },
      { status: 500 }
    );
  }
}



