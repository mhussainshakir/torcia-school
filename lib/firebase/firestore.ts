/**
 * Firebase Firestore Database Service
 * 
 * Handles all Firestore operations for:
 * - Users collection
 * - Classes collection
 * - Attendance collection
 * - Notices collection
 * - Admin collection
 * - Teachers collection
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  writeBatch,
  DocumentReference,
  DocumentData,
} from 'firebase/firestore';
import { db } from './config';

// Type definitions
export interface ClassData {
  id?: string;
  name: string;
  description?: string;
  teacherId?: string;
  teacherName?: string;
  members: string[];
  createdAt?: any;
  updatedAt?: any;
}

export interface AttendanceRecord {
  id?: string;
  classId: string;
  userId: string;
  userName?: string;
  date: string;
  status: 'present' | 'absent';
  markedBy: string;
  createdAt?: any;
}

export interface NoticeData {
  id?: string;
  title: string;
  content: string;
  priority: 'normal' | 'urgent';
  createdBy: string;
  creatorName?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface UserData {
  id?: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: 'admin' | 'teacher' | 'student';
  googleDriveLink?: string;
  classes: string[];
  createdAt?: any;
  updatedAt?: any;
}

// ═══════════════════════════════════════════════════════════════════════════
// 👥 USERS COLLECTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Gets all users from Firestore.
 * 
 * @returns Array of user profiles
 */
export async function getAllUsers(): Promise<UserData[]> {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
}

/**
 * Gets users by role.
 * 
 * @param role - User role ('admin' | 'teacher' | 'student')
 * @returns Array of users with specified role
 */
export async function getUsersByRole(role: 'admin' | 'teacher' | 'student'): Promise<UserData[]> {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('role', '==', role), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
}

/**
 * Gets a single user by ID.
 * 
 * @param userId - User ID
 * @returns User data or null
 */
export async function getUserById(userId: string): Promise<UserData | null> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    return { id: userSnap.id, ...userSnap.data() } as UserData;
  }
  
  return null;
}

/**
 * Updates user data.
 * 
 * @param userId - User ID
 * @param data - Data to update
 */
export async function updateUser(userId: string, data: Partial<UserData>): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Updates user role.
 * Also manages admin/teacher collections.
 * 
 * @param userId - User ID
 * @param newRole - New role to assign
 */
export async function updateUserRole(userId: string, newRole: 'admin' | 'teacher' | 'student'): Promise<void> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) return;
  
  const oldRole = userSnap.data().role;
  
  // Update user role
  await updateDoc(userRef, {
    role: newRole,
    updatedAt: serverTimestamp(),
  });
  
  // Update role-specific collections
  if (oldRole === 'admin') {
    await deleteDoc(doc(db, 'admins', userId));
  } else if (oldRole === 'teacher') {
    await deleteDoc(doc(db, 'teachers', userId));
  }
  
  if (newRole === 'admin') {
    await setDoc(doc(db, 'admins', userId), {
      userId,
      email: userSnap.data().email,
      createdAt: serverTimestamp(),
    });
  } else if (newRole === 'teacher') {
    await setDoc(doc(db, 'teachers', userId), {
      userId,
      email: userSnap.data().email,
      createdAt: serverTimestamp(),
    });
  }
}

/**
 * Deletes a user and their role entries.
 * 
 * @param userId - User ID to delete
 */
export async function deleteUser(userId: string): Promise<void> {
  const batch = writeBatch(db);
  
  // Delete from users collection
  batch.delete(doc(db, 'users', userId));
  
  // Delete from admins if exists
  batch.delete(doc(db, 'admins', userId));
  
  // Delete from teachers if exists
  batch.delete(doc(db, 'teachers', userId));
  
  await batch.commit();
}

/**
 * Adds a user to a class.
 * 
 * @param userId - User ID
 * @param classId - Class ID
 */
