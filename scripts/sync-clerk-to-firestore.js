require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const https = require('https');

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

// Function to make Clerk API request
function clerkApiRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.clerk.com',
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Clerk API error: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function syncClerkUsersToFirestore() {
  try {
    console.log('Fetching users from Clerk...');

    // Get all users from Clerk
    const users = await clerkApiRequest('/v1/users?email_address=topinambour124@gmail.com');

    console.log(`Found ${users.length || 0} user(s)`);

    if (!users || users.length === 0) {
      console.log('No users found with email topinambour124@gmail.com');
      return;
    }

    // Process the user
    const clerkUser = users[0];
    console.log('\nUser from Clerk:');
    console.log('- ID:', clerkUser.id);
    console.log('- Email:', clerkUser.email_addresses?.[0]?.email_address);
    console.log('- First Name:', clerkUser.first_name);
    console.log('- Last Name:', clerkUser.last_name);
    console.log('- Phone:', clerkUser.phone_numbers?.[0]?.phone_number);

    // Prepare user data for Firestore
    const userData = {
      uid: clerkUser.id,
      email: clerkUser.email_addresses?.[0]?.email_address || '',
      firstName: clerkUser.first_name || '',
      lastName: clerkUser.last_name || '',
      phone: clerkUser.phone_numbers?.[0]?.phone_number || '',
      role: 'volunteer',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    console.log('\nCreating/updating user document in Firestore...');
    const userRef = db.collection('users').doc(clerkUser.id);
    await userRef.set(userData, { merge: true });

    console.log('✓ User document created/updated successfully!');

    // Verify the document was created
    const doc = await userRef.get();
    if (doc.exists) {
      console.log('✓ Verified: Document exists in Firestore');
      console.log('\nFirestore document data:');
      console.log(JSON.stringify(doc.data(), null, 2));
    } else {
      console.error('✗ Error: Document not found after creation');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

syncClerkUsersToFirestore();
