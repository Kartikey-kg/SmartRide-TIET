// backend/config/firebase.js
// Firebase Admin SDK — using modular API (firebase-admin v11+)

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// Only initialize if not already done (prevents duplicate app error)
if (getApps().length === 0) {

  let credential;

  // ── Option A: Use serviceAccountKey.json file (recommended)
  try {
    const serviceAccount = require('./serviceAccountKey.json');
    credential = cert(serviceAccount);
    console.log('🔑 Using serviceAccountKey.json');
  } catch (err) {
    // ── Option B: Use environment variables from .env
    console.warn('⚠️  serviceAccountKey.json not found. Using .env variables instead.');

    credential = cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    });
  }

  initializeApp({ credential });
  console.log('🔥 Firebase Admin SDK initialized!');
}

// Export Firestore and Auth instances
const db   = getFirestore();
const auth = getAuth();

module.exports = { db, auth };
