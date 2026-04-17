/**
 * Firebase Realtime Database Service
 * 
 * Handles all Realtime Database operations for:
 * - Class chat messages (real-time sync)
 * - Message listeners
 */

import {
  ref,
  push,
  set,
  update,
  remove,
  onValue,
  off,
  query,
  orderByChild,
  limitToLast,
  serverTimestamp,
  DataSnapshot,
} from 'firebase/database';
import { database } from './config';

// Type definitions
export interface MessageData {
  id?: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  type: 'text' | 'image' | 'pdf' | 'video';
  fileUrl?: string;
  cloudinaryPublicId?: string;
  createdAt: number;
  updatedAt?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// 💬 MESSAGES COLLECTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Gets database reference for a class's messages.
 * 
 * @param classId - Class ID
 * @returns Database reference
 */
function getClassMessagesRef(classId: string) {
  return ref(database, `classes/${classId}/messages`);
}

/**
 * Sends a text message to a class chat.
 * 
 * @param classId - Class ID
 * @param senderId - Sender user ID
 * @param senderName - Sender display name
 * @param senderRole - Sender role
 * @param content - Message text content
 * @returns Promise with message ID
 */
export async function sendTextMessage(
  classId: string,
  senderId: string,
  senderName: string,
  senderRole: string,
  content: string
): Promise<string> {
  const messagesRef = getClassMessagesRef(classId);
  const newMessageRef = push(messagesRef);
  
  await set(newMessageRef, {
    senderId,
    senderName,
    senderRole,
    content,
    type: 'text',
    createdAt: serverTimestamp(),
  });
  
  return newMessageRef.key!;
}

/**
 * Sends a file message (image/PDF) to a class chat.
 * 
 * @param classId - Class ID
 * @param senderId - Sender user ID
 * @param senderName - Sender display name
 * @param senderRole - Sender role
 * @param content - File name or description
 * @param type - Message type ('image' | 'pdf')
 * @param fileUrl - Cloudinary file URL
 * @param cloudinaryPublicId - Cloudinary public ID
 * @returns Promise with message ID
 */
export async function sendFileMessage(
  classId: string,
  senderId: string,
  senderName: string,
  senderRole: string,
  content: string,
  type: 'image' | 'pdf',
  fileUrl: string,
  cloudinaryPublicId?: string
): Promise<string> {
  const messagesRef = getClassMessagesRef(classId);
  const newMessageRef = push(messagesRef);
  
  await set(newMessageRef, {
    senderId,
    senderName,
    senderRole,
    content,
    type,
    fileUrl,
    cloudinaryPublicId,
    createdAt: serverTimestamp(),
  });
  
  return newMessageRef.key!;
}

/**
 * Sends a video message (YouTube embed).
 * 
 * @param classId - Class ID
 * @param senderId - Sender user ID
 * @param senderName - Sender display name
 * @param senderRole - Sender role
 * @param videoUrl - YouTube video URL
 * @returns Promise with message ID
 */
export async function sendVideoMessage(
  classId: string,
  senderId: string,
  senderName: string,
  senderRole: string,
  videoUrl: string
): Promise<string> {
  const messagesRef = getClassMessagesRef(classId);
  const newMessageRef = push(messagesRef);
  
  await set(newMessageRef, {
    senderId,
    senderName,
    senderRole,
    content: videoUrl,
    type: 'video',
    fileUrl: videoUrl,
    createdAt: serverTimestamp(),
  });
  
  return newMessageRef.key!;
}

/**
 * Deletes a message from a class chat.
 * 
 * @param classId - Class ID
 * @param messageId - Message ID to delete
 */
export async function deleteMessage(classId: string, messageId: string): Promise<void> {
  const messageRef = ref(database, `classes/${classId}/messages/${messageId}`);
  await remove(messageRef);
}

/**
 * Subscribes to real-time messages for a class.
 * Automatically updates when new messages are added.
 * 
 * @param classId - Class ID
 * @param callback - Function to call when messages change
 * @param messageLimit - Maximum messages to load (default: 100)
 * @returns Unsubscribe function
 */
export function subscribeToMessages(
  classId: string,
  callback: (messages: MessageData[]) => void,
  messageLimit: number = 100
): () => void {
  const messagesRef = getClassMessagesRef(classId);
  const messagesQuery = query(
    messagesRef,
    orderByChild('createdAt'),
    limitToLast(messageLimit)
  );
  
  const handleSnapshot = (snapshot: DataSnapshot) => {
    const messages: MessageData[] = [];
    
    snapshot.forEach((childSnapshot) => {
      const message = {
        id: childSnapshot.key,
        ...childSnapshot.val(),
      };
      messages.push(message as MessageData);
    });
    
    // Sort by creation time (oldest first)
    messages.sort((a, b) => a.createdAt - b.createdAt);
    
    callback(messages);
  };
  
  onValue(messagesQuery, handleSnapshot);
  
  // Return unsubscribe function
  return () => {
    off(messagesQuery);
  };
}

/**
 * Gets recent messages for a class (one-time fetch).
 * 
 * @param classId - Class ID
 * @param messageLimit - Maximum messages to fetch (default: 50)
 * @returns Array of messages
 */
export async function getRecentMessages(
  classId: string,
  messageLimit: number = 50
): Promise<MessageData[]> {
  const messagesRef = getClassMessagesRef(classId);
  const messagesQuery = query(
    messagesRef,
    orderByChild('createdAt'),
    limitToLast(messageLimit)
  );
  
  const snapshot = await new Promise<DataSnapshot>((resolve) => {
    onValue(messagesQuery, resolve, { onlyOnce: true });
  });
  
  const messages: MessageData[] = [];
  
  snapshot.forEach((childSnapshot) => {
    const message = {
      id: childSnapshot.key,
      ...childSnapshot.val(),
    };
    messages.push(message as MessageData);
  });
  
  // Sort by creation time (oldest first)
  messages.sort((a, b) => a.createdAt - b.createdAt);
  
  return messages;
}

/**
 * Searches messages in a class.
 * 
 * @param classId - Class ID
 * @param searchTerm - Search term to look for
 * @returns Array of matching messages
 */
export async function searchMessages(
  classId: string,
  searchTerm: string
): Promise<MessageData[]> {
  const messages = await getRecentMessages(classId, 500); // Get more messages for search
  
  const lowerSearch = searchTerm.toLowerCase();
  
  return messages.filter(message => 
    message.content.toLowerCase().includes(lowerSearch) &&
    message.type === 'text'
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 📊 UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Formats message timestamp to readable format.
 * 
 * @param timestamp - Firebase server timestamp
 * @returns Formatted date string
 */
export function formatMessageTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Extracts YouTube video ID from various URL formats.
 * 
 * @param url - YouTube URL
 * @returns Video ID or null
 */
export function extractYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

/**
 * Checks if a string is a valid YouTube URL.
 * 
 * @param url - URL to check
 * @returns true if valid YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
  const regExp = /^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/;
  return regExp.test(url);
}

/**
 * Gets YouTube thumbnail URL.
 * 
 * @param videoId - YouTube video ID
 * @returns Thumbnail image URL
 */
export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}
