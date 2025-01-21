import { Session } from "@supabase/supabase-js";
import { AES, enc } from "crypto-js";

const STORAGE_KEY = "auth_session";
const ENCRYPTION_KEY =
  process.env.NEXT_PUBLIC_SESSION_ENCRYPTION_KEY || "default-key";

export const secureStorage = {
  // Store session data with encryption
  setSession: (session: Session | null) => {
    if (!session) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    const encrypted = AES.encrypt(
      JSON.stringify(session),
      ENCRYPTION_KEY,
    ).toString();

    localStorage.setItem(STORAGE_KEY, encrypted);
  },

  // Retrieve and decrypt session data
  getSession: (): Session | null => {
    const encrypted = localStorage.getItem(STORAGE_KEY);
    if (!encrypted) return null;

    try {
      const decrypted = AES.decrypt(encrypted, ENCRYPTION_KEY).toString(
        enc.Utf8,
      );
      return JSON.parse(decrypted);
    } catch (error) {
      console.error("Failed to decrypt session:", error);
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  },

  // Clear session data
  clearSession: () => {
    localStorage.removeItem(STORAGE_KEY);
  },

  // Check if session exists
  hasSession: () => {
    return !!localStorage.getItem(STORAGE_KEY);
  },
};
