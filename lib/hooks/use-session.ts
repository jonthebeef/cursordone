import { useEffect, useState, useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

const SESSION_TIMEOUT = 1000 * 60 * 60 * 24; // 24 hours
const TOKEN_REFRESH_MARGIN = 1000 * 60 * 5; // 5 minutes before expiry

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialize session from storage and set up refresh timer
  useEffect(() => {
    const initSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);

        if (session?.expires_at) {
          const expiresAt = new Date(session.expires_at * 1000);
          const now = new Date();
          const timeUntilExpiry = expiresAt.getTime() - now.getTime();

          // If token is close to expiry, refresh it
          if (timeUntilExpiry < TOKEN_REFRESH_MARGIN) {
            const {
              data: { session: refreshedSession },
            } = await supabase.auth.refreshSession();
            setSession(refreshedSession);
          }
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error("Failed to initialize session"),
        );
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, []);

  // Set up auth state change listener
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setLoading(false);

      // Handle session recovery
      if (event === "TOKEN_REFRESHED") {
        setError(null); // Clear any previous errors
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Set up session timeout
  useEffect(() => {
    if (!session) return;

    const timeoutId = setTimeout(() => {
      supabase.auth.signOut();
    }, SESSION_TIMEOUT);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [session]);

  // Expose session management functions
  const refreshSession = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.refreshSession();
      setSession(session);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to refresh session"),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSession = useCallback(async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setSession(null);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to clear session"),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    session,
    loading,
    error,
    refreshSession,
    clearSession,
    isAuthenticated: !!session,
  };
}
