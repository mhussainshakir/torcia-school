/**
 * Admin Setup Page - One-Time Admin Creation
 * 
 * This page is hidden and protected. It allows creating the first admin(s)
 * when no admin exists in the system. After 5 admins are created, the
 * page shows a message that setup is complete.
 * 
 * URL: /setup-admin (hidden page)
 * Security: Protected by auth check and admin count
 */

"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, Users, CheckCircle, AlertCircle, Loader2, GraduationCap } from 'lucide-react';

export default function AdminSetupPage() {
  const router = useRouter();
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [adminCount, setAdminCount] = useState(0);
  const [setupComplete, setSetupComplete] = useState(false);
  const [makingAdmin, setMakingAdmin] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Firebase instances
  const { auth, db } = createClient();

  useEffect(() => {
    checkSetupStatus();
  }, []);

  /**
   * Checks if setup is complete or if admin creation is allowed.
   */
  const checkSetupStatus = async () => {
    try {
      // Check Firebase Auth state
      const { onAuthStateChanged } = await import('firebase/auth');
      
      onAuthStateChanged(auth, async (firebaseUser) => {
        setUser(firebaseUser);
        
        // Check admin count
        const adminsRef = collection(db, 'admins');
        const adminsSnap = await getDocs(adminsRef);
        const count = adminsSnap.size;
        
        setAdminCount(count);
        
        if (count >= 5) {
          setSetupComplete(true);
        }
        
        setCheckingSetup(false);
        setLoading(false);
      });
    } catch (err) {
      console.error('Setup check error:', err);
      setError('Failed to check setup status');
      setCheckingSetup(false);
      setLoading(false);
    }
  };

  /**
   * Makes the current user an admin.
   */
  const handleMakeAdmin = async () => {
    if (!user) return;
    
    if (adminCount >= 5) {
      setError('Maximum 5 admins allowed');
      return;
    }
    
    setMakingAdmin(true);
    setError('');
    setSuccess('');
    
    try {
      // Create admin document
      const adminRef = doc(db, 'admins', user.uid);
      await setDoc(adminRef, {
        userId: user.uid,
        email: user.email,
        createdAt: new Date().toISOString(),
      });
      
      // Update user role
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        email: user.email,
        fullName: user.displayName || user.email?.split('@')[0] || 'Admin',
        avatarUrl: user.photoURL,
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      
      setSuccess('You are now an admin! Redirecting to dashboard...');
      
      // Redirect to admin dashboard
      setTimeout(() => {
        router.push('/admin');
      }, 2000);
      
    } catch (err: any) {
      console.error('Make admin error:', err);
      setError(err.message || 'Failed to create admin');
    } finally {
      setMakingAdmin(false);
    }
  };

  /**
   * Creates admin using email/password.
   */
  const handleEmailAdmin = async (email: string, password: string, name: string) => {
    setMakingAdmin(true);
    setError('');
    setSuccess('');
    
    try {
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
      
      // Create user
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = result.user;
      
      // Update profile
      await updateProfile(newUser, { displayName: name });
      
      // Create admin document
      const adminRef = doc(db, 'admins', newUser.uid);
      await setDoc(adminRef, {
        userId: newUser.uid,
        email: newUser.email,
        createdAt: new Date().toISOString(),
      });
      
      // Create user profile
      const userRef = doc(db, 'users', newUser.uid);
      await setDoc(userRef, {
        email: newUser.email,
        fullName: name,
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      setSuccess('Admin created successfully!');
      setAdminCount(prev => prev + 1);
      
      // Clear form (handled by re-render)
      
    } catch (err: any) {
      console.error('Email admin error:', err);
      
      // Handle specific Firebase errors
      const errorMessages: Record<string, string> = {
        'auth/email-already-in-use': 'This email is already registered',
        'auth/invalid-email': 'Invalid email address',
        'auth/weak-password': 'Password should be at least 6 characters',
        'auth/operation-not-allowed': 'Email/password sign-in is not enabled',
      };
      
      setError(errorMessages[err.code] || err.message || 'Failed to create admin');
    } finally {
      setMakingAdmin(false);
    }
  };

  if (loading || checkingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Checking setup status...</p>
        </div>
      </div>
    );
  }

  if (setupComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">Setup Complete</CardTitle>
            <CardDescription>
              All 5 admin accounts have been created. The setup page is now disabled.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/login')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
            <GraduationCap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold">Torcia School & Academic System</h1>
          <p className="text-muted-foreground mt-2">Admin Setup - One Time Only</p>
        </div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-primary" />
                Admin Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{adminCount}/5</div>
              <p className="text-sm text-muted-foreground">Admins created</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-green-600" />
                Remaining
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{5 - adminCount}</div>
              <p className="text-sm text-muted-foreground">Slots available</p>
            </CardContent>
          </Card>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-green-700 dark:text-green-300">{success}</p>
          </div>
        )}

        {/* Admin Creation Options */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Option 1: Current User */}
          {user ? (
            <Card>
              <CardHeader>
                <CardTitle>Create Admin (Current User)</CardTitle>
                <CardDescription>
                  Make yourself an admin using your current Google account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-muted">
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
                </div>
                <Button 
                  onClick={handleMakeAdmin} 
                  disabled={makingAdmin}
                  className="w-full"
                >
                  {makingAdmin ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Admin...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Make Me Admin
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Sign In Required</CardTitle>
                <CardDescription>
                  Sign in with Google to create an admin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GoogleSignInCard onSignIn={setUser} />
              </CardContent>
            </Card>
          )}

          {/* Option 2: Email/Password */}
          <Card>
            <CardHeader>
              <CardTitle>Create with Email</CardTitle>
              <CardDescription>
                Create a new admin using email and password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const name = (form.elements.namedItem('name') as HTMLInputElement).value;
                  const email = (form.elements.namedItem('email') as HTMLInputElement).value;
                  const password = (form.elements.namedItem('password') as HTMLInputElement).value;
                  handleEmailAdmin(email, password, name);
                }}
                className="space-y-4"
              >
                <div>
                  <Input 
                    name="name"
                    placeholder="Full Name" 
                    required 
                    disabled={makingAdmin}
                  />
                </div>
                <div>
                  <Input 
                    name="email"
                    type="email" 
                    placeholder="Email Address" 
                    required 
                    disabled={makingAdmin}
                  />
                </div>
                <div>
                  <Input 
                    name="password"
                    type="password" 
                    placeholder="Password (min 6 characters)" 
                    required 
                    minLength={6}
                    disabled={makingAdmin}
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={makingAdmin}
                  className="w-full"
                >
                  {makingAdmin ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Admin...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Create Admin Account
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Security Notice */}
        <div className="mt-8 p-4 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
          <h3 className="font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Important Security Notice
          </h3>
          <ul className="mt-2 text-sm text-amber-700 dark:text-amber-300 space-y-1">
            <li>• Maximum 5 admin accounts are allowed</li>
            <li>• After creating admins, consider deleting this page</li>
            <li>• Keep your admin credentials secure</li>
            <li>• Only share this URL with trusted administrators</li>
          </ul>
        </div>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/login')}
          >
            ← Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Google Sign-In Component for Admin Setup
 */
function GoogleSignInCard({ onSignIn }: { onSignIn: (user: User) => void }) {
  const [signingIn, setSigningIn] = useState(false);
  const { auth, db } = createClient();

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      onSignIn(result.user);
    } catch (err) {
      console.error('Sign-in error:', err);
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <Button 
      onClick={handleGoogleSignIn} 
      disabled={signingIn}
      variant="outline"
      className="w-full"
    >
      {signingIn ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
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
      )}
      Sign in with Google
    </Button>
  );
}
