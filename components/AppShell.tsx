"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import { useUser } from "@/lib/userContext";
import { useRealtimeSync } from "@/lib/useRealtimeSync";
import { AlertCircle } from "lucide-react";
import SplitRupeeLoader from "./SplitRupeeLoader";
import AddUpiModal from "./AddUpiModal";
import OfflineSyncModal from "./OfflineSyncModal";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddUpiModal, setShowAddUpiModal] = useState(false);
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
    pathname.startsWith("/itinerary") ||
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
        {currentUser && !currentUser.upiId && (
          <div className="w-full bg-gradient-to-r from-amber-500/20 via-orange-500/25 to-amber-500/20 border-b border-amber-500/35 px-4 py-2 text-center text-xs font-medium text-amber-200 flex items-center justify-center gap-2 z-20 shadow-sm animate-in fade-in slide-in-from-top-1 duration-300">
            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
            <span>
              For one tap settlement, add your UPI ID.{" "}
              <button
                type="button"
                onClick={() => setShowAddUpiModal(true)}
                className="font-bold underline text-amber-300 hover:text-white transition ml-1 cursor-pointer"
              >
                Click here to add
              </button>
            </span>
          </div>
        )}
        <main className="flex-1 w-full">{children}</main>
        <Footer />
        <AddUpiModal isOpen={showAddUpiModal} onClose={() => setShowAddUpiModal(false)} />
      </div>
    );
  }

  // If loading session on protected routes: only show loader if we have NO cached user yet
  if (isLoading && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <SplitRupeeLoader fullScreen={false} text="SplitRupee" subtext="Checking session..." />
      </div>
    );
  }

  // If not logged in on protected route: smoothly redirect with branded loader (no jarring box flash)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <SplitRupeeLoader fullScreen={false} text="SplitRupee" subtext="Redirecting to sign in..." />
      </div>
    );
  }

  // Logged-in App Dashboard Layout with Sidebar & Top UPI Banner
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

      {/* Orange One-Tap Settlement Banner if User has no UPI ID */}
      {!currentUser.upiId && (
        <div className="w-full bg-gradient-to-r from-amber-500/20 via-orange-500/25 to-amber-500/20 border-b border-amber-500/35 px-4 py-2 text-center text-xs font-medium text-amber-200 flex items-center justify-center gap-2 z-20 shadow-sm animate-in fade-in slide-in-from-top-1 duration-300">
          <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
          <span>
            For one tap settlement, add your UPI ID.{" "}
            <button
              type="button"
              onClick={() => setShowAddUpiModal(true)}
              className="font-bold underline text-amber-300 hover:text-white transition ml-1 cursor-pointer"
            >
              Click here to add
            </button>
          </span>
        </div>
      )}

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

      <AddUpiModal isOpen={showAddUpiModal} onClose={() => setShowAddUpiModal(false)} />
      <OfflineSyncModal />
    </div>
  );
}
