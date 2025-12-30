const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
}

const db = admin.firestore();

async function syncClerkUser() {
  // User data from Clerk registration
  const clerkUserId = 'user_2sSY3RKfE7vU6pF7k7nLwx8GXhZ'; // You'll need to get this from Clerk
  const userData = {
    uid: clerkUserId,
    email: 'topinambour124@gmail.com',
    firstName: 'Jérôme',
    lastName: 'HEULARD-FAROUELLE',
    phone: '06 25 41 25 48',
    role: 'volunteer',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  try {
    console.log('Creating user document in Firestore...');
    console.log('User ID:', clerkUserId);
    console.log('Email:', userData.email);

    const userRef = db.collection('users').doc(clerkUserId);
    await userRef.set(userData, { merge: true });

    console.log('✓ User document created successfully!');

    // Verify the document was created
    const doc = await userRef.get();
    if (doc.exists) {
      console.log('✓ Verified: Document exists in Firestore');
      console.log('Document data:', doc.data());
    } else {
      console.error('✗ Error: Document not found after creation');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error creating user document:', error);
    process.exit(1);
  }
}

syncClerkUser();
