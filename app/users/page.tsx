"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * Users management page for admins.
 * Allows viewing all users and changing their roles.
 */
export default function UsersPage() {
  const router = useRouter();

  return (
    <div className="container py-8">
      <div className="text-center">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground mt-2">This feature is coming soon</p>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    </div>
  );
}
