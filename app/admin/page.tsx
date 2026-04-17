/**
 * Admin Dashboard - Secret Admin Panel
 * 
 * This is a hidden admin dashboard only accessible to admins.
 * URL: /admin (hidden from regular users)
 */

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, BookOpen, GraduationCap, Shield, AlertTriangle, Loader2, Plus, Trash2, Edit, Search, ChevronRight, Bell, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const router = useRouter();
  const { auth, db } = createClient();
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'classes' | 'notices'>('overview');
  
  // Data states
  const [users, setUsers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  
  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalAdmins: 0,
    totalClasses: 0,
    totalNotices: 0,
  });
  
  // Search/Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  /**
   * Checks if current user has admin access
   */
  const checkAdminAccess = async () => {
    try {
      const { onAuthStateChanged } = await import('firebase/auth');
      
      onAuthStateChanged(auth, async (firebaseUser) => {
        if (!firebaseUser) {
          router.push('/login');
          return;
        }
        
        setUser(firebaseUser);
        
        // Check if user is admin
        const { doc, getDoc } = await import('firebase/firestore');
        const adminRef = doc(db, 'admins', firebaseUser.uid);
        const adminSnap = await getDoc(adminRef);
        
        if (!adminSnap.exists()) {
          // Not an admin - redirect to regular dashboard
          router.push('/dashboard');
          return;
        }
        
        setIsAdmin(true);
        setLoading(false);
      });
    } catch (err) {
      console.error('Admin check error:', err);
      router.push('/login');
    }
  };

  /**
   * Loads all admin data
   */
  const loadData = async () => {
    setLoading(true);
    
    try {
      const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
      
      // Load users
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
      
      // Load classes
      const classesSnap = await getDocs(collection(db, 'classes'));
      const classesData = classesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClasses(classesData);
      
      // Load notices
      const noticesSnap = await getDocs(collection(db, 'notices'));
      const noticesData = noticesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotices(noticesData);
      
      // Calculate stats
      setStats({
        totalUsers: usersData.length,
        totalStudents: usersData.filter((u: any) => u.role === 'student').length,
        totalTeachers: usersData.filter((u: any) => u.role === 'teacher').length,
        totalAdmins: usersData.filter((u: any) => u.role === 'admin').length,
        totalClasses: classesData.length,
        totalNotices: noticesData.length,
      });
      
    } catch (err) {
      console.error('Load data error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Updates user role
   */
  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const { doc, updateDoc, setDoc, deleteDoc } = await import('firebase/firestore');
      
      // Update user role
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { role: newRole });
      
      // Update role-specific collections
      if (newRole === 'admin') {
        await setDoc(doc(db, 'admins', userId), {
          userId,
          email: users.find((u: any) => u.id === userId)?.email,
          createdAt: new Date().toISOString(),
        });
        await deleteDoc(doc(db, 'teachers', userId));
      } else if (newRole === 'teacher') {
        await setDoc(doc(db, 'teachers', userId), {
          userId,
          email: users.find((u: any) => u.id === userId)?.email,
          createdAt: new Date().toISOString(),
        });
        await deleteDoc(doc(db, 'admins', userId));
      } else {
        await deleteDoc(doc(db, 'admins', userId));
        await deleteDoc(doc(db, 'teachers', userId));
      }
      
      loadData();
    } catch (err) {
      console.error('Update role error:', err);
      alert('Failed to update role');
    }
  };

  /**
   * Deletes a user
   */
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    if (userId === user?.uid) {
      alert('You cannot delete yourself!');
      return;
    }
    
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      
      await deleteDoc(doc(db, 'users', userId));
      await deleteDoc(doc(db, 'admins', userId)).catch(() => {});
      await deleteDoc(doc(db, 'teachers', userId)).catch(() => {});
      
      loadData();
    } catch (err) {
      console.error('Delete user error:', err);
      alert('Failed to delete user');
    }
  };

  /**
   * Creates a new class
   */
  const handleCreateClass = async (name: string, description: string) => {
    try {
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      
      await addDoc(collection(db, 'classes'), {
        name,
        description,
        teacherId: null,
        members: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      loadData();
    } catch (err) {
      console.error('Create class error:', err);
      alert('Failed to create class');
    }
  };

  /**
   * Deletes a class
   */
  const handleDeleteClass = async (classId: string) => {
    if (!confirm('Are you sure you want to delete this class?')) return;
    
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'classes', classId));
      loadData();
    } catch (err) {
      console.error('Delete class error:', err);
      alert('Failed to delete class');
    }
  };

  /**
   * Creates a notice
   */
  const handleCreateNotice = async (title: string, content: string, priority: string) => {
    try {
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      
      await addDoc(collection(db, 'notices'), {
        title,
        content,
        priority,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      loadData();
    } catch (err) {
      console.error('Create notice error:', err);
      alert('Failed to create notice');
    }
  };

  /**
   * Deletes a notice
   */
  const handleDeleteNotice = async (noticeId: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) return;
    
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'notices', noticeId));
      loadData();
    } catch (err) {
      console.error('Delete notice error:', err);
      alert('Failed to delete notice');
    }
  };

  // Filter users based on search and role
  const filteredUsers = users.filter((u: any) => {
    const matchesSearch = 
      u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Admin Header */}
      <div className="bg-white dark:bg-gray-800 border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome, {user?.displayName || 'Admin'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                Secret Admin Panel
              </Badge>
              <Link href="/dashboard">
                <Button variant="outline" size="sm">← Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalStudents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Teachers</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.totalTeachers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Classes</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.totalClasses}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'outline'}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </Button>
          <Button
            variant={activeTab === 'users' ? 'default' : 'outline'}
            onClick={() => setActiveTab('users')}
          >
            Users ({stats.totalUsers})
          </Button>
          <Button
            variant={activeTab === 'classes' ? 'default' : 'outline'}
            onClick={() => setActiveTab('classes')}
          >
            Classes ({stats.totalClasses})
          </Button>
          <Button
            variant={activeTab === 'notices' ? 'default' : 'outline'}
            onClick={() => setActiveTab('notices')}
          >
            Notices ({stats.totalNotices})
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total Admins</span>
                  <Badge variant="outline">{stats.totalAdmins} / 5</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Notices</span>
                  <Badge variant="outline">{stats.totalNotices}</Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('users')}>
                  <Users className="mr-2 h-4 w-4" />
                  Manage Users
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('classes')}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Manage Classes
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('notices')}>
                  <Bell className="mr-2 h-4 w-4" />
                  Manage Notices
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'users' && (
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle>User Management</CardTitle>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                  />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="teacher">Teacher</option>
                    <option value="student">Student</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredUsers.map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt="" className="h-10 w-10 rounded-full" />
                        ) : (
                          <span className="text-lg font-medium">{u.fullName?.[0] || '?'}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{u.fullName || 'Unnamed'}</p>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={u.role === 'admin' ? 'default' : u.role === 'teacher' ? 'secondary' : 'outline'}>
                        {u.role}
                      </Badge>
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                        className="px-2 py-1 text-sm border rounded"
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                      </select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteUser(u.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">No users found</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'classes' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Class Management</CardTitle>
                <Button onClick={() => {
                  const name = prompt('Enter class name:');
                  if (name) {
                    const desc = prompt('Enter description (optional):') || '';
                    handleCreateClass(name, desc);
                  }
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Class
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map((c: any) => (
                  <div key={c.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{c.name}</h3>
                      <Badge variant="outline">{c.members?.length || 0} students</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{c.description || 'No description'}</p>
                    <div className="flex justify-between items-center">
                      <Link href={`/chat/${c.id}`}>
                        <Button variant="outline" size="sm">View Chat</Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClass(c.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {classes.length === 0 && (
                  <p className="col-span-full text-center py-8 text-muted-foreground">No classes found</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'notices' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Notice Management</CardTitle>
                <Button onClick={() => {
                  const title = prompt('Enter notice title:');
                  if (title) {
                    const content = prompt('Enter notice content:') || '';
                    const priority = confirm('Mark as urgent?') ? 'urgent' : 'normal';
                    handleCreateNotice(title, content, priority);
                  }
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Notice
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notices.map((n: any) => (
                  <div 
                    key={n.id} 
                    className={`p-4 border rounded-lg ${
                      n.priority === 'urgent' ? 'border-red-200 bg-red-50 dark:bg-red-950' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{n.title}</h3>
                        {n.priority === 'urgent' && (
                          <Badge variant="destructive">Urgent</Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteNotice(n.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">{n.content}</p>
                  </div>
                ))}
                {notices.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">No notices found</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
