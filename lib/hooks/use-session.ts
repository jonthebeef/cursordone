import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(false);
  const initializingRef = useRef(false);
  const router = useRouter();
  const pathname = usePathname();

  // Safe state updates - only if mounted
  const safeSetState = useCallback(<T>(setter: (value: T) => void, value: T) => {
    if (mountedRef.current) {
      setter(value);
    }
  }, []);

  // Initialize session
  useEffect(() => {
    mountedRef.current = true;
    const isAuthPage = pathname?.startsWith("/auth/");

    // Skip session check on auth pages
    if (isAuthPage) {
      safeSetState(setLoading, false);
      return;
    }

    // Prevent multiple initializations
    if (initializingRef.current) return;
    initializingRef.current = true;

    const initSession = async () => {
      try {
        const {
          data: { session: initialSession },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!mountedRef.current) return;

        if (sessionError) throw sessionError;

        if (!initialSession) {
          router.replace("/auth/login");
          return;
        }

        safeSetState(setSession, initialSession);
      } catch (err) {
        console.error("Session initialization error:", err);
        if (mountedRef.current) {
          safeSetState(
            setError,
            err instanceof Error ? err : new Error("Failed to initialize session")
          );
          router.replace("/auth/login");
        }
      } finally {
        if (mountedRef.current) {
          safeSetState(setLoading, false);
        }
      }
    };

    initSession();

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mountedRef.current) return;

      if (event === "SIGNED_OUT") {
        safeSetState(setSession, null);
        if (!isAuthPage) {
          router.replace("/auth/login");
        }
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        safeSetState(setSession, newSession);
        if (isAuthPage) {
          router.replace("/");
        }
        return;
      }

      safeSetState(setSession, newSession);
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [router, pathname, safeSetState]);

  const clearSession = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      safeSetState(setLoading, true);

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear session state
      safeSetState(setSession, null);
      safeSetState(setError, null);

      // Redirect to login
      router.replace("/auth/login");
    } catch (err) {
      console.error("Logout error:", err);
      if (mountedRef.current) {
        safeSetState(
          setError,
          err instanceof Error ? err : new Error("Failed to clear session")
        );
      }
    } finally {
      if (mountedRef.current) {
        safeSetState(setLoading, false);
      }
    }
  }, [router, safeSetState]);

  return {
    session,
    loading,
    error,
    clearSession,
    isAuthenticated: !!session,
  };
}
