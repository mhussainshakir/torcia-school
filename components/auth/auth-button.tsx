"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

/**
 * Google OAuth login button component.
 * Initiates Google OAuth flow via Supabase Auth.
 * Handles loading state during authentication.
 */
export function AuthButton() {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: "email profile https://www.googleapis.com/auth/drive.file",
        },
      });
      if (error) {
        console.error("Auth error:", error.message);
      }
    } catch (error) {
      console.error("Auth error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSignIn}
      disabled={isLoading}
      className="w-full"
      size="lg"
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Signing in...
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Continue with Google
        </span>
      )}
    </Button>
  );
}