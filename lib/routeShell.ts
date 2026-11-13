export type ShellMode = "auth" | "app" | "public";

const AUTH_ROUTE_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

const APP_ROUTE_PREFIXES = [
  "/dashboard",
  "/groups",
  "/expenses",
  "/activity",
  "/itinerary",
  "/join",
];

/**
 * Resolves the active navigation shell mode consistently across AppShell and Navbar.
 * Keeps /reset-password inside the distraction-free auth layout and keeps signed-in
 * /profile views inside the authenticated app shell.
 */
export function getShellMode(pathname: string | null | undefined, hasUser: boolean): ShellMode {
  if (!pathname) return "public";

  if (AUTH_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return "auth";
  }

  if (
    APP_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    (hasUser && pathname.startsWith("/profile"))
  ) {
    return "app";
  }

  return "public";
}

