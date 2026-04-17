import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Users, GraduationCap, Shield, UserPlus, Loader2, Search, Mail } from "lucide-react";
import { toProfile, getInitials, formatDate } from "@/lib/utils";
import { UserManagement } from "@/components/dashboard/user-management";

/**
 * Users management page for admins.
 * Allows viewing all users and changing their roles.
 */
export default async function UsersPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const userProfile = profile ? toProfile(profile) : null;

  if (userProfile?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="container py-8">
      <UserManagement />
    </div>
  );
}
