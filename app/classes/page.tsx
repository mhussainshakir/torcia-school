import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Trash2, Plus } from "lucide-react";
import { toProfile, toClass } from "@/lib/utils";
import Link from "next/link";
import { ClassList } from "@/components/dashboard/class-list";

/**
 * Classes management page.
 * Admin and teacher view for managing class sections.
 */
export default async function ClassesPage() {
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
      <ClassList userId={user.id} />
    </div>
  );
}