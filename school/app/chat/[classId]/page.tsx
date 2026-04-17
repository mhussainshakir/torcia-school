/**
 * Individual Class Chat Room Page
 * 
 * Real-time chat for a specific class using Firebase Realtime Database.
 */

"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/firebase';
import { FirebaseChatRoom } from '@/components/chat/firebase-chat-room';
import { Loader2 } from 'lucide-react';

export default function ChatRoomPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.classId as string;
  
  const { auth, db } = createClient();
  
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [classData, setClassData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [classId]);

  const loadData = async () => {
    try {
      const { onAuthStateChanged } = await import('firebase/auth');
      
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          router.push('/login');
          return;
        }

        try {
          const { doc, getDoc } = await import('firebase/firestore');
          
          // Get class data
          const classRef = doc(db, 'classes', classId);
          const classSnap = await getDoc(classRef);
          
          if (!classSnap.exists()) {
            router.push('/chat');
            return;
          }
          
          setClassData({ id: classSnap.id, ...classSnap.data() });
          
          // Get user profile
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setCurrentUser({
              id: user.uid,
              email: user.email,
              fullName: userData.fullName || user.displayName,
              avatarUrl: userData.avatarUrl || user.photoURL,
              role: userData.role || 'student',
              classes: userData.classes || [],
            });
          } else {
            setCurrentUser({
              id: user.uid,
              email: user.email,
              fullName: user.displayName || 'User',
              role: 'student',
            });
          }
        } catch (err) {
          console.error('Load error:', err);
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

  if (!classData || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Class not found or access denied</p>
      </div>
    );
  }

  return (
    <FirebaseChatRoom
      classId={classId}
      className={classData.name}
      classDescription={classData.description}
      currentUser={currentUser}
    />
  );
}
