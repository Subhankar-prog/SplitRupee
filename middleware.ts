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

  // When visiting the landing page "/", immediately redirect to "/dashboard"
  // so the dashboard is the primary landing page for all users (signed-in or signed-out).
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"]
};
