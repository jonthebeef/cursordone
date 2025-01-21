"use client";

import { createContext, useContext } from "react";
import { User } from "@supabase/supabase-js";
import { useSession } from "@/lib/hooks/use-session";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  refreshSession: () => Promise<void>;
  clearSession: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  refreshSession: async () => {},
  clearSession: async () => {},
  isAuthenticated: false,
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const {
    session,
    loading,
    error,
    refreshSession,
    clearSession,
    isAuthenticated,
  } = useSession();

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        loading,
        error,
        refreshSession,
        clearSession,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
