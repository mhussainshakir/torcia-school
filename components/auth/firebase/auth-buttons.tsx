/**
 * Firebase Authentication Button Component
 * 
 * Handles Google Sign-In using Firebase Auth.
 * Used in login and registration pages.
 */

"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

/**
 * Google Sign-In Button
 * 
 * @param onSuccess - Callback when sign-in succeeds
 * @param redirectTo - Route to redirect to after sign-in (default: '/dashboard')
 */
export function GoogleSignInButton({ 
  onSuccess,
  redirectTo = '/dashboard'
}: { 
  onSuccess?: () => void;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { auth } = createClient();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
      
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      
      // Get or create user profile
      await createUserProfile(result.user);
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(redirectTo);
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      
      // Handle specific errors
      const errorMessages: Record<string, string> = {
        'auth/popup-closed-by-user': 'Sign-in was cancelled',
        'auth/network-request-failed': 'Network error. Please check your connection',
        'auth/too-many-requests': 'Too many attempts. Please try again later',
        'auth/unauthorized-domain': 'This domain is not authorized for sign-in',
      };
      
      setError(errorMessages[err.code] || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="w-full"
        size="lg"
        variant="outline"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </>
        )}
      </Button>
      
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
    </div>
  );
}

/**
 * Email/Password Sign-In Button
 * 
 * @param email - User email
 * @param password - User password
 * @param onSuccess - Callback when sign-in succeeds
 * @param isLoading - Loading state
 */
export function EmailSignInButton({ 
  email, 
  password, 
  onSuccess,
  isLoading 
}: { 
  email: string;
  password: string;
  onSuccess?: () => void;
  isLoading?: boolean;
}) {
  const router = useRouter();
  const { auth } = createClient();

  const handleEmailSignIn = async () => {
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      
      await signInWithEmailAndPassword(auth, email, password);
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Email Sign-In Error:', err);
      throw err;
    }
  };

  return (
    <Button
      onClick={handleEmailSignIn}
      disabled={isLoading || !email || !password}
      className="w-full"
      size="lg"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing in...
        </>
      ) : (
        'Sign In'
      )}
    </Button>
  );
}

/**
 * Sign Out Button
 * Used in sidebar/navigation
 */
export function SignOutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { auth } = createClient();

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      const { signOut: firebaseSignOut } = await import('firebase/auth');
      await firebaseSignOut(auth);
      router.push('/');
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleSignOut}
      disabled={isLoading}
      className="w-full justify-start"
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      )}
      Sign Out
    </Button>
  );
}
