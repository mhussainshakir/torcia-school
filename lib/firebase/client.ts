/**
 * Firebase Client Initialization
 * 
 * Creates and exports Firebase instances for client-side use.
 * This file is used by all Firebase-related components.
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getDatabase, Database } from 'firebase/database';

/**
 * Firebase configuration object loaded from environment variables.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Create and export Firebase instances.
 * Use getApps() to prevent duplicate initialization in Next.js.
 */

// Initialize Firebase App
const app: FirebaseApp = !getApps().length 
  ? initializeApp(firebaseConfig) 
  : getApps()[0];

// Initialize Firebase Auth
const auth: Auth = getAuth(app);

// Initialize Firestore
const db: Firestore = getFirestore(app);

// Initialize Realtime Database
const database: Database = getDatabase(app);

// Export all instances
export { app, auth, db, database };

// Export types
export type { FirebaseApp, Auth, Firestore, Database };
