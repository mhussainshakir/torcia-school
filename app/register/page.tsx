/**
 * Registration Page
 * 
 * Firebase authentication registration page.
 * Students register with their Google account and provide Google Drive link.
 */

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/firebase';
import { GoogleSignInButton } from '@/components/auth/firebase/auth-buttons';
import { GraduationCap, Mail, Lock, Eye, EyeOff, Loader2, FolderOpen, AlertCircle, CheckCircle, Key, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function RegisterPage() {
  const router = useRouter();
  const { auth } = createClient();
  
  const [step, setStep] = useState<'google' | 'details'>('google');
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [googleDriveApiKey, setGoogleDriveApiKey] = useState('');
  const [skipApiKey, setSkipApiKey] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const { onAuthStateChanged } = require('firebase/auth');
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: any) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setEmail(firebaseUser.email || '');
        setFullName(firebaseUser.displayName || '');
      }
    });
    
    return () => unsubscribe();
  }, [auth]);

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
      
      // Create user
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with name
      await updateProfile(result.user, { displayName: fullName });
      
      // Create user profile in Firestore
      await createUserProfile(result.user.uid, {
        email,
        fullName,
        role: 'student',
        googleDriveApiKey: googleDriveApiKey || null,
        hasDriveApiKey: !!googleDriveApiKey,
      });
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Registration Error:', err);
      
      // Handle specific errors
      const errorMessages: Record<string, string> = {
        'auth/email-already-in-use': 'This email is already registered',
        'auth/invalid-email': 'Invalid email address',
        'auth/weak-password': 'Password should be at least 6 characters',
        'auth/operation-not-allowed': 'Email/password sign-in is not enabled',
      };
      
      setError(errorMessages[err.code] || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
      
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      
      // Move to details step
      setUser(result.user);
      setEmail(result.user.email || '');
      setFullName(result.user.displayName || '');
      setStep('details');
    } catch (err: any) {
      console.error('Google Registration Error:', err);
      
      const errorMessages: Record<string, string> = {
        'auth/popup-closed-by-user': 'Registration was cancelled',
        'auth/network-request-failed': 'Network error. Please check your connection',
        'auth/unauthorized-domain': 'This domain is not authorized for sign-in',
      };
      
      setError(errorMessages[err.code] || 'Failed to register with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleComplete = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError('');

    try {
      // Create user profile in Firestore
      await createUserProfile(user.uid, {
        email: user.email,
        fullName: fullName || user.displayName,
        role: 'student',
        googleDriveApiKey: googleDriveApiKey || null,
        hasDriveApiKey: !!googleDriveApiKey,
      });
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Profile Creation Error:', err);
      setError('Account created but profile setup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Creates user profile in Firestore
   */
  const createUserProfile = async (userId: string, data: any) => {
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
    const { db } = createClient();
    
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      email: data.email,
      fullName: data.fullName,
      avatarUrl: data.avatarUrl || null,
      role: data.role || 'student',
      googleDriveApiKey: data.googleDriveApiKey || null,
      hasDriveApiKey: data.hasDriveApiKey || false,
      classes: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  // Google Sign-In Step
  if (step === 'google') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-4">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Join Torcia</h1>
            <p className="mt-2 text-muted-foreground">
              Create your student account
            </p>
          </div>

          {/* Registration Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6">
            
            {/* Google Sign-In */}
            <Button
              onClick={handleGoogleRegister}
              disabled={isLoading}
              className="w-full"
              size="lg"
              variant="outline"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-muted-foreground">
                  Or register with email
                </span>
              </div>
            </div>

            {/* Email Registration Link */}
            <div className="text-center">
              <p className="text-muted-foreground">
                Prefer email registration?{' '}
                <button 
                  onClick={() => setStep('details')}
                  className="text-primary hover:underline font-medium"
                >
                  Click here
                </button>
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-8 text-center">
            <Link 
              href="/" 
              className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Details Step (for both Google and Email registration)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-4">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">
            {user ? 'Almost Done!' : 'Create Account'}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {user ? 'Complete your profile details' : 'Enter your information'}
          </p>
        </div>

        {/* Details Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6">
          
          {/* User Info (if Google registered) */}
          {user && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              {user.photoURL && (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'User'}
                  className="h-10 w-10 rounded-full"
                />
              )}
              <div>
                <p className="font-medium">{user.displayName || 'User'}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <CheckCircle className="ml-auto h-5 w-5 text-green-500" />
            </div>
          )}

          <form onSubmit={user ? (e) => { e.preventDefault(); handleGoogleComplete(); } : handleEmailRegister} className="space-y-4">
            
            {/* Full Name */}
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium">
                Full Name
              </label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {/* Email (only for email registration) */}
            {!user && (
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* Password (only for email registration) */}
            {!user && (
              <>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password (min 6 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                      minLength={6}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Google Drive API Key */}
            <div className="space-y-2">
              <label htmlFor="driveApiKey" className="text-sm font-medium">
                Google Drive API Key
                <span className="text-muted-foreground font-normal ml-1">(Optional - Skip for now)</span>
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="driveApiKey"
                  type="text"
                  placeholder="AIzaSyXXXXXXXXXXXXXXXXXXXXX"
                  value={googleDriveApiKey}
                  onChange={(e) => setGoogleDriveApiKey(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  <p className="font-medium">Why this is needed:</p>
                  <p>Your Google Drive API key allows the app to save your PDFs, images, and videos to your Google Drive (15GB FREE).</p>
                  <button 
                    type="button"
                    onClick={() => setSkipApiKey(true)}
                    className="mt-2 text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Skip for now - I'll add it later →
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {user ? 'Completing Registration...' : 'Creating Account...'}
                </>
              ) : (
                user ? 'Complete Registration' : 'Create Account'
              )}
            </Button>
          </form>

          {/* Back Button */}
          {user && (
            <button
              onClick={() => setStep('google')}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              ← Use different Google account
            </button>
          )}
        </div>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
