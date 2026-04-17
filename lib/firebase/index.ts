/**
 * Firebase Library Index
 * 
 * Re-exports all Firebase services for easy imports throughout the app.
 * 
 * Usage:
 * import { auth, signInWithGoogle } from '@/lib/firebase';
 */

export { app, auth, db, database } from './config';
export type { FirebaseApp, Auth, Firestore, Database } from './config';

export {
  signInWithGoogle,
  signInWithEmail,
  registerWithEmail,
  signOut,
  getCurrentUser,
  onAuthChange,
  updateUserProfile,
  getUserProfile,
} from './auth';

export type { UserProfile, AdminProfile } from './auth';

export {
  getAllUsers,
  getUsersByRole,
  getUserById,
  updateUser,
  updateUserRole,
  deleteUser,
  addUserToClass,
  removeUserFromClass,
  getAdminCount,
  getAllAdminIds,
  isUserAdmin,
  makeUserAdmin,
  removeUserAsAdmin,
  isUserTeacher,
  makeUserTeacher,
  removeUserAsTeacher,
  getAllClasses,
  getClassById,
  getUserClasses,
  createClass,
  updateClass,
  deleteClass,
  addStudentToClass,
  removeStudentFromClass,
  getClassStudents,
  getAttendanceByDate,
  markAttendance,
  getUserAttendance,
  getAllNotices,
  createNotice,
  updateNotice,
  deleteNotice,
  subscribeToNotices,
} from './firestore';

export type {
  ClassData,
  AttendanceRecord,
  NoticeData,
  UserData,
} from './firestore';

export {
  sendTextMessage,
  sendFileMessage,
  sendVideoMessage,
  deleteMessage,
  subscribeToMessages,
  getRecentMessages,
  searchMessages,
  formatMessageTime,
  extractYouTubeId,
  isYouTubeUrl,
  getYouTubeThumbnail,
} from './realtime';

export type { MessageData, UploadProgress } from './realtime';

export {
  uploadToCloudinary,
  uploadImage,
  uploadPDF,
  uploadVideo,
  deleteFromCloudinary,
  getCloudinaryUrl,
  getChatImageUrl,
  getThumbnailUrl,
  validateFile,
} from './cloudinary';

export type { CloudinaryUploadResponse } from './cloudinary';
