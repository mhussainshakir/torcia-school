import { createClient } from '@supabase/supabase-js';

/**
 * Database Setup Script for Academy Connect
 * 
 * This script creates all required tables in Supabase.
 * Run this once after setting up your Supabase project.
 * 
 * Usage: npm run db:setup
 */

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase environment variables');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * SQL statements to create all required tables.
 * Each table is designed to work with Supabase Auth.
 */
const createTablesSQL = `
-- =============================================================================
-- PROFILES TABLE
-- =============================================================================
-- Extends Supabase auth.users with additional profile information.
-- Stores user details, roles, and Google Drive integration.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
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
-- CLASSES TABLE
-- =============================================================================
-- Stores class/section information.
-- Each class has a name, optional description, and assigned teacher.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.classes (
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
-- CLASS MEMBERS TABLE
-- =============================================================================
-- Junction table linking students to classes.
-- Tracks which students are enrolled in which classes.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.class_members (
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
-- MESSAGES TABLE
-- =============================================================================
-- Stores chat messages within class sections.
-- Supports text, images, PDFs, and YouTube video links.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
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
-- ATTENDANCE TABLE
-- =============================================================================
-- Tracks daily attendance records for students.
-- Teachers mark attendance for their assigned classes.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.attendance (
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
-- NOTICES TABLE
-- =============================================================================
-- Global announcement system for academy news.
-- Admins and teachers can create notices.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.notices (
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
-- INDEXES FOR PERFORMANCE
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_class_members_class_id ON public.class_members(class_id);
CREATE INDEX IF NOT EXISTS idx_class_members_user_id ON public.class_members(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_class_id ON public.messages(class_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON public.attendance(class_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON public.attendance(user_id, date);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- =============================================================================
-- REALTIME SUBSCRIPTIONS
-- =============================================================================
-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
`;

/**
 * Enables Supabase Realtime for the messages table.
 * This allows real-time chat updates.
 */
const enableRealtimeSQL = `
-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
`;

/**
 * Creates a function to automatically create a profile
 * when a new user signs up via OAuth.
 */
const createProfileTriggerSQL = `
-- Function to handle new user signup
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
`;

/**
 * Main setup function that runs all SQL statements.
 */
async function setupDatabase() {
  console.log('🚀 Starting Academy Connect Database Setup...\n');

  try {
    console.log('📋 Creating tables and policies...');
    const { error: tablesError } = await supabase.rpc('pg_net_http_post', {
      url: `${supabaseUrl}/rest/v1/rpc/exec`,
      body: JSON.stringify({ query: createTablesSQL })
    });

    // Alternative: Use raw SQL via admin API
    console.log('Executing SQL via Supabase Admin API...');
    
    // Since we can't directly execute raw SQL, we'll log instructions
    console.log('\n⚠️  Please run the following SQL in your Supabase SQL Editor:');
    console.log('='.repeat(80));
    console.log(createTablesSQL);
    console.log('='.repeat(80));
    console.log(createProfileTriggerSQL);
    console.log('='.repeat(80));
    console.log('\n');

    // For Supabase Admin API, we need to use the REST API
    // This is a workaround since Supabase doesn't expose raw SQL execution directly
    
    console.log('✅ Database setup instructions generated!');
    console.log('\n📝 Next Steps:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the SQL statements above');
    console.log('4. Enable Realtime for the messages table');
    
    console.log('\n🔧 Storage Setup (for chat files):');
    console.log('1. Create a bucket named "chat-files" in Supabase Storage');
    console.log('2. Set bucket to public or configure signed URLs');
    console.log('3. Update storage policies as needed');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
setupDatabase();
