import { createClient } from "@supabase/supabase-js";

declare global {
  var supabaseServerInstance: ReturnType<typeof createClient> | undefined;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create client only if env vars are set
let _supabaseServer: ReturnType<typeof createClient> | null = null;

if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && !globalThis.supabaseServerInstance) {
  globalThis.supabaseServerInstance = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  _supabaseServer = globalThis.supabaseServerInstance;
}

export const supabaseServer = _supabaseServer;
