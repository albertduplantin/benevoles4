import * as admin from 'firebase-admin';

/**
 * Initialize Firebase Admin SDK for server-side operations
 * Used in API Routes and Server Components
 */
function initializeAdmin() {
  if (admin.apps.length) {
    return;
  }

  // Essayer d'abord la variable JSON complète (recommandé pour Vercel)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error) {
      console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', error);
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY format');
    }
  } else if (
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    process.env.FIREBASE_ADMIN_PRIVATE_KEY
  ) {
    // Fallback sur les variables séparées (pour compatibilité)
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(
      /\\n/g,
      '\n'
    );

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
  } else {
    // En mode build, les variables ne sont pas disponibles
    // On ne fait rien, l'initialisation se fera au runtime
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Firebase Admin credentials are required in production');
    }
  }
}

// Initialiser au chargement du module si possible
if (typeof window === 'undefined') {
  try {
    initializeAdmin();
  } catch (error) {
    // Silently fail during build time
    console.warn('Firebase Admin initialization deferred:', (error as Error).message);
  }
}

// Lazy getters pour s'assurer que admin est initialisé
let _adminAuth: admin.auth.Auth | null = null;
let _adminDb: admin.firestore.Firestore | null = null;
let _adminStorage: admin.storage.Storage | null = null;

export const getAdminAuth = () => {
  initializeAdmin();
  if (!_adminAuth) {
    _adminAuth = admin.auth();
  }
  return _adminAuth;
};

export const getAdminDb = () => {
  initializeAdmin();
  if (!_adminDb) {
    _adminDb = admin.firestore();
  }
  return _adminDb;
};

export const getAdminStorage = () => {
  initializeAdmin();
  if (!_adminStorage) {
    _adminStorage = admin.storage();
  }
  return _adminStorage;
};

// Pour compatibilité avec l'ancien code
export const adminAuth = new Proxy({} as admin.auth.Auth, {
  get(target, prop) {
    return getAdminAuth()[prop as keyof admin.auth.Auth];
  }
});

export const adminDb = new Proxy({} as admin.firestore.Firestore, {
  get(target, prop) {
    return getAdminDb()[prop as keyof admin.firestore.Firestore];
  }
});

export const adminStorage = new Proxy({} as admin.storage.Storage, {
  get(target, prop) {
    return getAdminStorage()[prop as keyof admin.storage.Storage];
  }
});

export const FieldValue = admin.firestore.FieldValue;

export default admin;

