/**
 * User Dashboard - Role-based main dashboard
 * 
 * Shows different content based on user role:
 * - Admin: Overview statistics and management links
 * - Teacher: Assigned classes and attendance
 * - Student: Enrolled classes and notices
 */

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, BookOpen, MessageSquare, Calendar, Bell, GraduationCap, Loader2, Shield, BarChart3 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  const router = useRouter();
  const { auth, db } = createClient();
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
  });
  const [classes, setClasses] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { onAuthStateChanged } = await import('firebase/auth');
      
      onAuthStateChanged(auth, async (firebaseUser) => {
        if (!firebaseUser) {
          router.push('/login');
          return;
        }
        
        setUser(firebaseUser);
        
        // Load user profile
        const { doc, getDoc } = await import('firebase/firestore');
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setUserProfile({ id: userSnap.id, ...userSnap.data() });
        }
        
        // Load stats
        const { collection, getDocs, query, where } = await import('firebase/firestore');
        
        // Total students
        const studentsSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
        
        // Total teachers
        const teachersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'teacher')));
        
        // Total classes
        const classesSnap = await getDocs(collection(db, 'classes'));
        
        setStats({
          totalStudents: studentsSnap.size,
          totalTeachers: teachersSnap.size,
          totalClasses: classesSnap.size,
        });
        
        // Load classes based on role
        if (userProfile?.role === 'admin' || userProfile?.role === 'teacher') {
          setClasses(classesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } else {
          // For students, filter their classes
          const userClasses: any[] = [];
          for (const classId of userProfile?.classes || []) {
            const classSnap = await getDoc(doc(db, 'classes', classId));
            if (classSnap.exists()) {
              userClasses.push({ id: classSnap.id, ...classSnap.data() });
            }
          }
          setClasses(userClasses);
        }
        
        // Load notices
        const noticesSnap = await getDocs(collection(db, 'notices'));
        const noticesData = noticesSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a: any, b: any) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime;
          })
          .slice(0, 5);
        
        setNotices(noticesData);
        setLoading(false);
      });
    } catch (err) {
      console.error('Dashboard load error:', err);
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

  const role = userProfile?.role || 'student';
  const firstName = userProfile?.fullName?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Dashboard Header */}
      <div className="bg-white dark:bg-gray-800 border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {firstName}!</h1>
              <p className="text-muted-foreground mt-1">
                {role === 'admin' && 'Manage your academy from here'}
                {role === 'teacher' && 'Manage your classes and students'}
                {role === 'student' && 'Access your classes and resources'}
              </p>
            </div>
            <Badge variant={role === 'admin' ? 'default' : role === 'teacher' ? 'secondary' : 'outline'} className="text-sm px-3 py-1">
              {role === 'admin' && <Shield className="h-4 w-4 mr-1" />}
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {(role === 'admin' || role === 'teacher') && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalStudents}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Teachers</CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalTeachers}</div>
                </CardContent>
              </Card>
            </>
          )}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Classes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClasses}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Notices</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notices.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links for Admin */}
        {role === 'admin' && (
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Link href="/admin">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-600" />
                    Admin Panel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Manage users, classes, and notices
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/chat">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    All Chats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    View all class conversations
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/attendance">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                    Attendance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Track student attendance
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Classes Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Your Classes
              </CardTitle>
              <Link href="/chat">
                <Button variant="ghost" size="sm">
                  View All →
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {classes.length > 0 ? (
                <div className="space-y-4">
                  {classes.slice(0, 5).map((cls: any) => (
                    <Link 
                      key={cls.id} 
                      href={`/chat/${cls.id}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors">
                        <div>
                          <h3 className="font-medium">{cls.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {cls.description || 'No description'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{cls.members?.length || 0} students</Badge>
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">No classes yet</h3>
                  <p className="text-sm text-muted-foreground">
                    {role === 'admin' 
                      ? 'Create a class in the Admin Panel'
                      : 'Contact admin to be added to a class'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notices Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Recent Notices
              </CardTitle>
              <Link href="/notices">
                <Button variant="ghost" size="sm">
                  View All →
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {notices.length > 0 ? (
                <div className="space-y-4">
                  {notices.map((notice: any) => (
                    <div 
                      key={notice.id}
                      className={`p-4 rounded-lg border ${
                        notice.priority === 'urgent' 
                          ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800' 
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium flex items-center gap-2">
                          {notice.title}
                          {notice.priority === 'urgent' && (
                            <Badge variant="destructive" className="text-xs">Urgent</Badge>
                          )}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notice.content}
                      </p>
                      {notice.createdAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDistanceToNow(notice.createdAt.toDate(), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">No notices yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Important announcements will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Student-specific Info */}
        {role === 'student' && userProfile?.googleDriveLink && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Your Google Drive Folder
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                You've shared your classwork folder with your teachers.
              </p>
              <a 
                href={userProfile.googleDriveLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline">
                  Open My Drive Folder →
                </Button>
              </a>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
