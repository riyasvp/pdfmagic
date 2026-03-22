-- ============================================================
-- PDFMagic Supabase Setup Script
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard
-- Project: ustrbsgztpqlazmhvgom
-- ============================================================

-- ============================================================
-- 1. STORAGE BUCKET POLICIES (for pdf-edits bucket)
-- ============================================================

-- First, let's make sure the bucket exists (run if not exists)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('pdf-edits', 'pdf-edits', true)
-- ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public read access to files
CREATE POLICY "Public Read Access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'pdf-edits');

-- Policy: Allow authenticated users to upload files
CREATE POLICY "Authenticated Uploads"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'pdf-edits'
  AND auth.role() = 'authenticated'
);

-- Policy: Allow authenticated users to update their files
CREATE POLICY "Authenticated Updates"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'pdf-edits'
  AND auth.role() = 'authenticated'
);

-- Policy: Allow authenticated users to delete their files
CREATE POLICY "Authenticated Deletes"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'pdf-edits'
  AND auth.role() = 'authenticated'
);

-- Policy: Allow anonymous uploads (for demo mode / guest users)
CREATE POLICY "Anonymous Uploads"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'pdf-edits'
  AND auth.role() = 'anon'
);

-- ============================================================
-- 2. USER PROFILES TABLE (optional but recommended)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read own profile
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can update own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Policy: Users can insert own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 3. PDF HISTORY TABLE (for tracking user PDF operations)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pdf_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  operation TEXT NOT NULL,
  original_filename TEXT,
  result_filename TEXT,
  file_size BIGINT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on pdf_history
ALTER TABLE public.pdf_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read own history
CREATE POLICY "Users can read own history"
ON public.pdf_history
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert own history
CREATE POLICY "Users can insert own history"
ON public.pdf_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete own history
CREATE POLICY "Users can delete own history"
ON public.pdf_history
FOR DELETE
USING (auth.uid() = user_id);

-- Policy: Anonymous users can also have history (using session_id)
CREATE POLICY "Anonymous can read history"
ON public.pdf_history
FOR SELECT
USING (auth.role() = 'anon');

CREATE POLICY "Anonymous can insert history"
ON public.pdf_history
FOR INSERT
WITH CHECK (auth.role() = 'anon');

-- ============================================================
-- 4. ENABLE NECESSARY EXTENSIONS
-- ============================================================

-- Enable UUID extension (usually enabled by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 5. AUTHENTICATION SETTINGS
-- ============================================================

-- These settings need to be configured in Supabase Dashboard:
-- Go to: Authentication > URL Configuration

-- Site URL: https://your-domain.com
-- Redirect URLs: 
--   - https://your-domain.com/auth/callback
--   - http://localhost:3000/auth/callback (for development)

-- ============================================================
-- 6. GOOGLE OAUTH SETUP (Optional)
-- ============================================================

-- To enable Google OAuth:
-- 1. Go to Google Cloud Console: https://console.cloud.google.com
-- 2. Create OAuth 2.0 Client ID
-- 3. Add authorized redirect URI: https://ustrbsgztpqlazmhvgom.supabase.co/auth/v1/callback
-- 4. In Supabase Dashboard: Authentication > Providers > Google
-- 5. Enable Google and add your Client ID and Client Secret

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check bucket policies
SELECT * FROM pg_policies WHERE tablename = 'objects';

-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
