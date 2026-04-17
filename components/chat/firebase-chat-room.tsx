/**
 * Firebase Chat Room Component
 * 
 * Real-time chat component using Firebase Realtime Database.
 * Supports text messages, image uploads, PDF sharing, and YouTube embeds.
 */

"use client";

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Send, Image, FileText, Loader2, ExternalLink, X } from 'lucide-react';
import Image from 'next/image';

interface ChatRoomProps {
  classId: string;
  className: string;
  classDescription?: string;
  currentUser: any;
}

interface Message {
  id?: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  type: 'text' | 'image' | 'pdf' | 'video';
  fileUrl?: string;
  createdAt: number;
}

export function FirebaseChatRoom({ classId, className, classDescription, currentUser }: ChatRoomProps) {
  const { database } = createClient();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'image' | 'pdf' | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Subscribe to real-time messages
    const { ref, onValue, query, orderByChild, limitToLast } = require('firebase/database');
    
    const messagesQuery = query(
      ref(database, `classes/${classId}/messages`),
      orderByChild('createdAt'),
      limitToLast(100)
    );

    const unsubscribe = onValue(messagesQuery, (snapshot: any) => {
      const msgs: Message[] = [];
      snapshot.forEach((childSnapshot: any) => {
        const message = {
          id: childSnapshot.key,
          ...childSnapshot.val(),
        };
        msgs.push(message as Message);
      });
      
      // Sort by creation time (oldest first)
      msgs.sort((a, b) => a.createdAt - b.createdAt);
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [classId, database]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Sends a text message
   */
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;

    setIsLoading(true);
    try {
      const { ref, push, set, serverTimestamp } = await import('firebase/database');
      
      const messagesRef = ref(database, `classes/${classId}/messages`);
      const newMessageRef = push(messagesRef);
      
      await set(newMessageRef, {
        senderId: currentUser.id || currentUser.uid,
        senderName: currentUser.fullName || currentUser.displayName || 'User',
        senderRole: currentUser.role || 'student',
        content: newMessage.trim(),
        type: 'text',
        createdAt: serverTimestamp(),
      });

      setNewMessage('');
    } catch (err) {
      console.error('Send message error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Uploads file to Cloudinary and sends message
   */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'pdf') => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setIsUploading(true);
    setUploadType(type);

    try {
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'torcia');
      formData.append('folder', `academy-connect/${classId}/${type}s`);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`,
        { method: 'POST', body: formData }
      );

      const data = await response.json();

      if (data.secure_url) {
        // Send message with file
        const { ref, push, set, serverTimestamp } = await import('firebase/database');
        
        const messagesRef = ref(database, `classes/${classId}/messages`);
        const newMessageRef = push(messagesRef);
        
        await set(newMessageRef, {
          senderId: currentUser.id || currentUser.uid,
          senderName: currentUser.fullName || currentUser.displayName || 'User',
          senderRole: currentUser.role || 'student',
          content: file.name,
          type: type,
          fileUrl: data.secure_url,
          cloudinaryPublicId: data.public_id,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload file');
    } finally {
      setIsUploading(false);
      setUploadType(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /**
   * Sends YouTube video link
   */
  const handleSendVideo = async () => {
    if (!isYouTubeUrl(newMessage) || !currentUser) return;

    setIsLoading(true);
    try {
      const { ref, push, set, serverTimestamp } = await import('firebase/database');
      
      const messagesRef = ref(database, `classes/${classId}/messages`);
      const newMessageRef = push(messagesRef);
      
      await set(newMessageRef, {
        senderId: currentUser.id || currentUser.uid,
        senderName: currentUser.fullName || currentUser.displayName || 'User',
        senderRole: currentUser.role || 'student',
        content: newMessage.trim(),
        type: 'video',
        fileUrl: newMessage.trim(),
        createdAt: serverTimestamp(),
      });

      setNewMessage('');
    } catch (err) {
      console.error('Send video error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Extracts YouTube video ID
   */
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  /**
   * Checks if URL is YouTube
   */
  const isYouTubeUrl = (url: string) => {
    return /^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/.test(url);
  };

  /**
   * Formats timestamp
   */
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Chat Header */}
      <div className="bg-white dark:bg-gray-800 border-b px-6 py-4">
        <h1 className="text-xl font-bold">{className}</h1>
        <p className="text-sm text-muted-foreground">
          {classDescription || 'Class chat room'}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => {
          const isOwn = message.senderId === (currentUser?.id || currentUser?.uid);
          const isYouTube = message.type === 'video' && isYouTubeUrl(message.content);
          const videoId = isYouTube ? getYouTubeId(message.content) : null;

          return (
            <div
              key={message.id}
              className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium shrink-0">
                {message.senderName?.[0]?.toUpperCase() || '?'}
              </div>

              {/* Message Content */}
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  isOwn
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}
              >
                {/* Sender Name (for others) */}
                {!isOwn && (
                  <p className="text-xs font-medium opacity-70 mb-1">
                    {message.senderName}
                  </p>
                )}

                {/* YouTube Video */}
                {isYouTube && videoId && (
                  <a 
                    href={message.content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-2"
                  >
                    <Image
                      src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                      alt="Video thumbnail"
                      width={320}
                      height={180}
                      className="rounded-lg w-full"
                    />
                    <p className="text-xs mt-1 opacity-70">Click to watch on YouTube</p>
                  </a>
                )}

                {/* Image */}
                {message.type === 'image' && message.fileUrl && (
                  <a href={message.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Image
                      src={message.fileUrl}
                      alt={message.content}
                      width={300}
                      height={200}
                      className="rounded-lg w-full object-cover"
                    />
                  </a>
                )}

                {/* PDF */}
                {message.type === 'pdf' && message.fileUrl && (
                  <a 
                    href={message.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded bg-white dark:bg-gray-700 mt-2"
                  >
                    <FileText className="h-6 w-6 text-red-500" />
                    <span className="text-sm">{message.content}</span>
                    <ExternalLink className="h-4 w-4 ml-auto" />
                  </a>
                )}

                {/* Text */}
                {message.type === 'text' && (
                  <p>{message.content}</p>
                )}

                {/* Timestamp */}
                <p className={`text-xs mt-1 opacity-50 ${
                  isOwn ? 'text-right' : ''
                }`}>
                  {message.createdAt ? formatTime(message.createdAt) : 'Sending...'}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white dark:bg-gray-800 border-t p-4">
        <div className="flex items-center gap-2">
          {/* Upload Image */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e, 'image')}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading && uploadType === 'image' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Image className="h-4 w-4" />
            )}
          </Button>

          {/* Upload PDF */}
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e, 'pdf')}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.pdf';
              input.onchange = (e: any) => {
                if (e.target.files?.[0]) {
                  handleFileUpload({ target: { files: e.target.files } } as any, 'pdf');
                }
              };
              input.click();
            }}
            disabled={isUploading}
          >
            {isUploading && uploadType === 'pdf' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
          </Button>

          {/* Message Input */}
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (isYouTubeUrl(newMessage)) {
                  handleSendVideo();
                } else {
                  handleSendMessage();
                }
              }
            }}
            placeholder={
              isYouTubeUrl(newMessage)
                ? 'YouTube link detected - press Enter to share'
                : 'Type a message...'
            }
            disabled={isLoading}
            className="flex-1"
          />

          {/* Send Button */}
          <Button
            onClick={() => {
              if (isYouTubeUrl(newMessage)) {
                handleSendVideo();
              } else {
                handleSendMessage();
              }
            }}
            disabled={isLoading || !newMessage.trim()}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
