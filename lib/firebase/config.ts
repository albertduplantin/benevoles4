import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  // Utiliser le domaine Firebase pour l'authentification (nécessaire pour /__/auth/handler)
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (typeof window !== 'undefined') {
  // Client-side initialization
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  // Enable offline persistence for Firestore with improved error handling
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    // Use dynamic import to avoid bundling issues
    import('firebase/firestore').then(({ enableIndexedDbPersistence, enableMultiTabIndexedDbPersistence }) => {
      // Utiliser enableMultiTabIndexedDbPersistence pour supporter plusieurs onglets
      enableMultiTabIndexedDbPersistence(db)
        .then(() => {
          console.log('✅ Firestore persistence enabled (multi-tab)');
        })
        .catch((err) => {
          if (err.code === 'failed-precondition') {
            // Multiple tabs open, persistence can only be enabled in one tab at a time
            console.warn(
              '⚠️ Firestore persistence: Multiple tabs detected. Using network-only mode for this tab.'
            );
          } else if (err.code === 'unimplemented') {
            // Browser doesn't support all required features
            console.warn(
              '⚠️ Firestore persistence: Browser does not support offline persistence. Using network-only mode.'
            );
          } else {
            // Other errors (e.g., IndexedDB issues)
            console.warn(
              '⚠️ Firestore persistence error:',
              err.message || err.code || 'Unknown error'
            );
          }
          // Application will continue to work without persistence
        });
    }).catch((err) => {
      // Handle import errors
      console.warn('⚠️ Failed to load Firestore persistence module:', err);
    });
  }
}

export { app, auth, db, storage };

