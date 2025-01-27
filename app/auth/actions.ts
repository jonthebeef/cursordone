"use server";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function getSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value ?? "";
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({
            name,
            value,
            ...options,
            sameSite: "lax",
            httpOnly: true,
          });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete(name);
        },
      },
    },
  );
}

export async function signInWithOAuth(provider: "github" | "discord") {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      scopes: provider === "github" ? "repo gist" : "identify email",
    },
  });

  if (error) {
    throw new Error("Could not authenticate user");
  }

  return data.url;
}

export async function signOut() {
  const supabase = await getSupabaseClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error signing out:", error.message);
  }

  return redirect("/auth/login");
}

export async function getSession() {
  const supabase = await getSupabaseClient();

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

export async function handleAuthCallback(code: string) {
  const supabase = await getSupabaseClient();

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return redirect("/");
  } catch (error) {
    console.error("Error:", error);
    return redirect("/auth/login?error=Could not authenticate user");
  }
}
