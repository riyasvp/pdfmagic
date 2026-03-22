-- ============================================================
-- PDFMagic - Simple Supabase Setup
-- Run in Supabase SQL Editor: 
-- https://supabase.com/dashboard/project/ustrbsgztpqlazmhvgom/sql
-- ============================================================

-- 1. Create user profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for profiles
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Create PDF history table
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

-- 6. Enable RLS on pdf_history
ALTER TABLE public.pdf_history ENABLE ROW LEVEL SECURITY;

-- 7. Create policies for pdf_history
CREATE POLICY "Users read own history" ON public.pdf_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own history" ON public.pdf_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own history" ON public.pdf_history FOR DELETE USING (auth.uid() = user_id);

-- 8. Storage policies for pdf-edits bucket
CREATE POLICY "Public read" ON storage.objects FOR SELECT USING (bucket_id = 'pdf-edits');
CREATE POLICY "Auth upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pdf-edits' AND auth.role() = 'authenticated');
CREATE POLICY "Auth update" ON storage.objects FOR UPDATE USING (bucket_id = 'pdf-edits' AND auth.role() = 'authenticated');
CREATE POLICY "Auth delete" ON storage.objects FOR DELETE USING (bucket_id = 'pdf-edits' AND auth.role() = 'authenticated');
CREATE POLICY "Anon upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pdf-edits' AND auth.role() = 'anon');

-- Done! 
SELECT 'Supabase setup complete!' as status;
