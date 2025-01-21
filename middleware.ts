import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

// CSRF token validation
const validateCSRFToken = (request: NextRequest) => {
  const csrfToken = request.cookies.get("csrf_token")?.value;
  const csrfHeader = request.headers.get("x-csrf-token");

  if (request.method === "GET") return true;
  return csrfToken && csrfHeader && csrfToken === csrfHeader;
};

export async function middleware(request: NextRequest) {
  // Skip CSRF check for auth endpoints and static files
  const isAuthEndpoint = request.nextUrl.pathname.startsWith("/auth");
  const isStaticFile = request.nextUrl.pathname.match(
    /\.(js|css|png|jpg|jpeg|gif|ico|svg)$/,
  );

  if (!isAuthEndpoint && !isStaticFile && !validateCSRFToken(request)) {
    return new NextResponse(null, {
      status: 403,
      statusText: "Invalid CSRF token",
    });
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Add security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
  );
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );

  // Handle auth session
  const supabase = createMiddlewareClient(request, response);
  await supabase.auth.getSession();

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
