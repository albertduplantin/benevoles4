// DEPRECATED: Firebase has been migrated to Clerk + Neon
// This file is kept for backward compatibility but Firebase is NO LONGER USED
// Legacy code that imports Firebase will compile but Firebase operations will fail at runtime

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Dummy config for build compatibility only
const firebaseConfig = {
  apiKey: 'AIzaSyDummy',
  authDomain: 'dummy.firebaseapp.com',
  projectId: 'dummy',
  storageBucket: 'dummy.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:dummy',
};

// Initialize with dummy config for build compatibility
// This allows legacy code to import but Firebase won't actually work
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (typeof window === 'undefined') {
  // Server-side: create dummy app for build
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} else {
  // Client-side: only init if explicitly enabled
  if (process.env.NEXT_PUBLIC_ENABLE_FIREBASE === 'true') {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    console.warn('⚠️ Firebase enabled - should be migrated to Clerk + Neon');
  } else {
    // Create dummy app to prevent errors
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  }
}

export { app, auth, db, storage };

