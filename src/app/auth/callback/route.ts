import { createBrowserClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectTo = requestUrl.searchParams.get("redirect_to") || "/dashboard";

  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase not configured - auth callback cannot process");
    return NextResponse.redirect(new URL("/auth/login?error=not_configured", requestUrl.origin));
  }

  if (code) {
    const supabase = createBrowserClient(supabaseUrl, supabaseKey);
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error && data.user) {
        // Successful authentication
        return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
      }
      
      if (error) {
        console.error("Auth callback error:", error.message);
        return NextResponse.redirect(
          new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
        );
      }
    } catch (error) {
      console.error("Auth callback exception:", error);
      return NextResponse.redirect(
        new URL("/auth/login?error=callback_failed", requestUrl.origin)
      );
    }
  }

  // If no code, redirect to login
  return NextResponse.redirect(new URL("/auth/login?error=no_code", requestUrl.origin));
}
