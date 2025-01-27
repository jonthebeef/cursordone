"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { FlickeringGrid } from "@/components/ui/flickering-grid";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black">
      <div className="absolute inset-0 -z-10">
        <FlickeringGrid />
      </div>
      <AuthLayoutContent>{children}</AuthLayoutContent>
    </div>
  );
}

function AuthLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mountedRef = useRef(false);
  const checkingRef = useRef(false);
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
    }
  );

  // Handle component mounting
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!mountedRef.current) return;

    // Prevent multiple checks
    if (checkingRef.current) return;
    checkingRef.current = true;

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

        if (session && mountedRef.current) {
          const redirect = searchParams.get("redirect");
          if (redirect && redirect.startsWith("/")) {
            router.replace(redirect);
          } else {
            router.replace("/");
          }
          return;
        }
      } catch (err) {
        console.error("Session check error:", err);
      } finally {
        if (mountedRef.current) {
          setIsChecking(false);
          checkingRef.current = false;
        }
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return;

      if (event === "SIGNED_IN" && session) {
        const redirect = searchParams.get("redirect");
        if (redirect && redirect.startsWith("/")) {
          router.replace(redirect);
        } else {
          router.replace("/");
        }
        return;
      }

      // Handle other auth state changes if needed
      switch (event) {
        case "TOKEN_REFRESHED":
          // Session updated, no redirect needed
          break;
        case "SIGNED_OUT":
          // Already on auth page, no redirect needed
          break;
        default:
          break;
      }
    });

    checkAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, [router, searchParams, supabase.auth]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-zinc-400">Checking authentication...</div>
      </div>
    );
  }

  return <>{children}</>;
}
