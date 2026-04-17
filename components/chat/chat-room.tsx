"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { cn, getInitials, formatRelativeTime, isValidYoutubeUrl, getYoutubeVideoId } from "@/lib/utils";
import { Send, Image, FileText, Youtube, Loader2, X } from "lucide-react";
import Image from "next/image";
import type { Class, Message, Profile, MessageType } from "@/lib/supabase/types";

interface ChatRoomProps {
  classInfo: Class;
  messages: Message[];
  currentUser: Profile | null;
}

/**
 * Real-time chat room component.
 * Handles sending/receiving messages, file uploads, and YouTube embeds.
 * Uses Supabase Realtime for live updates.
 * 
 * @param classInfo - The class this chat belongs to
 * @param messages - Initial messages to display
 * @param currentUser - The current user
 */
export function ChatRoom({ classInfo, messages: initialMessages, currentUser }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Subscribe to real-time messages
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${classInfo.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `class_id=eq.${classInfo.id}`,
        },
        async (payload) => {
          // Fetch sender info for new message
          const { data: senderData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", payload.new.sender_id)
            .single();

          const newMessage: Message = {
            ...payload.new as any,
            sender: senderData ? {
              id: senderData.id,
              email: senderData.email,
              full_name: senderData.full_name,
              avatar_url: senderData.avatar_url,
              role: senderData.role,
              google_drive_link: senderData.google_drive_link,
              created_at: senderData.created_at,
              updated_at: senderData.updated_at,
            } : undefined,
          };

          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [classInfo.id, supabase]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from("messages").insert({
        class_id: classInfo.id,
        sender_id: currentUser.id,
        content: newMessage.trim(),
        message_type: "text",
      });

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "pdf") => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setIsUploading(true);
    try {
      // Upload to Supabase Storage
      const fileName = `${classInfo.id}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("chat-files")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("chat-files")
        .getPublicUrl(fileName);

      // Send message with file
      await supabase.from("messages").insert({
        class_id: classInfo.id,
        sender_id: currentUser.id,
        content: file.name,
        message_type: type,
        file_url: publicUrl,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSendYoutubeLink = async () => {
    if (!isValidYoutubeUrl(newMessage) || !currentUser) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from("messages").insert({
        class_id: classInfo.id,
        sender_id: currentUser.id,
        content: newMessage.trim(),
        message_type: "video",
      });

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      console.error("Error sending YouTube link:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getYoutubeThumbnail = (url: string) => {
    const videoId = getYoutubeVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
  };

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">
      {/* Chat Header */}
      <div className="border-b px-6 py-4">
        <h1 className="text-xl font-bold">{classInfo.name}</h1>
        <p className="text-sm text-muted-foreground">
          {classInfo.description || "Class chat"}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {messages.map((message) => {
            const isOwn = message.sender_id === currentUser?.id;
            const isYoutube = message.message_type === "video" && isValidYoutubeUrl(message.content);
            const thumbnail = isYoutube ? getYoutubeThumbnail(message.content) : null;

            return (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  isOwn ? "flex-row-reverse" : "flex-row"
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={message.sender?.avatar_url || ""} />
                  <AvatarFallback>
                    {getInitials(message.sender?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    "max-w-[70%] rounded-lg px-4 py-2",
                    isOwn
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {!isOwn && (
                    <p className="text-xs font-medium opacity-70">
                      {message.sender?.full_name}
                    </p>
                  )}

                  {/* YouTube Embed */}
                  {thumbnail && (
                    <div className="mt-2">
                      <a
                        href={message.content}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Image
                          src={thumbnail}
                          alt={message.content}
                          width={320}
                          height={180}
                          className="rounded-lg"
                        />
                      </a>
                    </div>
                  )}

                  {/* Image */}
                  {message.message_type === "image" && message.file_url && (
                    <Image
                      src={message.file_url}
                      alt={message.content}
                      width={300}
                      height={200}
                      className="rounded-lg object-cover"
                    />
                  )}

                  {/* PDF Link */}
                  {message.message_type === "pdf" && message.file_url && (
                    <a
                      href={message.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-400 hover:underline"
                    >
                      <FileText className="h-4 w-4" />
                      {message.content}
                    </a>
                  )}

                  {/* Text */}
                  {message.message_type === "text" && (
                    <p>{message.content}</p>
                  )}

                  <p
                    className={cn(
                      "mt-1 text-xs opacity-50",
                      isOwn ? "text-right" : ""
                    )}
                  >
                    {formatRelativeTime(message.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*,.pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const type = file.type.startsWith("image/") ? "image" : "pdf";
                handleFileUpload(e as any, type);
              }
            }}
          />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Image className="h-4 w-4" />
                <span className="sr-only">Upload image</span>
              </>
            )}
          </Button>

          {isValidYoutubeUrl(newMessage) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSendYoutubeLink}
              disabled={isLoading}
            >
              <Youtube className="h-4 w-4" />
            </Button>
          )}

          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type a message..."
            disabled={isLoading}
          />

          <Button
            onClick={handleSendMessage}
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