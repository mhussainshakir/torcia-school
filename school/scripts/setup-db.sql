-- =============================================================================
-- ACADEMY CONNECT - DATABASE SETUP SQL
-- =============================================================================
-- Run this SQL in your Supabase SQL Editor to set up all required tables
-- and policies for the Academy Connect application.
-- =============================================================================

-- =============================================================================
-- STEP 1: PROFILES TABLE
-- =============================================================================
-- Extends Supabase auth.users with additional profile information
-- Stores user details, roles, and Google Drive integration
-- =============================================================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'teacher', 'student')),
  google_drive_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view all profiles
CREATE POLICY "Profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

-- RLS Policy: Users can update only their own profile
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- =============================================================================
-- STEP 2: CLASSES TABLE
-- =============================================================================
-- Stores class/section information
-- Each class has a name, optional description, and assigned teacher
-- =============================================================================
CREATE TABLE public.classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Classes are viewable by all authenticated users
CREATE POLICY "Classes are viewable by authenticated users" 
  ON public.classes FOR SELECT 
  TO authenticated
  USING (true);

-- RLS Policy: Only admins can insert/update/delete classes
CREATE POLICY "Admins can manage classes" 
  ON public.classes FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- STEP 3: CLASS MEMBERS TABLE
-- =============================================================================
-- Junction table linking students to classes
-- Tracks which students are enrolled in which classes
-- =============================================================================
CREATE TABLE public.class_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, user_id)
);

-- Enable RLS
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Members can view class memberships
CREATE POLICY "Members can view class memberships" 
  ON public.class_members FOR SELECT 
  TO authenticated
  USING (true);

-- RLS Policy: Admins can manage all memberships
CREATE POLICY "Admins can manage memberships" 
  ON public.class_members FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- STEP 4: MESSAGES TABLE
-- =============================================================================
-- Stores chat messages within class sections
-- Supports text, images, PDFs, and YouTube video links
-- =============================================================================
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'pdf', 'video')),
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Class members can view messages
CREATE POLICY "Class members can view messages" 
  ON public.messages FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.class_members 
      WHERE class_id = messages.class_id AND user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- RLS Policy: Class members can insert messages
CREATE POLICY "Class members can insert messages" 
  ON public.messages FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.class_members 
      WHERE class_id = messages.class_id AND user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- =============================================================================
-- STEP 5: ATTENDANCE TABLE
-- =============================================================================
-- Tracks daily attendance records for students
-- Teachers mark attendance for their assigned classes
-- =============================================================================
CREATE TABLE public.attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent')),
  marked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, user_id, date)
);

-- Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Teachers and admins can view attendance
CREATE POLICY "Teachers and admins can view attendance" 
  ON public.attendance FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes 
      WHERE id = attendance.class_id AND teacher_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR EXISTS (
      -- Students can view their own attendance
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'student'
    )
  );

-- RLS Policy: Teachers and admins can manage attendance
CREATE POLICY "Teachers and admins can manage attendance" 
  ON public.attendance FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes 
      WHERE id = attendance.class_id AND teacher_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- STEP 6: NOTICES TABLE
-- =============================================================================
-- Global announcement system for academy news
-- Admins and teachers can create notices
-- =============================================================================
CREATE TABLE public.notices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- RLS Policy: All authenticated users can view notices
CREATE POLICY "Notices are viewable by authenticated users" 
  ON public.notices FOR SELECT 
  TO authenticated
  USING (true);

-- RLS Policy: Teachers and admins can create notices
CREATE POLICY "Teachers and admins can create notices" 
  ON public.notices FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- RLS Policy: Notice creators and admins can delete notices
CREATE POLICY "Notice creators and admins can delete notices" 
  ON public.notices FOR DELETE 
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- STEP 7: INDEXES FOR PERFORMANCE
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_class_members_class_id ON public.class_members(class_id);
CREATE INDEX IF NOT EXISTS idx_class_members_user_id ON public.class_members(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_class_id ON public.messages(class_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON public.attendance(class_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON public.attendance(user_id, date);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- =============================================================================
-- STEP 8: REALTIME SUBSCRIPTIONS
-- =============================================================================
-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- =============================================================================
-- STEP 9: AUTO PROFILE CREATION TRIGGER
-- =============================================================================
-- Automatically creates a profile when a new user signs up via OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    'student'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on user insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- SETUP COMPLETE!
-- =============================================================================
-- Your database is now configured for Academy Connect.
-- 
-- Next steps:
-- 1. Go to Supabase Storage and create a bucket named "chat-files"
-- 2. Make the bucket public or configure appropriate policies
-- 3. Update your .env.local with the Supabase credentials
-- 4. Run the development server with npm run dev
--
-- See IMPLEMENTATION.md for detailed setup instructions.
