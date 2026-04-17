/**
 * Chat Sections Listing Page
 * 
 * Shows all class chat rooms the user has access to.
 * Uses Firebase Firestore for data.
 */

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, Loader2 } from 'lucide-react';

interface ClassData {
  id: string;
  name: string;
  description?: string;
  teacherId?: string;
  members?: string[];
}

export default function ChatListPage() {
  const router = useRouter();
  const { auth, db } = createClient();
  
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [userRole, setUserRole] = useState('student');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { onAuthStateChanged } = await import('firebase/auth');
      
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          router.push('/login');
          return;
        }

        try {
          const { doc, getDoc, collection, getDocs } = await import('firebase/firestore');
          
          // Get user profile
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setUserRole(userData.role || 'student');
            
            // Get classes based on role
            if (userData.role === 'admin') {
              // Admin sees all classes
              const classesSnap = await getDocs(collection(db, 'classes'));
              setClasses(classesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ClassData));
            } else if (userData.role === 'teacher') {
              // Teacher sees all classes (for now)
              const classesSnap = await getDocs(collection(db, 'classes'));
              setClasses(classesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ClassData));
            } else {
              // Student sees only enrolled classes
              const userClasses: ClassData[] = [];
              for (const classId of userData.classes || []) {
                const classSnap = await getDoc(doc(db, 'classes', classId));
                if (classSnap.exists()) {
                  userClasses.push({ id: classSnap.id, ...classSnap.data() } as ClassData);
                }
              }
              setClasses(userClasses);
            }
          } else {
            setClasses([]);
          }
        } catch (err) {
          console.error('Load error:', err);
          setClasses([]);
        }

        setLoading(false);
      });
    } catch (err) {
      console.error('Auth error:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Chat Sections</h1>
            <p className="text-muted-foreground mt-1">
              Select a class to view and send messages
            </p>
          </div>
          {userRole === 'admin' && (
            <Link href="/admin">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Manage Classes
              </Button>
            </Link>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <Link key={cls.id} href={`/chat/${cls.id}`}>
              <Card className="transition-all hover:shadow-lg hover:border-primary cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="h-5 w-5 text-primary" />
                    {cls.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {cls.description || 'No description'}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {cls.members?.length || 0} students enrolled
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {classes.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No classes yet</h3>
              <p className="text-muted-foreground mt-1">
                {userRole === 'admin'
                  ? 'Go to Admin Panel to create a class'
                  : 'Contact admin to be added to a class'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
