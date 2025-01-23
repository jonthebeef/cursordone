import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Initialize session
  useEffect(() => {
    const isAuthPage = pathname?.startsWith("/auth/");

    // Skip session check on auth pages
    if (isAuthPage) {
      setSessionLoading(false);
      setInitialLoadComplete(true);
      return;
    }

    let mounted = true;
    const initSession = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (sessionError) throw sessionError;

        if (!session) {
          router.replace("/auth/login");
          return;
        }

        setSession(session);
      } catch (err) {
        console.error("Session initialization error:", err);
        if (mounted) {
          setError(
            err instanceof Error
              ? err
              : new Error("Failed to initialize session"),
          );
          router.replace("/auth/login");
        }
      } finally {
        if (mounted) {
          setSessionLoading(false);
          // Add a small delay before marking initial load complete to prevent flashing
          setTimeout(() => {
            if (mounted) {
              setInitialLoadComplete(true);
            }
          }, 100);
        }
      }
    };

    initSession();

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT") {
        setSession(null);
        if (!isAuthPage) {
          router.replace("/auth/login");
        }
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setSession(session);
        if (isAuthPage) {
          router.replace("/");
        }
        return;
      }

      setSession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  const clearSession = useCallback(async () => {
    try {
      setSessionLoading(true);

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear session state
      setSession(null);
      setError(null);

      // Hard redirect to login to ensure clean state
      window.location.href = "/auth/login?clear=1&t=" + Date.now();
    } catch (err) {
      console.error("Logout error:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to clear session"),
      );
      router.replace("/auth/login");
    } finally {
      setSessionLoading(false);
    }
  }, [router]);

  // Combine session loading and initial load state
  const loading = sessionLoading || !initialLoadComplete;

  return {
    session,
    loading,
    error,
    clearSession,
    isAuthenticated: !!session,
  };
}
