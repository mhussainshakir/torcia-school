/**
 * Firebase Configuration for Academy Connect
 * 
 * This file initializes Firebase with the user's project credentials.
 * Replace the placeholder values with your actual Firebase config.
 */

'use client';

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
  apiKey: "AIzaSyDT5aELfRP0kogEz18JJwAmgjvZ0woUnms",
  authDomain: "torcia-f18a8.firebaseapp.com",
  databaseURL: "https://torcia-f18a8-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "torcia-f18a8",
  storageBucket: "torcia-f18a8.firebasestorage.app",
  messagingSenderId: "1003108700898",
  appId: "1:1003108700898:web:1feaafbcfb482dacfec4bb",
  measurementId: "G-FBHD1TQH6P",
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
try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  // Initialize Firebase services
  auth = getAuth(app);
  db = getFirestore(app);
  database = getDatabase(app);
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Continue with uninitialized services for development
  // In production, this should be properly configured
}

// Export all Firebase services for use throughout the app
export { app, auth, db, database };

// Export types for TypeScript
export type { FirebaseApp, Auth, Firestore, Database };
