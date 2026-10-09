// backend/create-admin.js
// Phase 6 Helper Script — Seed or promote an admin account in Firebase

const { db, auth } = require('./config/firebase');
require('dotenv').config();

const args = process.argv.slice(2);
const email = args[0] || 'admin@smartride.com';
const password = args[1] || 'admin123';
const name = args[2] || 'System Admin';
const phone = args[3] || '9999999999';

async function setupAdmin() {
  console.log(`🚀 Starting admin creation for email: ${email}...`);

  try {
    let userRecord;
    try {
      // 1. Check if user already exists in Firebase Auth
      userRecord = await auth.getUserByEmail(email);
      console.log(`ℹ️  User already exists in Firebase Auth with UID: ${userRecord.uid}`);
    } catch (authError) {
      if (authError.code === 'auth/user-not-found') {
        // Create user in Firebase Auth
        userRecord = await auth.createUser({
          email,
          password,
          displayName: name,
          phoneNumber: phone.startsWith('+') ? phone : `+91${phone}`, // Firebase phone must be format +12345
        });
        console.log(`✔ User created in Firebase Auth with UID: ${userRecord.uid}`);
      } else {
        throw authError;
      }
    }

    // 2. Set role: "admin" profile document in Firestore
    const userRef = db.collection('users').doc(userRecord.uid);
    const userData = {
      uid: userRecord.uid,
      email,
      name,
      phone,
      role: 'admin',
      profilePic: '',
      isActive: true,
      totalRides: 0,
      rating: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await userRef.set(userData, { merge: true });
    console.log(`✔ Firestore document set with role "admin"!`);
    console.log(`\n🎉 Success! You can now log in using these credentials:`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`👤 Role: admin\n`);
  } catch (err) {
    console.error('❌ Failed to create admin account:', err.message);
  }
}

setupAdmin();
