"use client";

import { createBrowserClient } from "@supabase/ssr";
import { CookieOptions } from "@supabase/ssr";

// Create a single client instance to be used throughout the app
// Only used for authentication now that profiles are managed locally
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get(name: string) {
        if (typeof document === "undefined") return "";
        const match = document.cookie.match(`(^|;)\\s*${name}\\s*=\\s*([^;]+)`);
        return match ? decodeURIComponent(match[2]) : "";
      },
      set(name: string, value: string, options: CookieOptions) {
        if (typeof document === "undefined") return;
        document.cookie = `${name}=${encodeURIComponent(value)}${
          options.path ? `;path=${options.path}` : ""
        }${options.domain ? `;domain=${options.domain}` : ""}${
          options.sameSite ? `;samesite=${String(options.sameSite)}` : ""
        }${options.secure ? ";secure" : ""}`;
      },
      remove(name: string, options: CookieOptions) {
        if (typeof document === "undefined") return;
        document.cookie = `${name}=;max-age=0${
          options.path ? `;path=${options.path}` : ""
        }${options.domain ? `;domain=${options.domain}` : ""}`;
      },
    },
  },
);
