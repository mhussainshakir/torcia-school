"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Users, GraduationCap, Shield, Search, Loader2, Mail, ExternalLink, UserMinus } from "lucide-react";
import { getInitials, formatDate } from "@/lib/utils";

/**
 * User management component for admin panel.
 * Displays all users with role management capabilities.
 */
export function UserManagement() {
  const supabase = createClient();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newRole, setNewRole] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  /**
   * Fetches all users from the profiles table.
   */
  const fetchUsers = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) {
      setUsers(data);
    }
    setIsLoading(false);
  };

  /**
   * Updates a user's role in the database.
   * 
   * @param userId - ID of user to update
   * @param role - New role to assign
   */
  const handleUpdateRole = async (userId: string, role: string) => {
    setIsUpdating(true);
    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", userId);

    if (!error) {
      fetchUsers();
      setEditingUser(null);
    }
    setIsUpdating(false);
  };

  /**
   * Removes a user from the database.
   * Also removes them from all classes.
   * 
   * @param userId - ID of user to remove
   */
  const handleRemoveUser = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this user?")) return;

    await supabase.from("class_members").delete().eq("user_id", userId);
    await supabase.from("profiles").delete().eq("id", userId);
    fetchUsers();
  };

  /**
   * Filters users based on search query and role filter.
   */
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    teachers: users.filter((u) => u.role === "teacher").length,
    students: users.filter((u) => u.role === "student").length,
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground">
          Manage all academy users and their roles
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teachers</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teachers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.students}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="teacher">Teacher</SelectItem>
            <SelectItem value="student">Student</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.map((user) => (
          <Card key={user.id}>
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatar_url || ""} />
                  <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.full_name || "Unnamed"}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {user.email}
                  </div>
                  {user.google_drive_link && (
                    <a
                      href={user.google_drive_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Drive Folder
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">
                  Joined {formatDate(user.created_at)}
                </span>
                <Badge
                  variant={
                    user.role === "admin"
                      ? "default"
                      : user.role === "teacher"
                      ? "secondary"
                      : "outline"
                  }
                  className="capitalize"
                >
                  {user.role}
                </Badge>
                <Dialog open={editingUser?.id === user.id} onOpenChange={(open) => !open && setEditingUser(null)}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingUser(user);
                      setNewRole(user.role);
                    }}
                  >
                    Change Role
                  </Button>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Role for {user.full_name || user.email}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <Select value={newRole} onValueChange={setNewRole}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select new role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="student">Student</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => handleUpdateRole(user.id, newRole)}
                        disabled={isUpdating || newRole === user.role}
                        className="w-full"
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Update Role"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveUser(user.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <UserMinus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No users found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter
          </p>
        </div>
      )}
    </div>
  );
}
