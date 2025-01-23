"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

function ErrorDisplay() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  if (!error) return null;

  return (
    <>
      {error === "session_error" && (
        <div className="p-4 bg-red-500/10 text-red-500 text-sm text-center">
          There was a problem with your session. Please try logging in again.
        </div>
      )}
      {error === "no_code" && (
        <div className="p-4 bg-red-500/10 text-red-500 text-sm text-center">
          No authentication code was provided. Please try signing in again.
        </div>
      )}
      {error === "auth_failed" && (
        <div className="p-4 bg-red-500/10 text-red-500 text-sm text-center">
          Authentication failed. Please try signing in again.
        </div>
      )}
    </>
  );
}

function AuthLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: "pkce",
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    },
  );

  // Handle component mounting
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const checkAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth check error:", error);
          return;
        }

        if (session) {
          const redirect = searchParams.get("redirect") || "/";
          window.location.href = redirect;
          return;
        }
      } catch (err) {
        console.error("Session check error:", err);
      } finally {
        setIsChecking(false);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN") {
        const redirect = searchParams.get("redirect") || "/";
        window.location.href = redirect;
        return;
      }
    });

    checkAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, [mounted, router, searchParams, supabase.auth]);

  // Don't render anything until mounted
  if (!mounted) return null;

  // Show loading state while checking auth
  if (isChecking) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900">
      <Suspense fallback={null}>
        <ErrorDisplay />
      </Suspense>
      {children}
    </div>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthLayoutContent>{children}</AuthLayoutContent>
    </Suspense>
  );
}
