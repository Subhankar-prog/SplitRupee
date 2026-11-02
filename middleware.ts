import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // When a logged-in user navigates to the landing page "/", immediately redirect to "/dashboard"
  if (pathname === "/") {
    const sessionCookie = request.cookies.get("splitrupee_session")?.value;
    if (sessionCookie) {
      try {
        const decoded = decodeURIComponent(sessionCookie);
        const parsed = JSON.parse(decoded);
        if (parsed && (parsed.id || parsed.email)) {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      } catch {
        // Corrupted session cookie; allow visiting landing page
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"]
};

