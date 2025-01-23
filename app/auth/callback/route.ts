import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const response = new NextResponse();
    const supabase = createMiddlewareClient(request, response);

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between
        return NextResponse.redirect(`${origin}${next}`, {
          headers: response.headers,
        });
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`, {
          headers: response.headers,
        });
      } else {
        return NextResponse.redirect(`${origin}${next}`, {
          headers: response.headers,
        });
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