export async function addUserToClass(userId: string, classId: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    classes: arrayUnion(classId),
  });
}

/**
 * Removes a user from a class.
 * 
 * @param userId - User ID
 * @param classId - Class ID
 */
export async function removeUserFromClass(userId: string, classId: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    classes: arrayRemove(classId),
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// 👑 ADMIN COLLECTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Gets count of all admins.
 * Maximum 5 admins allowed.
 * 
 * @returns Number of admins
 */
export async function getAdminCount(): Promise<number> {
  const adminsRef = collection(db, 'admins');
  const snapshot = await getDocs(adminsRef);
  return snapshot.size;
}

/**
 * Gets all admin IDs.
 * 
 * @returns Array of admin user IDs
 */
export async function getAllAdminIds(): Promise<string[]> {
  const adminsRef = collection(db, 'admins');
  const snapshot = await getDocs(adminsRef);
  return snapshot.docs.map(doc => doc.id);
}

/**
 * Checks if a user is an admin.
 * 
 * @param userId - User ID to check
 * @returns true if admin
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  const adminRef = doc(db, 'admins', userId);
  const adminSnap = await getDoc(adminRef);
  return adminSnap.exists();
}

/**
 * Makes a user an admin.
 * 
 * @param userId - User ID to make admin
 * @param email - User email
 * @throws Error if max 5 admins reached
 */
export async function makeUserAdmin(userId: string, email: string): Promise<void> {
  const adminCount = await getAdminCount();
  
  if (adminCount >= 5) {
    throw new Error('Maximum 5 admins allowed');
  }
  
  // Add to admins collection
  await setDoc(doc(db, 'admins', userId), {
    userId,
    email,
    createdAt: serverTimestamp(),
  });
  
  // Update user role
  await updateUserRole(userId, 'admin');
}

/**
 * Removes a user from admin role.
 * 
 * @param userId - User ID to remove from admin
 */
export async function removeUserAsAdmin(userId: string): Promise<void> {
  // Delete from admins collection
  await deleteDoc(doc(db, 'admins', userId));
  
  // Update user role
  await updateUserRole(userId, 'student');
}

// ═══════════════════════════════════════════════════════════════════════════
// 👨‍🏫 TEACHERS COLLECTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Gets all teacher IDs.
 * 
 * @returns Array of teacher user IDs
 */
export async function getAllTeacherIds(): Promise<string[]> {
  const teachersRef = collection(db, 'teachers');
  const snapshot = await getDocs(teachersRef);
  return snapshot.docs.map(doc => doc.id);
}

/**
 * Checks if a user is a teacher.
 * 
 * @param userId - User ID to check
 * @returns true if teacher
 */
export async function isUserTeacher(userId: string): Promise<boolean> {
  const teacherRef = doc(db, 'teachers', userId);
  const teacherSnap = await getDoc(teacherRef);
  return teacherSnap.exists();
}

/**
 * Makes a user a teacher.
 * 
 * @param userId - User ID to make teacher
 * @param email - User email
 */
export async function makeUserTeacher(userId: string, email: string): Promise<void> {
  // Add to teachers collection
  await setDoc(doc(db, 'teachers', userId), {
    userId,
    email,
    createdAt: serverTimestamp(),
  });
  
  // Update user role
  await updateUserRole(userId, 'teacher');
}

/**
 * Removes a user from teacher role.
 * 
 * @param userId - User ID to remove from teacher
 */
export async function removeUserAsTeacher(userId: string): Promise<void> {
  // Delete from teachers collection
  await deleteDoc(doc(db, 'teachers', userId));
  
  // Update user role
  await updateUserRole(userId, 'student');
}

// ═══════════════════════════════════════════════════════════════════════════
// 📚 CLASSES COLLECTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Gets all classes.
 * 
 * @returns Array of classes
 */
export async function getAllClasses(): Promise<ClassData[]> {
  const classesRef = collection(db, 'classes');
  const q = query(classesRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  
  const classes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassData));
  
  // Fetch teacher names
  for (const cls of classes) {
    if (cls.teacherId) {
      const teacher = await getUserById(cls.teacherId);
      cls.teacherName = teacher?.fullName || 'Unknown Teacher';
    }
  }
  
  return classes;
}

