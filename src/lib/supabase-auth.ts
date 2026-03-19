import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export const supabaseBrowser = createBrowserSupabaseClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

export async function getUserFromRequest() {
  const cookieStore = await cookies();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    }
  );
  supabase.auth.setSession({
    access_token: cookieStore.get('sb-access-token')?.value ?? '',
    refresh_token: cookieStore.get('sb-refresh-token')?.value ?? '',
  });
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
