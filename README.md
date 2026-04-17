# Torcia School & Academic System - PWA

A full-stack, free-to-host Academic Management System built as a Progressive Web App (PWA). Centralized platform for school communication, resource sharing, and student management.

## Features

### Core Features
- **Google OAuth Authentication** - Secure login with Google accounts
- **Role-Based Access Control** - Admin, Teacher, and Student roles
- **Real-time Chat System** - Class-wise chat with Firebase Realtime
- **Resource Sharing** - Share images, PDFs, and YouTube videos
- **Attendance Tracking** - Daily attendance for teachers
- **Notice Board** - Global announcements with priority levels
- **Google Drive Integration** - Save PDFs, images, and videos to student Google Drive

### PWA Capabilities
- **Add to Home Screen** - Install as a native app
- **Offline Support** - Service Worker caching
- **Responsive Design** - Works on mobile, tablet, and desktop

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database & Auth**: Firebase (Firestore + Realtime Database)
- **File Storage**: Cloudinary + Google Drive API
- **Styling**: Tailwind CSS + Shadcn UI
- **Hosting**: Vercel (zero-config)
- **PWA**: next-pwa

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
- Firebase configuration
- Cloudinary credentials
- Google OAuth credentials
- App URL

### 3. Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication (Google + Email)
4. Create Firestore Database
5. Enable Realtime Database
6. Copy configuration to `.env.local`

### 4. Set Up Cloudinary

1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Create an unsigned upload preset
3. Add cloud name and preset to `.env.local`

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy with automatic builds

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── chat/              # Chat pages
│   ├── dashboard/         # Main dashboard
│   ├── attendance/        # Attendance tracking
│   ├── notices/           # Notice board
│   ├── resources/         # Student resources
│   ├── admin/             # Admin dashboard
│   └── setup-admin/       # Admin setup
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   ├── auth/             # Auth components
│   ├── chat/             # Chat components
│   └── layout/           # Layout components
├── lib/                   # Utilities
│   ├── firebase/         # Firebase clients
│   └── utils.ts          # Helper functions
├── public/               # Static assets
└── docs/                 # Setup documentation
```

## User Roles

### Admin
- Full access to all features
- Manage users and roles
- Create/edit classes
- View all statistics
- Maximum 5 admins allowed

### Teacher
- View assigned classes
- Manage class members
- Mark attendance
- Create notices

### Student
- View enrolled class chat
- Access shared resources
- View notices

## Documentation

See `docs/` folder for detailed setup guides:
- `google-drive-setup-urdu.md` - Google Drive API setup (Urdu)

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Lint code
npm run typecheck # TypeScript check
```

## License

MIT

---

Built with Next.js, Firebase, Cloudinary, and Tailwind CSS
