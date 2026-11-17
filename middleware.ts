import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Explicitly allow public SEO endpoints, crawlers, and Google verification files
  if (
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    pathname.startsWith("/google")
  ) {
    return NextResponse.next();
  }

  // When visiting the landing page "/", only redirect to "/dashboard" if the user has an active session cookie.
  // Unauthenticated visitors remain on "/" to see the public marketing landing page.
  if (pathname === "/") {
    const sessionCookie = request.cookies.get("splitrupee_session")?.value;
    if (sessionCookie) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"]
};
