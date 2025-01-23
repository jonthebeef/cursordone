import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

export async function POST(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const formData = await request.formData();
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const isSignUp = formData.get("signup") === "true";

  const response = new NextResponse();
  const supabase = createMiddlewareClient(request, response);

  const { error } = isSignUp
    ? await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${requestUrl.origin}/auth/callback`,
        },
      })
    : await supabase.auth.signInWithPassword({
        email,
        password,
      });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.redirect(requestUrl.origin, {
    status: 301,
    headers: response.headers,
  });
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const response = new NextResponse();
    const supabase = createMiddlewareClient(request, response);
    await supabase.auth.exchangeCodeForSession(code);

    return NextResponse.redirect(requestUrl.origin, {
      headers: response.headers,
    });
  }

  return NextResponse.redirect(requestUrl.origin);
}
