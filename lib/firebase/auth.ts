/**
 * Firebase Authentication Service
 * 
 * Handles all authentication operations including:
 * - Google Sign-In
 * - Email/Password Sign-In
 * - User Registration
 * - Session Management
 * - Sign Out
 */

import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  UserCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

/**
 * Google Auth Provider instance
 */
const googleProvider = new GoogleAuthProvider();

/**
 * Signs in user with Google account.
 * Creates or updates user profile in Firestore.
 * 
 * @returns Promise with UserCredential
 * @throws FirebaseAuthError if sign-in fails
 */
export async function signInWithGoogle(): Promise<UserCredential> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    
    // Get or create user profile in Firestore
    await createOrUpdateUserProfile(result.user);
    
    return result;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

/**
 * Signs in user with email and password.
 * 
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise with UserCredential
 * @throws FirebaseAuthError if sign-in fails
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result;
  } catch (error) {
    console.error('Email Sign-In Error:', error);
    throw error;
  }
}

/**
 * Registers a new user with email and password.
 * Creates user profile in Firestore with role 'student'.
 * 
 * @param email - User's email address
 * @param password - User's password
 * @param fullName - User's display name
 * @param googleDriveLink - Optional Google Drive folder link
 * @returns Promise with UserCredential
 * @throws FirebaseAuthError if registration fails
 */
export async function registerWithEmail(
  email: string,
  password: string,
  fullName: string,
  googleDriveLink?: string
): Promise<UserCredential> {
  try {
    // Create user in Firebase Auth
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update display name
    await updateProfile(result.user, {
      displayName: fullName,
    });
    
    // Create user profile in Firestore
    await createUserProfile(result.user, {
      fullName,
      googleDriveLink,
      role: 'student', // Default role for new registrations
    });
    
    return result;
  } catch (error) {
    console.error('Registration Error:', error);
    throw error;
  }
}

/**
 * Creates or updates user profile in Firestore.
 * Called after successful Google sign-in.
 * 
 * @param user - Firebase User object
 */
async function createOrUpdateUserProfile(user: User): Promise<void> {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  
  const userData = {
    email: user.email,
    fullName: user.displayName || user.email?.split('@')[0],
    avatarUrl: user.photoURL,
    updatedAt: serverTimestamp(),
  };
  
  if (!userSnap.exists()) {
    // New user - create profile
    await setDoc(userRef, {
      ...userData,
      role: 'student', // Default role
      googleDriveLink: null,
      classes: [],
      createdAt: serverTimestamp(),
    });
  } else {
    // Existing user - update profile
    await setDoc(userRef, userData, { merge: true });
  }
}

/**
 * Creates initial user profile in Firestore.
 * Called during email/password registration.
 * 
 * @param user - Firebase User object
 * @param data - Additional user data
 */
async function createUserProfile(
  user: User,
  data: {
    fullName: string;
    googleDriveLink?: string;
    role: 'admin' | 'teacher' | 'student';
  }
): Promise<void> {
  const userRef = doc(db, 'users', user.uid);
  
  await setDoc(userRef, {
    email: user.email,
    fullName: data.fullName,
    avatarUrl: user.photoURL || null,
    role: data.role,
    googleDriveLink: data.googleDriveLink || null,
    classes: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Signs out the current user.
 * 
 * @returns Promise<void>
 */
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign Out Error:', error);
    throw error;
  }
}

/**
 * Gets the current authenticated user.
 * Returns null if no user is signed in.
 * 
 * @returns Current User or null
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Sets up an authentication state observer.
 * Calls the callback whenever the auth state changes.
 * 
 * @param callback - Function to call when auth state changes
 * @returns Unsubscribe function
 */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Updates user profile in Firestore.
 * 
 * @param userId - User ID
 * @param data - Profile data to update
 */
export async function updateUserProfile(
  userId: string,
  data: {
    fullName?: string;
    googleDriveLink?: string;
    role?: 'admin' | 'teacher' | 'student';
    classes?: string[];
  }
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * Gets user profile from Firestore.
 * 
 * @param userId - User ID
 * @returns User profile data or null
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    return { id: userSnap.id, ...userSnap.data() } as UserProfile;
  }
  
  return null;
}

/**
 * User profile interface
 */
export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: 'admin' | 'teacher' | 'student';
  googleDriveLink?: string;
  classes: string[];
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Admin profile interface
 */
export interface AdminProfile {
  email: string;
  userId: string;
  createdAt?: any;
}
