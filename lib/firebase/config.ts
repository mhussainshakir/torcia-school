/**
 * Firebase Configuration for Academy Connect
 * 
 * This file initializes Firebase with the user's project credentials.
 * Replace the placeholder values with your actual Firebase config.
 */

// Firebase SDK imports
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getDatabase, Database } from 'firebase/database';

/**
 * Firebase configuration object.
 * These values are loaded from environment variables.
 * 
 * @see https://firebase.google.com/docs/web/setup#config-object
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

/**
 * Initialize Firebase App
 * Checks if Firebase is already initialized to avoid duplicate initialization
 * in Next.js hot reloading scenarios.
 * 
 * @returns FirebaseApp instance
 */
let app: FirebaseApp;

/**
 * Initialize Firebase Auth
 * @returns Auth instance
 */
let auth: Auth;

/**
 * Initialize Firestore
 * @returns Firestore instance
 */
let db: Firestore;

/**
 * Initialize Realtime Database
 * @returns Database instance
 */
let database: Database;

// Initialize Firebase only once
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase services
auth = getAuth(app);
db = getFirestore(app);
database = getDatabase(app);

// Export all Firebase services for use throughout the app
export { app, auth, db, database };

// Export types for TypeScript
export type { FirebaseApp, Auth, Firestore, Database };
