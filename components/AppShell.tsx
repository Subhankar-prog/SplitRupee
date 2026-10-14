"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import { useUser } from "@/lib/userContext";
import { useRealtimeSync } from "@/lib/useRealtimeSync";
import { Loader2, Lock } from "lucide-react";
import Link from "next/link";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isLoading } = useUser();

  // Enable live real-time synchronization across devices
  useRealtimeSync();

  // Auto-close sidebar on route change (mobile UX)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const isAppRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/groups") ||
    pathname.startsWith("/expenses") ||
    pathname.startsWith("/activity") ||
    pathname.startsWith("/join");

  useEffect(() => {
    if (!isLoading && !currentUser && isAppRoute) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, currentUser, isAppRoute, pathname, router]);

  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password");

  // Authentication Pages Layout (No Website Header/Footer)
  if (isAuthRoute) {
    return (
      <div className="min-h-screen text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
        <main className="flex-1 w-full">{children}</main>
      </div>
    );
  }

  // Public Marketing / Content Pages Layout
  if (!isAppRoute) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
        <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        <main className="flex-1 w-full">{children}</main>
        <Footer />
      </div>
    );
  }

  // If loading session on protected routes
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          <p className="text-xs text-slate-400 font-medium">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If not logged in on protected route
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/90 p-8 text-center space-y-5 shadow-2xl">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Login Required</h2>
            <p className="text-xs text-slate-400">
              You must sign in or create an account to access groups, expenses, and your dashboard.
            </p>
            <div className="flex gap-3 pt-2">
              <Link
                href="/login"
                className="flex-1 rounded-xl bg-emerald-500 py-3 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="flex-1 rounded-xl border border-white/15 bg-white/5 py-3 text-xs font-semibold text-white hover:bg-white/10 transition"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Logged-in App Dashboard Layout with Sidebar
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        {/* Mobile: full width (sidebar is an overlay). Desktop (md+): offset by sidebar width */}
        <div className="flex-1 md:pl-64 flex flex-col min-w-0 overflow-hidden">
          {/* pb-24 on mobile for bottom nav, pb-8 on desktop */}
          <main className="flex-1 p-3 sm:p-4 md:p-6 max-w-6xl w-full mx-auto pb-28 md:pb-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