/**
 * Gets a class by ID.
 * 
 * @param classId - Class ID
 * @returns Class data or null
 */
export async function getClassById(classId: string): Promise<ClassData | null> {
  const classRef = doc(db, 'classes', classId);
  const classSnap = await getDoc(classRef);
  
  if (classSnap.exists()) {
    return { id: classSnap.id, ...classSnap.data() } as ClassData;
  }
  
  return null;
}

/**
 * Gets classes for a user.
 * 
 * @param userId - User ID
 * @param userRole - User role
 * @returns Array of classes
 */
export async function getUserClasses(userId: string, userRole: string): Promise<ClassData[]> {
  if (userRole === 'admin' || userRole === 'teacher') {
    return getAllClasses();
  }
  
  // For students, get their enrolled classes
  const user = await getUserById(userId);
  if (!user) return [];
  
  const classes: ClassData[] = [];
  for (const classId of user.classes || []) {
    const cls = await getClassById(classId);
    if (cls) classes.push(cls);
  }
  
  return classes;
}

/**
 * Creates a new class.
 * 
 * @param data - Class data
 * @returns Created class ID
 */
export async function createClass(data: Omit<ClassData, 'id'>): Promise<string> {
  const classesRef = collection(db, 'classes');
  const docRef = await addDoc(classesRef, {
    ...data,
    members: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  // If teacher is assigned, update teacher's classes array
  if (data.teacherId) {
    await addUserToClass(data.teacherId, docRef.id);
  }
  
  return docRef.id;
}

/**
 * Updates a class.
 * 
 * @param classId - Class ID
 * @param data - Data to update
 */
export async function updateClass(classId: string, data: Partial<ClassData>): Promise<void> {
  const classRef = doc(db, 'classes', classId);
  await updateDoc(classRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Deletes a class and removes all members.
 * 
 * @param classId - Class ID to delete
 */
export async function deleteClass(classId: string): Promise<void> {
  const cls = await getClassById(classId);
  if (!cls) return;
  
  // Remove class from all members
  const batch = writeBatch(db);
  
  for (const memberId of cls.members || []) {
    batch.update(doc(db, 'users', memberId), {
      classes: arrayRemove(classId),
    });
  }
  
  // Delete class
  batch.delete(doc(db, 'classes', classId));
  
  await batch.commit();
}

/**
 * Adds a student to a class.
 * 
 * @param classId - Class ID
 * @param userId - User ID
 */
export async function addStudentToClass(classId: string, userId: string): Promise<void> {
  const classRef = doc(db, 'classes', classId);
  await updateDoc(classRef, {
    members: arrayUnion(userId),
  });
  await addUserToClass(userId, classId);
}

/**
 * Removes a student from a class.
 * 
 * @param classId - Class ID
 * @param userId - User ID
 */
export async function removeStudentFromClass(classId: string, userId: string): Promise<void> {
  const classRef = doc(db, 'classes', classId);
  await updateDoc(classRef, {
    members: arrayRemove(userId),
  });
  await removeUserFromClass(userId, classId);
}

/**
 * Gets all students in a class.
 * 
 * @param classId - Class ID
 * @returns Array of student profiles
 */
export async function getClassStudents(classId: string): Promise<UserData[]> {
  const cls = await getClassById(classId);
  if (!cls) return [];
  
  const students: UserData[] = [];
  for (const studentId of cls.members || []) {
    const student = await getUserById(studentId);
    if (student) students.push(student);
  }
  
  return students;
}

// ═══════════════════════════════════════════════════════════════════════════
// 📅 ATTENDANCE COLLECTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Gets attendance for a class on a date.
 * 
 * @param classId - Class ID
 * @param date - Date string (YYYY-MM-DD)
 * @returns Map of userId to attendance status
 */
export async function getAttendanceByDate(classId: string, date: string): Promise<Map<string, string>> {
  const attendanceRef = collection(db, 'attendance');
  const q = query(
    attendanceRef,
    where('classId', '==', classId),
    where('date', '==', date)
  );
  const snapshot = await getDocs(q);
  
  const attendanceMap = new Map<string, string>();
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    attendanceMap.set(data.userId, data.status);
  });
  
  return attendanceMap;
}

/**
 * Marks attendance for a student.
 * 
 * @param classId - Class ID
 * @param userId - User ID
 * @param date - Date string (YYYY-MM-DD)
 * @param status - Attendance status
 * @param markedBy - Teacher/Admin user ID
 */
export async function markAttendance(
  classId: string,
  userId: string,
  date: string,
  status: 'present' | 'absent',
  markedBy: string
): Promise<void> {
  const attendanceRef = collection(db, 'attendance');
  
  // Check if attendance already exists for this student on this date
  const q = query(
    attendanceRef,
    where('classId', '==', classId),
    where('userId', '==', userId),
    where('date', '==', date)
  );
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    // Create new attendance record
    await addDoc(attendanceRef, {
      classId,
      userId,
      date,
      status,
      markedBy,
      createdAt: serverTimestamp(),
    });
  } else {
    // Update existing record
    const docId = snapshot.docs[0].id;
    await updateDoc(doc(attendanceRef, docId), {
      status,
      markedBy,
    });
  }
}

/**
 * Gets attendance history for a user.
 * 
 * @param userId - User ID
 * @param limitCount - Maximum records to return
 * @returns Array of attendance records
 */
export async function getUserAttendance(userId: string, limitCount: number = 30): Promise<AttendanceRecord[]> {
  const attendanceRef = collection(db, 'attendance');
  const q = query(
    attendanceRef,
    where('userId', '==', userId),
    orderBy('date', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
}

// ═══════════════════════════════════════════════════════════════════════════
// 📢 NOTICES COLLECTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Gets all notices.
 * Sorted by creation date, newest first.
 * 
 * @returns Array of notices
 */
export async function getAllNotices(): Promise<NoticeData[]> {
  const noticesRef = collection(db, 'notices');
  const q = query(noticesRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  
  const notices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NoticeData));
  
  // Fetch creator names
  for (const notice of notices) {
    const creator = await getUserById(notice.createdBy);
    notice.creatorName = creator?.fullName || 'Admin';
  }
  
  return notices;
}

/**
 * Creates a new notice.
 * 
 * @param data - Notice data
 * @returns Created notice ID
 */
export async function createNotice(data: Omit<NoticeData, 'id'>): Promise<string> {
  const noticesRef = collection(db, 'notices');
  const docRef = await addDoc(noticesRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  return docRef.id;
}

/**
 * Updates a notice.
 * 
 * @param noticeId - Notice ID
 * @param data - Data to update
 */
export async function updateNotice(noticeId: string, data: Partial<NoticeData>): Promise<void> {
  const noticeRef = doc(db, 'notices', noticeId);
  await updateDoc(noticeRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Deletes a notice.
 * 
 * @param noticeId - Notice ID to delete
 */
export async function deleteNotice(noticeId: string): Promise<void> {
  const noticeRef = doc(db, 'notices', noticeId);
  await deleteDoc(noticeRef);
}

/**
 * Sets up real-time listener for notices.
 * 
 * @param callback - Function to call when notices change
 * @returns Unsubscribe function
 */
export function subscribeToNotices(callback: (notices: NoticeData[]) => void): () => void {
  const noticesRef = collection(db, 'notices');
  const q = query(noticesRef, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const notices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NoticeData));
    callback(notices);
  });
}
