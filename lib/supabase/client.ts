import { createBrowserClient } from "@supabase/ssr";

// Create a single client instance to be used throughout the app
// Only used for authentication now that profiles are managed locally
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
