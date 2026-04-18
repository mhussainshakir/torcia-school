"use client";

import { useState, useEffect } from "react";
// import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Trash2, Plus, Loader2, MessageSquare, Users } from "lucide-react";

interface ClassListProps {
  userId: string;
}

/**
 * Class list component for admin management.
 * Allows creating, editing, and deleting classes.
 * Assigns teachers to classes.
 * 
 * @param userId - Current admin user ID
 */
export function ClassList({ userId }: ClassListProps) {
  // const supabase = createClient();
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassDescription, setNewClassDescription] = useState("");
  const [newClassTeacher, setNewClassTeacher] = useState("");

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  /**
   * Fetches all classes with teacher info from database.
   */
  const fetchClasses = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("classes")
      .select("*, teacher:profiles(full_name, email)")
      .order("name");
    
    if (data) {
      setClasses(data);
    }
    setIsLoading(false);
  };

  /**
   * Fetches all teachers from database.
   */
  const fetchTeachers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "teacher");
    
    if (data) {
      setTeachers(data);
    }
  };

  /**
   * Creates a new class in the database.
   */
  const handleCreateClass = async () => {
    if (!newClassName.trim()) return;

    setIsCreating(true);
    const { error } = await supabase.from("classes").insert({
      name: newClassName.trim(),
      description: newClassDescription.trim() || null,
      teacher_id: newClassTeacher || null,
    });

    if (!error) {
      setNewClassName("");
      setNewClassDescription("");
      setNewClassTeacher("");
      fetchClasses();
    }
    setIsCreating(false);
  };

  /**
   * Deletes a class from the database.
   * Also removes all class members and related data.
   * 
   * @param classId - ID of class to delete
   */
  const handleDeleteClass = async (classId: string) => {
    if (!confirm("Are you sure you want to delete this class?")) return;

    await supabase.from("class_members").delete().eq("class_id", classId);
    await supabase.from("messages").delete().eq("class_id", classId);
    await supabase.from("attendance").delete().eq("class_id", classId);
    await supabase.from("classes").delete().eq("id", classId);
    
    fetchClasses();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Classes</h1>
          <p className="text-muted-foreground">
            Manage academy classes and assign teachers
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Class
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Class</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Class Name</label>
                <Input
                  placeholder="e.g., Class 9, Entry Test Prep"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Brief description (optional)"
                  value={newClassDescription}
                  onChange={(e) => setNewClassDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Assign Teacher</label>
                <Select value={newClassTeacher} onValueChange={setNewClassTeacher}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.full_name || teacher.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleCreateClass}
                disabled={!newClassName.trim() || isCreating}
                className="w-full"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Class"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {classes.map((cls) => (
          <Card key={cls.id}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {cls.name}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteClass(cls.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {cls.description || "No description"}
              </p>
              {cls.teacher && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Teacher: {cls.teacher.full_name || cls.teacher.email}
                </p>
              )}
              <div className="mt-4 flex gap-2">
                <a
                  href={`/chat/${cls.id}`}
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Chat
                  </Button>
                </a>
                <a
                  href={`/classes/${cls.id}/members`}
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full">
                    <Users className="mr-2 h-4 w-4" />
                    Members
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {classes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No classes yet</h3>
          <p className="text-muted-foreground">
            Create your first class to get started
          </p>
        </div>
      )}
    </div>
  );
}
