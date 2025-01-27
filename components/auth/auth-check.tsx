"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";

export function AuthCheck({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Add a small delay to allow the session to be established
    const timer = setTimeout(() => {
      if (!loading && !user) {
        router.push("/auth/login");
      }
    }, 1000); // 1 second delay

    return () => clearTimeout(timer);
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-zinc-400">Checking authentication...</div>
      </div>
    );
  }

  return <>{children}</>;
}
