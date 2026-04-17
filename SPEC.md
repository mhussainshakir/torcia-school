# Academy Connect - Academic Management System PWA

## Project Overview
- **Project Name**: Academy Connect
- **Type**: Progressive Web App (PWA)
- **Core Functionality**: Centralized platform for academy communication, resource sharing, and student management
- **Target Users**: Academy admins, teachers, and students

## Technical Stack
- **Framework**: Next.js 14 (App Router)
- **Database & Auth**: Supabase (PostgreSQL + Auth)
- **Storage**: Supabase Storage (UI assets)
- **Styling**: Tailwind CSS + Shadcn UI
- **Hosting**: Vercel (zero-config)

## UI/UX Specification

### Color Palette
- **Primary**: `#3B82F6` (Blue-500)
- **Primary Dark**: `#1E40AF` (Blue-800)
- **Secondary**: `#10B981` (Emerald-500)
- **Accent**: `#F59E0B` (Amber-500)
- **Background Light**: `#FAFAFA` (Neutral-50)
- **Background Dark**: `#0F172A` (Slate-900)
- **Surface Light**: `#FFFFFF`
- **Surface Dark**: `#1E293B` (Slate-800)
- **Text Primary Light**: `#0F172A` (Slate-900)
- **Text Primary Dark**: `#F8FAFC` (Slate-50)
- **Text Secondary**: `#64748B` (Slate-500)
- **Error**: `#EF4444` (Red-500)
- **Success**: `#22C55E` (Green-500)

### Typography
- **Font Family**: `Inter`, sans-serif (from Google Fonts)
- **Heading 1**: 32px, font-weight 700
- **Heading 2**: 24px, font-weight 600
- **Heading 3**: 20px, font-weight 600
- **Body**: 16px, font-weight 400
- **Small**: 14px, font-weight 400
- **Caption**: 12px, font-weight 500

### Spacing System
- **Base unit**: 4px
- **XS**: 4px
- **SM**: 8px
- **MD**: 16px
- **LG**: 24px
- **XL**: 32px
- **2XL**: 48px

### Responsive Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Layout Structure
- **Sidebar**: 280px fixed width on desktop, collapsible drawer on mobile
- **Main Content**: Fluid width, max-width 1280px centered
- **Cards**: 16px padding, 8px border-radius, subtle shadow
- **Header**: 64px height, sticky

## Database Schema

### Tables

#### `users` (extends Supabase auth.users)
```
id: uuid PRIMARY KEY
email: text UNIQUE NOT NULL
full_name: text
avatar_url: text
role: enum ('admin', 'teacher', 'student')
google_drive_link: text
created_at: timestamptz DEFAULT now()
updated_at: timestamptz DEFAULT now()
```

#### `classes`
```
id: uuid PRIMARY KEY
name: text NOT NULL (e.g., "Class 9", "Class 10")
description: text
teacher_id: uuid REFERENCES users(id)
created_at: timestamptz DEFAULT now()
```

#### `class_members`
```
id: uuid PRIMARY KEY
class_id: uuid REFERENCES classes(id)
user_id: uuid REFERENCES users(id)
joined_at: timestamptz DEFAULT now()
```

#### `messages`
```
id: uuid PRIMARY KEY
class_id: uuid REFERENCES classes(id)
sender_id: uuid REFERENCES users(id)
content: text
message_type: enum ('text', 'image', 'pdf', 'video')
file_url: text
created_at: timestamptz DEFAULT now()
```

#### `attendance`
```
id: uuid PRIMARY KEY
class_id: uuid REFERENCES classes(id)
user_id: uuid REFERENCES users(id)
date: date NOT NULL
status: enum ('present', 'absent')
marked_by: uuid REFERENCES users(id)
created_at: timestamptz DEFAULT now()
```

#### `notices`
```
id: uuid PRIMARY KEY
title: text NOT NULL
content: text
priority: enum ('normal', 'urgent')
created_by: uuid REFERENCES users(id)
created_at: timestamptz DEFAULT now()
```

## Functionality Specification

### 1. Authentication & Onboarding
- Google OAuth login via Supabase Auth
- Role selection during signup (Admin/Teacher/Student)
- Drive folder link capture for students
- Session management with JWT

### 2. Chat System
- Class-wise chat sections
- Real-time message updates via Supabase Realtime
- Image uploads (stored in Supabase Storage)
- PDF sharing with download links
- YouTube video embeds (parse URLs to embed)
- Message timestamps and sender info

### 3. Dashboards
**Admin Panel**:
- View all users and classes
- Create/edit classes
- Assign teachers to classes
- System statistics

**Teacher Panel**:
- View assigned class members
- Access student Drive links
- Mark attendance
- Remove students from class

**Student Panel**:
- View class chat
- Upload/view resources
- Access class materials

### 4. PWA Features
- Custom app icon (configurable)
- Add to Home Screen prompt
- Service Worker for offline caching
- Manifest.json for installability
- Push notification support (optional)

### 5. Bonus Features
- Attendance tracker (daily toggle)
- Notice board (global announcements)
- Dark/Light mode toggle
- Searchable message archives

## Component Structure

### /components
- `ui/` - Shadcn UI components
- `auth/` - Auth-related components
- `chat/` - Chat components
- `dashboard/` - Dashboard components
- `layout/` - Layout components

### /app (Next.js App Router)
- `/` - Landing/Login
- `/dashboard` - Role-based dashboard
- `/chat/[classId]` - Class chat
- `/classes` - Class management
- `/attendance` - Attendance tracking
- `/notices` - Notice board

## API Routes

### Auth
- `POST /api/auth/callback` - OAuth callback handler

### Chat
- `GET /api/messages/[classId]` - Get class messages
- `POST /api/messages` - Send message

### Classes
- `GET /api/classes` - List classes
- `POST /api/classes` - Create class

### Users
- `GET /api/users` - List users
- `PATCH /api/users/[id]` - Update user

## Environment Variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Deployment

### Vercel Zero-Config
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy with automatic builds

### Google Cloud Console Setup
1. Create Google Cloud project
2. Enable Google+ API and Drive API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URIs for Supabase

## Implementation Status

All features from the SPEC have been implemented:

- ✅ Authentication with Google OAuth
- ✅ Role-Based Access Control (Admin, Teacher, Student)
- ✅ Real-time Chat System with Supabase Realtime
- ✅ Resource Sharing (Images, PDFs, YouTube embeds)
- ✅ Attendance Tracking
- ✅ Notice Board with priority levels
- ✅ Student Drive link capture
- ✅ PWA Manifest and offline support
- ✅ Dark/Light mode
- ✅ Responsive design
- ✅ Class management
- ✅ User management
- ✅ Dashboard with statistics

See IMPLEMENTATION.md for detailed setup instructions.