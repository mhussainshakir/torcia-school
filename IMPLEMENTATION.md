# Academy Connect - Firebase Implementation Guide

## Complete Step-by-Step Setup Guide

This guide provides comprehensive instructions for setting up **Academy Connect** using **Firebase + Cloudinary** (completely FREE stack).

---

## 📋 Table of Contents

1. [FREE Stack Overview](#free-stack-overview)
2. [Firebase Setup](#firebase-setup)
3. [Cloudinary Setup](#cloudinary-setup)
4. [Project Installation](#project-installation)
5. [Environment Configuration](#environment-configuration)
6. [Database Rules](#database-rules)
7. [Admin Setup](#admin-setup)
8. [Deployment to Vercel](#deployment-to-vercel)
9. [Features Overview](#features-overview)
10. [Troubleshooting](#troubleshooting)

---

## 🔥 FREE Stack Overview

| Service | Purpose | FREE Tier Limits |
|---------|---------|------------------|
| **Firebase Auth** | User authentication | 10,000 installations/month |
| **Firestore** | Database | 1GB storage, 50K reads/day |
| **Realtime Database** | Chat messages | 100 concurrent connections, 1GB storage |
| **Firebase Storage** | Images/Avatars | 5GB storage |
| **Cloudinary** | PDFs & Videos | 25GB bandwidth/month |
| **Google Drive API** | Student files | 15GB per student (FREE) |
| **Vercel** | Hosting | 100GB bandwidth/month |

**Total Monthly Cost: $0** ✅

---

## 🔥 Firebase Setup

### Step 1: Create Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"**
3. Enter project name: **"Academy Connect"**
4. Disable Google Analytics (to keep it free)
5. Click **"Create project"**

### Step 2: Register Web App

1. In Firebase Console, click the **gear icon** → **Project Settings**
2. Scroll down to **"Your apps"** section
3. Click **"</>"** (Web app)
4. Register app with nickname: **"Academy Connect Web"**
5. **Don't** check "Firebase Hosting" yet
6. Click **"Register app"**
7. Copy the **firebaseConfig** object (you'll need this later)

### Step 3: Enable Authentication

1. In Firebase Console, go to **Authentication** → **Get started**
2. Enable **Google** provider:
   - Click on **Google**
   - Toggle **Enable**
   - Enter your **support email**
   - Click **Save**
3. Enable **Email/Password** provider:
   - Click **Email/Password**
   - Toggle **Enable** for both Email and Password
   - Click **Save**

### Step 4: Create Firestore Database

1. Go to **Firestore Database** → **Create database**
2. Choose **Start in production mode** (more secure)
3. Select a location (nearest to you)
4. Click **Enable**

### Step 5: Create Realtime Database

1. Go to **Realtime Database** → **Create Database**
2. Choose **Start in test mode** (for now)
3. Select same location as Firestore
4. Click **Enable**

### Step 6: Enable Storage (Optional - for avatars)

1. Go to **Storage** → **Get started**
2. Choose **Start in production mode**
3. Select same location
4. Click **Enable**

---

## ☁️ Cloudinary Setup

### Step 1: Create Cloudinary Account

1. Go to [cloudinary.com](https://cloudinary.com)
2. Click **Sign Up Free**
3. Choose **Free Plan**
4. Sign up with Google or email

### Step 2: Create Upload Preset

1. In Cloudinary Dashboard, go to **Settings** → **Upload**
2. Scroll to **Upload presets**
3. Click **Add upload preset**
4. Configure:
   - **Name**: `torcia` (or your choice)
   - **Signing Mode**: **Unsigned** ✅
   - **Folder**: `academy-connect`
5. Click **Save**

### Step 3: Get Cloudinary Credentials

From Dashboard → Account Details:
- **Cloud Name**: (e.g., `dc9kzp20`)
- **API Key**: (for server-side deletes)
- **API Secret**: (keep secret!)

---

## 🗄️ Database Rules

### Firestore Rules (Copy & Paste)

Go to **Firestore** → **Rules** and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    
    function getUserRole() {
      return getUserData().role;
    }
    
    function isAdmin() {
      return isAuthenticated() && getUserRole() == 'admin';
    }
    
    function isTeacher() {
      return isAuthenticated() && getUserRole() == 'teacher';
    }
    
    function isAdminOrTeacher() {
      return isAuthenticated() && (getUserRole() == 'admin' || getUserRole() == 'teacher');
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && (request.auth.uid == userId || isAdmin());
    }
    
    // Admins collection
    match /admins/{userId} {
      allow read: if isAuthenticated();
      allow create, delete: if isAdmin();
    }
    
    // Teachers collection
    match /teachers/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    // Classes collection
    match /classes/{classId} {
      allow read: if isAuthenticated();
      allow write: if isAdminOrTeacher();
    }
    
    // Attendance collection
    match /attendance/{recordId} {
      allow read: if isAdminOrTeacher();
      allow write: if isAdminOrTeacher();
    }
    
    // Notices collection
    match /notices/{noticeId} {
      allow read: if isAuthenticated();
      allow write: if isAdminOrTeacher();
    }
    
  }
}
```

### Realtime Database Rules

Go to **Realtime Database** → **Rules** and paste:

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    
    "classes": {
      "$classId": {
        ".read": "auth != null",
        ".write": "auth != null",
        
        "messages": {
          ".read": "auth != null",
          ".write": "auth != null"
        }
      }
    }
  }
}
```

---

## 📦 Project Installation

### Step 1: Install Dependencies

```bash
# Install Firebase SDK
npm install firebase

# Install other dependencies
npm install
```

### Step 2: Environment Variables

Create `.env.local` file:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.region.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=torcia
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Academy Connect
```

### Step 3: Run Development Server

```bash
npm run dev
```

---

## 👑 Admin Setup

### First-Time Admin Creation

1. Open browser and go to: `http://localhost:3000/setup-admin`
2. Sign in with Google or create email account
3. Click **"Make Me Admin"**
4. You'll be redirected to `/admin` dashboard

### Admin Dashboard Access

- **URL**: `/admin` (hidden page, only for admins)
- **Access**: Only users in `admins` collection can access

### Creating More Admins

1. Go to `/admin`
2. Find user in **Users** tab
3. Change role to **Admin**
4. Maximum 5 admins allowed

---

## 🌐 Deployment to Vercel

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit - Academy Connect with Firebase"
git branch -M main
git remote add origin https://github.com/yourusername/academy-connect.git
git push -u origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Import your GitHub repository
4. Vercel will auto-detect Next.js

### Step 3: Add Environment Variables

In Vercel project settings:

1. Go to **Environment Variables**
2. Add all variables from `.env.local`
3. Click **Save**

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for build to complete
3. Your app is live at `https://your-project.vercel.app`

### Step 5: Update Firebase Console

Add your Vercel URL to **Authorized domains**:

1. Firebase Console → **Authentication** → **Settings**
2. Add to **Authorized domains**:
   - `your-project.vercel.app`

---

## 📱 Application URLs

| Page | URL | Purpose |
|------|-----|---------|
| Home | `/` | Landing page |
| Login | `/login` | User login |
| Register | `/register` | User registration |
| Dashboard | `/dashboard` | Main user dashboard |
| Chat | `/chat/[classId]` | Class chat room |
| Admin Setup | `/setup-admin` | One-time admin creation (hidden) |
| Admin Panel | `/admin` | Secret admin dashboard |

---

## 🔑 Firebase Collections Structure

```
Firestore:
├── users/{userId}
│   ├── email: string
│   ├── fullName: string
│   ├── role: "admin" | "teacher" | "student"
│   ├── avatarUrl: string
│   ├── googleDriveLink: string
│   ├── classes: string[]
│   └── createdAt: timestamp
│
├── admins/{userId}
│   ├── userId: string
│   ├── email: string
│   └── createdAt: timestamp
│
├── teachers/{userId}
│   ├── userId: string
│   ├── email: string
│   └── createdAt: timestamp
│
├── classes/{classId}
│   ├── name: string
│   ├── description: string
│   ├── teacherId: string
│   ├── members: string[]
│   └── createdAt: timestamp
│
├── attendance/{recordId}
│   ├── classId: string
│   ├── userId: string
│   ├── date: string
│   ├── status: "present" | "absent"
│   └── markedBy: string
│
└── notices/{noticeId}
    ├── title: string
    ├── content: string
    ├── priority: "normal" | "urgent"
    ├── createdBy: string
    └── createdAt: timestamp

Realtime Database:
└── classes/{classId}/messages/{messageId}
    ├── senderId: string
    ├── senderName: string
    ├── senderRole: string
    ├── content: string
    ├── type: "text" | "image" | "pdf" | "video"
    ├── fileUrl: string
    └── createdAt: timestamp
```

---

## 🎯 Features Overview

### ✅ Implemented Features

1. **Authentication**
   - Google Sign-In
   - Email/Password Sign-In
   - Session management
   - Role-based access

2. **User Management**
   - User registration with Drive link
   - Role management (Admin/Teacher/Student)
   - User profile with avatar

3. **Class Management**
   - Create/Edit/Delete classes
   - Assign teachers to classes
   - Add/Remove students from classes

4. **Chat System**
   - Real-time messaging
   - Image uploads
   - PDF sharing
   - YouTube video embeds
   - Message history

5. **Attendance**
   - Daily attendance marking
   - Present/Absent toggle
   - Attendance history

6. **Notice Board**
   - Create notices
   - Urgent/Normal priority
   - Notice management

7. **Admin Dashboard**
   - Hidden `/admin` page
   - User management
   - Class management
   - Notice management
   - Statistics

8. **PWA Features**
   - Add to Home Screen
   - Offline support
   - Responsive design

---

## ❓ Troubleshooting

### Common Issues

#### 1. "Auth not enabled"
**Solution**: Enable Google and Email/Password in Firebase Console → Authentication → Sign-in method

#### 2. "Permission denied" error
**Solution**: Update Firestore rules as shown above

#### 3. "Firebase not initialized"
**Solution**: Check environment variables are correctly set in `.env.local`

#### 4. "Upload failed"
**Solution**: 
- Check Cloudinary upload preset is set to **Unsigned**
- Verify Cloud Name is correct

#### 5. "Admin access denied"
**Solution**: 
- Go to `/setup-admin` to create first admin
- Or manually add user to `admins` collection in Firestore

---

## 📞 Need Help?

If you encounter any issues:

1. Check Firebase Console for errors
2. Check browser console for JavaScript errors
3. Verify all environment variables are set
4. Check Firestore/Realtime Database rules

---

**Happy Coding! 🎓**
