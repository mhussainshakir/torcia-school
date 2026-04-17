/**
 * Attendance Tracking Page
 * 
 * Teachers and admins can mark daily attendance for students.
 * Uses Firebase Firestore for data.
 */

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, CheckCircle, XCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AttendancePage() {
  const router = useRouter();
  const { auth, db } = createClient();
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState('student');
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadStudentsAndAttendance();
    }
  }, [selectedClass, currentDate]);

  const loadData = async () => {
    try {
      const { onAuthStateChanged } = await import('firebase/auth');
      
      onAuthStateChanged(auth, async (firebaseUser) => {
        if (!firebaseUser) {
          router.push('/login');
          return;
        }
        
        setUser(firebaseUser);
        
        const { doc, getDoc } = await import('firebase/firestore');
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUserRole(userData.role || 'student');
          
          // Load classes
          const { collection, getDocs } = await import('firebase/firestore');
          const classesSnap = await getDocs(collection(db, 'classes'));
          const classesData = classesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setClasses(classesData);
          
          if (classesData.length > 0) {
            setSelectedClass(classesData[0].id);
          }
        }
        
        setLoading(false);
      });
    } catch (err) {
      console.error('Load error:', err);
      setLoading(false);
    }
  };

  const loadStudentsAndAttendance = async () => {
    if (!selectedClass) return;
    
    try {
      const { doc, getDoc, collection, getDocs, query, where } = await import('firebase/firestore');
      
      // Get class data
      const classRef = doc(db, 'classes', selectedClass);
      const classSnap = await getDoc(classRef);
      
      if (!classSnap.exists()) return;
      
      const classData = classSnap.data();
      const memberIds = classData.members || [];
      
      // Get member details
      const studentList: any[] = [];
      for (const memberId of memberIds) {
        const studentRef = doc(db, 'users', memberId);
        const studentSnap = await getDoc(studentRef);
        if (studentSnap.exists()) {
          studentList.push({ id: studentSnap.id, ...studentSnap.data() });
        }
      }
      setStudents(studentList);
      
      // Get attendance for today
      const attendanceRef = collection(db, 'attendance');
      const q = query(attendanceRef, where('classId', '==', selectedClass), where('date', '==', currentDate));
      const attendanceSnap = await getDocs(q);
      
      const attendanceMap: Record<string, string> = {};
      attendanceSnap.docs.forEach(doc => {
        const data = doc.data();
        attendanceMap[data.userId] = data.status;
      });
      setAttendance(attendanceMap);
      
    } catch (err) {
      console.error('Load attendance error:', err);
    }
  };

  const handleToggleAttendance = async (studentId: string, status: string) => {
    if (!user || !selectedClass) return;
    
    setSaving(true);
    
    try {
      const { collection, addDoc, query, where, getDocs, doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      
      // Check if attendance record exists
      const q = query(
        collection(db, 'attendance'),
        where('classId', '==', selectedClass),
        where('userId', '==', studentId),
        where('date', '==', currentDate)
      );
      const existingSnap = await getDocs(q);
      
      if (existingSnap.empty) {
        // Create new record
        await addDoc(collection(db, 'attendance'), {
          classId: selectedClass,
          userId: studentId,
          date: currentDate,
          status,
          markedBy: user.uid,
          createdAt: serverTimestamp(),
        });
      } else {
        // Update existing record
        const recordId = existingSnap.docs[0].id;
        await updateDoc(doc(db, 'attendance', recordId), {
          status,
          markedBy: user.uid,
        });
      }
      
      // Update local state
      setAttendance(prev => ({ ...prev, [studentId]: status }));
      
    } catch (err) {
      console.error('Attendance error:', err);
    } finally {
      setSaving(false);
    }
  };

  const changeDate = (days: number) => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + days);
    setCurrentDate(date.toISOString().split('T')[0]);
  };

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (userRole === 'student') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Students cannot mark attendance. Please contact your teacher.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const presentCount = students.filter(s => attendance[s.id] === 'present').length;
  const absentCount = students.filter(s => attendance[s.id] === 'absent').length;
  const unmarkedCount = students.length - presentCount - absentCount;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Attendance</h1>
          <p className="text-muted-foreground mt-1">Mark daily attendance for your classes</p>
        </div>

        {/* Class Selector */}
        {classes.length > 0 && (
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Date Navigation */}
        <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
          <Button variant="outline" size="icon" onClick={() => changeDate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">{formatDisplayDate(currentDate)}</span>
          </div>
          <Button variant="outline" size="icon" onClick={() => changeDate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" /> Present
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{presentCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" /> Absent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{absentCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" /> Unmarked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-500">{unmarkedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Students List */}
        <Card>
          <CardHeader>
            <CardTitle>Students ({students.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {students.length > 0 ? (
              <div className="space-y-3">
                {students.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{student.fullName?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{student.fullName || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={attendance[student.id] === 'present' ? 'default' : 'outline'}>
                        {attendance[student.id] || 'Unmarked'}
                      </Badge>
                      <Button
                        size="sm"
                        variant={attendance[student.id] === 'present' ? 'default' : 'outline'}
                        onClick={() => handleToggleAttendance(student.id, 'present')}
                        disabled={saving}
                      >
                        Present
                      </Button>
                      <Button
                        size="sm"
                        variant={attendance[student.id] === 'absent' ? 'destructive' : 'outline'}
                        onClick={() => handleToggleAttendance(student.id, 'absent')}
                        disabled={saving}
                      >
                        Absent
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">No students in this class</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
