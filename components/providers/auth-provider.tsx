"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { useSession } from "@/lib/hooks/use-session";
import { usePathname } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  clearSession: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  clearSession: async () => {},
  isAuthenticated: false,
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const {
    session,
    loading: sessionLoading,
    error,
    clearSession,
    isAuthenticated,
  } = useSession();

  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/auth/");
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    // Mark initial load as complete after a short delay
    const timer = setTimeout(() => {
      setInitialLoadComplete(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Only show loading state if we're not on an auth page and still loading
  const loading = !isAuthPage && (sessionLoading || !initialLoadComplete);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        loading,
        error,
        clearSession,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
