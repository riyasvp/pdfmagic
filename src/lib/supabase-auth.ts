import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Lazy initialization to avoid build errors when env vars are not set
let _supabaseBrowser: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowser() {
  if (!_supabaseBrowser && typeof window !== 'undefined') {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      _supabaseBrowser = createBrowserClient(url, key);
    }
  }
  return _supabaseBrowser;
}

export async function getUserFromRequest() {
  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    // Supabase not configured - return null (unauthenticated)
    return null;
  }

  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;
    const refreshToken = cookieStore.get('sb-refresh-token')?.value;

    // Early return if no auth cookies present
    if (!accessToken && !refreshToken) {
      return null;
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
    supabase.auth.setSession({
      access_token: accessToken ?? '',
      refresh_token: refreshToken ?? '',
    });
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}
