"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, MessageSquare, Users, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative flex min-h-[60vh] flex-col items-center justify-center overflow-hidden px-4 text-center">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/20 to-background" />
        
        <div className="flex flex-col items-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
            <GraduationCap className="h-10 w-10 text-primary" />
          </div>
          
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            Torcia School & Academic System
          </h1>
          
          <p className="max-w-2xl text-lg text-muted-foreground">
            The complete Academic Management System. Manage classes, communicate with students,
            share resources, and track attendance — all in one place.
          </p>
          
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link href="/login">
              <Button size="lg" className="gap-2">
                Get Started
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-24">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Everything You Need</h2>
          <p className="mt-4 text-muted-foreground">
            Powerful features for modern academic management
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <MessageSquare className="h-7 w-7 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Real-time Chat</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Class-wise chat sections with instant messaging
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <BookOpen className="h-7 w-7 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Resource Sharing</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Share PDFs, images, and video links easily
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Users className="h-7 w-7 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Student Management</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Full control over student accounts and classes
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Role-Based Access</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Secure access control for admins, teachers, students
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container">
          <div className="rounded-3xl bg-primary/5 px-6 py-16 text-center">
            <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
            <p className="mt-4 text-muted-foreground">
              Join thousands of schools already using Torcia
            </p>
            <div className="mt-8">
              <Link href="/login">
                <Button size="lg">Sign In with Google</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">Torcia School & Academic System</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 Torcia School & Academic System. Built with Next.js & Firebase.
          </p>
        </div>
      </footer>
    </div>
  );
}
