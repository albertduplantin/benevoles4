require('dotenv').config({ path: '.env.local' });
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

async function updateUserPhone() {
  const userId = 'user_37YoNV46mZ5e9fDYVFWXvy3cR3Z';
  const phone = '06 25 41 25 48';

  try {
    console.log('Updating user phone number in Firestore...');
    console.log('User ID:', userId);
    console.log('Phone:', phone);

    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      phone: phone,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('✓ Phone number updated successfully!');

    // Verify the update
    const doc = await userRef.get();
    if (doc.exists) {
      console.log('✓ Verified: Document updated');
      console.log('\nUpdated user data:');
      console.log(JSON.stringify(doc.data(), null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error('Error updating phone:', error.message);
    process.exit(1);
  }
}

updateUserPhone();
