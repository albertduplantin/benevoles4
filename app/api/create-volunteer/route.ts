import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { generatePersonalToken } from '@/lib/utils/token';

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Vérifier que l'utilisateur est admin
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      );
    }

    // Récupérer les données de la requête
    const body = await request.json();
    const { email, firstName, lastName, phone, emailOnly } = body;

    // Validation
    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants' },
        { status: 400 }
      );
    }

    // Vérifier si l'email existe déjà
    try {
      await adminAuth.getUserByEmail(email);
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe déjà' },
        { status: 400 }
      );
    } catch (error: any) {
      // L'utilisateur n'existe pas, c'est OK
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Générer un mot de passe temporaire
    const temporaryPassword = generateTemporaryPassword();

    // Créer l'utilisateur dans Firebase Auth (SANS le connecter)
    const userRecord = await adminAuth.createUser({
      email,
      password: temporaryPassword,
      emailVerified: false,
    });

    // Préparer les données utilisateur pour Firestore
    const firestoreData: any = {
      email,
      firstName,
      lastName,
      phone: phone || '',
      role: 'volunteer',
      createdAt: new Date(),
      updatedAt: new Date(),
      consents: {
        dataProcessing: true,
        communications: true,
        consentDate: new Date(),
      },
      notificationPreferences: {
        email: true,
        sms: false,
      },
    };

    // Si mode email-only, générer un token
    let personalToken: string | undefined;
    if (emailOnly) {
      personalToken = generatePersonalToken();
      firestoreData.emailOnly = true;
      firestoreData.personalToken = personalToken;
    }

    // Créer le document dans Firestore
    await adminDb.collection('users').doc(userRecord.uid).set(firestoreData);

    return NextResponse.json({
      success: true,
      userId: userRecord.uid,
      token: personalToken,
      temporaryPassword: emailOnly ? undefined : temporaryPassword,
    });

  } catch (error: any) {
    console.error('Error creating volunteer:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du bénévole' },
      { status: 500 }
    );
  }
}

/**
 * Générer un mot de passe temporaire aléatoire
 */
function generateTemporaryPassword(): string {
  const length = 12;
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%&*';
  const allChars = uppercase + lowercase + numbers + symbols;
  
  let password = '';
  
  // Assurer au moins un caractère de chaque type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Remplir le reste
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Mélanger les caractères
  return password.split('').sort(() => Math.random() - 0.5).join('');
}


















