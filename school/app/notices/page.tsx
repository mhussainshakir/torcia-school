/**
 * Notice Board Page
 * 
 * Admins and teachers can create, pin, and delete notices.
 * All authenticated users can view notices.
 * Uses Firebase Firestore.
 */

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Bell, Plus, Loader2, AlertTriangle, Trash2, Loader } from 'lucide-react';

export default function NoticesPage() {
  const router = useRouter();
  const { auth, db } = createClient();
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState('student');
  const [notices, setNotices] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { onAuthStateChanged } = await import('firebase/auth');
      
      onAuthStateChanged(auth, async (firebaseUser) => {
        if (!firebaseUser) {
          router.push('/login');
          return;
        }
        
        setUser(firebaseUser);
        
        const { doc, getDoc, collection, getDocs, query, orderByDesc, serverTimestamp, addDoc } = await import('firebase/firestore');
        
        // Get user role
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setUserRole(userSnap.data().role || 'student');
        }
        
        // Get notices
        const noticesRef = collection(db, 'notices');
        const q = query(noticesRef, orderByDesc('createdAt'));
        const noticesSnap = await getDocs(q);
        
        const noticesData = noticesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        }));
        
        setNotices(noticesData);
        setLoading(false);
      });
    } catch (err) {
      console.error('Load error:', err);
      setLoading(false);
    }
  };

  const handleCreateNotice = async () => {
    if (!title.trim() || !content.trim() || !user) return;
    
    setSubmitting(true);
    
    try {
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      
      await addDoc(collection(db, 'notices'), {
        title: title.trim(),
        content: content.trim(),
        priority,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });
      
      // Reset form
      setTitle('');
      setContent('');
      setPriority('normal');
      setIsCreating(false);
      
      // Reload notices
      loadData();
      
    } catch (err) {
      console.error('Create notice error:', err);
      alert('Failed to create notice');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNotice = async (noticeId: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) return;
    
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'notices', noticeId));
      loadData();
    } catch (err) {
      console.error('Delete notice error:', err);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const canCreate = userRole === 'admin' || userRole === 'teacher';
  const urgentNotices = notices.filter(n => n.priority === 'urgent');
  const regularNotices = notices.filter(n => n.priority !== 'urgent');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notice Board</h1>
            <p className="text-muted-foreground mt-1">Important announcements and updates</p>
          </div>
          
          {canCreate && (
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Notice
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Notice</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      placeholder="Notice title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Content</label>
                    <Textarea
                      placeholder="Notice content..."
                      rows={4}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <label className="text-sm font-medium">Mark as Urgent</label>
                    </div>
                    <Button
                      variant={priority === 'urgent' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPriority(priority === 'urgent' ? 'normal' : 'urgent')}
                    >
                      {priority === 'urgent' ? 'Urgent' : 'Normal'}
                    </Button>
                  </div>
                  <Button
                    onClick={handleCreateNotice}
                    disabled={!title.trim() || !content.trim() || submitting}
                    className="w-full"
                  >
                    {submitting ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Notice'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Urgent Notices */}
        {urgentNotices.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h2 className="text-lg font-semibold">Urgent Notices</h2>
            </div>
            {urgentNotices.map((notice) => (
              <Card key={notice.id} className="border-red-200 bg-red-50 dark:bg-red-950">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <CardTitle className="text-lg">{notice.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Urgent</Badge>
                      {canCreate && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteNotice(notice.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{notice.content}</p>
                  <p className="mt-4 text-xs text-muted-foreground">
                    {formatTimeAgo(notice.createdAt)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Regular Notices */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">All Notices</h2>
          </div>
          
          {regularNotices.length > 0 ? (
            regularNotices.map((notice) => (
              <Card key={notice.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle>{notice.title}</CardTitle>
                    {canCreate && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteNotice(notice.id)}
                        className="text-muted-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-muted-foreground">{notice.content}</p>
                  <p className="mt-4 text-xs text-muted-foreground">
                    {formatTimeAgo(notice.createdAt)}
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No notices yet</h3>
                <p className="text-muted-foreground mt-1">
                  {canCreate ? 'Create your first notice' : 'Check back later for announcements'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
