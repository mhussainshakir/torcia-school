/**
 * Resources Page
 * 
 * Students can view shared resources (PDFs, images, videos) from their class chats.
 * Uses Firebase Realtime Database for chat messages.
 */

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Search, FileText, Image, Loader2, ExternalLink } from 'lucide-react';

export default function ResourcesPage() {
  const router = useRouter();
  const { auth, db, database } = createClient();
  
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [resources, setResources] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadResources();
    }
  }, [selectedClass, filterType]);

  const loadClasses = async () => {
    try {
      const { onAuthStateChanged } = await import('firebase/auth');
      
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          router.push('/login');
          return;
        }

        const { doc, getDoc, collection, getDocs } = await import('firebase/firestore');
        
        // Get user profile
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const userClasses: any[] = [];
          
          for (const classId of userData.classes || []) {
            const classRef = doc(db, 'classes', classId);
            const classSnap = await getDoc(classRef);
            if (classSnap.exists()) {
              userClasses.push({ id: classSnap.id, ...classSnap.data() });
            }
          }
          
          setClasses(userClasses);
          if (userClasses.length > 0) {
            setSelectedClass(userClasses[0].id);
          }
        }
        
        setLoading(false);
      });
    } catch (err) {
      console.error('Load error:', err);
      setLoading(false);
    }
  };

  const loadResources = async () => {
    if (!selectedClass) return;
    
    try {
      const { ref, get, query, orderByChild, limitToLast } = await import('firebase/database');
      
      const messagesRef = ref(database, `classes/${selectedClass}/messages`);
      const messagesQuery = query(messagesRef, orderByChild('createdAt'), limitToLast(100));
      
      const snapshot = await new Promise((resolve) => {
        get(messagesQuery, resolve);
      }) as any;
      
      const resourcesData: any[] = [];
      snapshot.forEach((childSnapshot: any) => {
        const message = childSnapshot.val();
        if (['image', 'pdf', 'video'].includes(message.type)) {
          resourcesData.push({
            id: childSnapshot.key,
            ...message,
          });
        }
      });
      
      // Sort by creation time (newest first)
      resourcesData.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setResources(resourcesData);
      
    } catch (err) {
      console.error('Load resources error:', err);
    }
  };

  const filteredResources = resources.filter((r) => {
    const matchesSearch = r.content?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || r.type === filterType;
    return matchesSearch && matchesType;
  });

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'image':
        return <Image className="h-8 w-8 text-blue-500" />;
      case 'video':
        return <FileText className="h-8 w-8 text-purple-500" />;
      default:
        return <FileText className="h-8 w-8 text-gray-500" />;
    }
  };

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Resources</h1>
          <p className="text-muted-foreground mt-1">Access shared class materials</p>
        </div>

        {/* Class Selector */}
        {classes.length > 0 && (
          <div className="flex gap-4">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">All Types</option>
              <option value="pdf">PDFs</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
            </select>
          </div>
        )}

        {/* Resources Grid */}
        {selectedClass && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredResources.map((resource) => (
              <Card key={resource.id} className="overflow-hidden">
                <div className="flex h-32 items-center justify-center bg-gray-100 dark:bg-gray-800">
                  {resource.type === 'image' && resource.fileUrl ? (
                    <img
                      src={resource.fileUrl}
                      alt={resource.content}
                      className="h-full w-full object-cover"
                    />
                  ) : resource.type === 'video' ? (
                    <img
                      src={`https://img.youtube.com/vi/${getYouTubeId(resource.fileUrl || '')}/hqdefault.jpg`}
                      alt={resource.content}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getResourceIcon(resource.type)
                  )}
                </div>
                <CardContent className="p-4">
                  <p className="truncate font-medium">{resource.content}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    by {resource.senderName}
                  </p>
                  {resource.fileUrl && (
                    <a
                      href={resource.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {resource.type === 'image' ? 'View' : 'Open'}
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredResources.length === 0 && selectedClass && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No resources found</h3>
              <p className="text-muted-foreground mt-1">
                Shared files in this class will appear here
              </p>
            </CardContent>
          </Card>
        )}

        {classes.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No classes enrolled</h3>
              <p className="text-muted-foreground mt-1">
                Join a class to access shared resources
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
