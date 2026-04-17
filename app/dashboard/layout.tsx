/**
 * Dashboard Layout Wrapper
 * 
 * Provides authentication check and profile loading
 * for all dashboard pages using Firebase Auth.
 */

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/firebase';
import { Sidebar } from '@/components/layout/sidebar';
import { Loader2 } from 'lucide-react';

interface SidebarUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: string;
  googleDriveLink?: string;
  classes: string[];
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { auth, db } = createClient();
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<SidebarUser | null>(null);

  useEffect(() => {
    const { onAuthStateChanged } = require('firebase/auth');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: any) => {
      if (!firebaseUser) {
        router.push('/login');
        return;
      }

      try {
        // Load user profile from Firestore
        const { doc, getDoc } = await import('firebase/firestore');
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            fullName: userData.fullName || firebaseUser.displayName || 'User',
            avatarUrl: userData.avatarUrl || firebaseUser.photoURL || '',
            role: userData.role || 'student',
            googleDriveLink: userData.googleDriveLink,
            classes: userData.classes || [],
          });
        } else {
          // Create default profile for new user
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            fullName: firebaseUser.displayName || 'User',
            avatarUrl: firebaseUser.photoURL || '',
            role: 'student',
            classes: [],
          });
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        // Still allow access even if profile load fails
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          fullName: firebaseUser.displayName || 'User',
          avatarUrl: firebaseUser.photoURL || '',
          role: 'student',
          classes: [],
        });
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, db, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar user={user} />
      <main className="md:pl-64">
        {children}
      </main>
    </div>
  );
}
