import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/auth/login", requestUrl.origin));
  }

  // Create a response early so we can modify its cookies
  const response = NextResponse.redirect(new URL("/", requestUrl.origin));

  // Create a supabase client that can modify the response cookies
  const supabase = createMiddlewareClient(request, response);

  try {
    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth error:", error.message);
      return NextResponse.redirect(
        new URL(
          `/auth/login?error=auth&message=${error.message}`,
          requestUrl.origin,
        ),
      );
    }

    // Return the response with cookies set
    return response;
  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.redirect(
      new URL(
        "/auth/login?error=auth&message=Authentication failed",
        requestUrl.origin,
      ),
    );
  }
}
