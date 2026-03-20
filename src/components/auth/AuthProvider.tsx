"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { User, Session } from "@/lib/supabase-auth";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  resendConfirmation: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  if (typeof window === "undefined") return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(url && key);
};

function createSupabaseClient() {
  if (!isSupabaseConfigured()) return null;
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const supabase = createSupabaseClient();
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      try {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session as Session | null);
        setUser(session?.user as User | null);

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            setSession(session as Session | null);
            setUser(session?.user as User | null);
            setIsLoading(false);
          }
        );

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Auth initialization error:", error);
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Redirect to login for protected routes when not authenticated
  useEffect(() => {
    if (!isLoading && !user && pathname?.startsWith("/dashboard")) {
      const redirectUrl = encodeURIComponent(pathname);
      router.push(`/auth/login?redirect=${redirectUrl}`);
    }
  }, [isLoading, user, pathname, router]);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = createSupabaseClient();
    if (!supabase) {
      return { error: new Error("Authentication is not configured") };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      router.refresh();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, [router]);

  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    const supabase = createSupabaseClient();
    if (!supabase) {
      return { error: new Error("Authentication is not configured"), needsConfirmation: false };
    }

    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split("@")[0],
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return { error, needsConfirmation: false };
      }

      // Check if email confirmation is required
      const needsConfirmation = !!(data.user && !data.session);
      return { error: null, needsConfirmation };
    } catch (error) {
      return { error: error as Error, needsConfirmation: false };
    }
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createSupabaseClient();
    if (!supabase) return;

    try {
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  }, [router]);

  const signInWithGoogle = useCallback(async () => {
    const supabase = createSupabaseClient();
    if (!supabase) {
      return { error: new Error("Authentication is not configured") };
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const supabase = createSupabaseClient();
    if (!supabase) {
      return { error: new Error("Authentication is not configured") };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const supabase = createSupabaseClient();
    if (!supabase) {
      return { error: new Error("Authentication is not configured") };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);

  const resendConfirmation = useCallback(async (email: string) => {
    const supabase = createSupabaseClient();
    if (!supabase) {
      return { error: new Error("Authentication is not configured") };
    }

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resetPassword,
    updatePassword,
    resendConfirmation,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Loading fallback component
export function AuthLoading({ children }: { children: ReactNode }) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
