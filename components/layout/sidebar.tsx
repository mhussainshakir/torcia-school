"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  Calendar,
  Bell,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Moon,
  Sun,
  Shield,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/firebase";

interface SidebarUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: string;
}

/**
 * Main sidebar navigation component.
 * Displays role-based navigation links and user info.
 * Collapsible on mobile devices.
 */
export function Sidebar({ user }: { user: SidebarUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { auth } = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  const role = user?.role || "student";
  const isAdmin = role === "admin";
  const isTeacher = role === "teacher";

  const adminLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/chat", label: "Chats", icon: MessageSquare },
    { href: "/attendance", label: "Attendance", icon: Calendar },
    { href: "/notices", label: "Notices", icon: Bell },
  ];

  const teacherLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/chat", label: "Chats", icon: MessageSquare },
    { href: "/attendance", label: "Attendance", icon: Calendar },
    { href: "/notices", label: "Notices", icon: Bell },
  ];

  const studentLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/chat", label: "My Class", icon: MessageSquare },
    { href: "/resources", label: "Resources", icon: BookOpen },
    { href: "/notices", label: "Notices", icon: Bell },
  ];

  const links = isAdmin || isTeacher
    ? [...adminLinks, ...(isAdmin ? [{ href: "/admin", label: "Admin Panel", icon: Shield }] : [])]
    : studentLinks;

  const handleSignOut = async () => {
    try {
      const { signOut } = await import('firebase/auth');
      await signOut(auth);
      router.push('/');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-full w-64 bg-white dark:bg-gray-800 border-r transition-transform md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-center border-b px-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">Torcia</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Theme Toggle */}
          <div className="border-t p-4">
            {mounted && (
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="mr-2 h-4 w-4" />
                    Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="mr-2 h-4 w-4" />
                    Dark Mode
                  </>
                )}
              </Button>
            )}
          </div>

          {/* User Info */}
          <div className="border-t p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.avatarUrl || ""} />
                <AvatarFallback>
                  {getInitials(user?.fullName || "User")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">
                  {user?.fullName || "User"}
                </p>
                <p className="truncate text-xs text-muted-foreground capitalize">
                  {role}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="shrink-0"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
