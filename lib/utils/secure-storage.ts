import { Session } from "@supabase/supabase-js";
import { AES, enc } from "crypto-js";

const STORAGE_KEYS = {
  SESSION: "auth_session",
  STATE: "auth_state",
  PROVIDER: "auth_provider",
  REDIRECT: "auth_redirect",
} as const;

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_SESSION_ENCRYPTION_KEY || "default-key";

export const secureStorage = {
  // Store session data with encryption
  setSession: (session: Session | null) => {
    if (!session) {
      secureStorage.clearAll();
      return;
    }

    try {
      const encrypted = AES.encrypt(
        JSON.stringify(session),
        ENCRYPTION_KEY
      ).toString();

      localStorage.setItem(STORAGE_KEYS.SESSION, encrypted);
    } catch (error) {
      console.error("Failed to store session:", error);
      secureStorage.clearAll();
    }
  },

  // Retrieve and decrypt session data
  getSession: (): Session | null => {
    const encrypted = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!encrypted) return null;

    try {
      const decrypted = AES.decrypt(encrypted, ENCRYPTION_KEY).toString(enc.Utf8);
      const session = JSON.parse(decrypted);

      // Validate session structure
      if (!session?.access_token || !session?.refresh_token) {
        throw new Error("Invalid session structure");
      }

      return session;
    } catch (error) {
      console.error("Failed to decrypt session:", error);
      secureStorage.clearAll();
      return null;
    }
  },

  // Clear all auth-related data
  clearAll: () => {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });

    // Clear any other potential auth data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("auth_") || key?.startsWith("supabase.")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  },

  // Check if session exists and is valid
  hasValidSession: () => {
    try {
      const session = secureStorage.getSession();
      if (!session) return false;

      // Check if session is expired
      const expiresAt = session.expires_at;
      if (!expiresAt) return false;

      const now = Math.floor(Date.now() / 1000);
      return expiresAt > now;
    } catch {
      return false;
    }
  },

  // Store temporary auth state
  setState: (state: string) => {
    localStorage.setItem(STORAGE_KEYS.STATE, state);
  },

  // Get and clear auth state
  getAndClearState: () => {
    const state = localStorage.getItem(STORAGE_KEYS.STATE);
    localStorage.removeItem(STORAGE_KEYS.STATE);
    return state;
  },

  // Store OAuth provider
  setProvider: (provider: string) => {
    localStorage.setItem(STORAGE_KEYS.PROVIDER, provider);
  },

  // Get OAuth provider
  getProvider: () => {
    return localStorage.getItem(STORAGE_KEYS.PROVIDER);
  },

  // Store redirect path
  setRedirect: (path: string) => {
    localStorage.setItem(STORAGE_KEYS.REDIRECT, path);
  },

  // Get and clear redirect path
  getAndClearRedirect: () => {
    const redirect = localStorage.getItem(STORAGE_KEYS.REDIRECT);
    localStorage.removeItem(STORAGE_KEYS.REDIRECT);
    return redirect;
  },
};
