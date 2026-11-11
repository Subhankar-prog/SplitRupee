"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import { useUser } from "@/lib/userContext";
import { useRealtimeSync } from "@/lib/useRealtimeSync";
import { AlertCircle, ChevronRight } from "lucide-react";
import SplitRupeeLoader from "./SplitRupeeLoader";
import AddUpiModal from "./AddUpiModal";
import OfflineSyncModal from "./OfflineSyncModal";

function RouteBreadcrumb({ pathname }: { pathname: string }) {
  if (!pathname || pathname === "/dashboard") return null;

  const segments: Array<{ label: string; href?: string }> = [
    { label: "Dashboard", href: "/dashboard" },
  ];

  if (pathname.startsWith("/groups/")) {
    segments.push({ label: "Groups", href: "/groups" });
    segments.push({ label: "Group Ledger" });
  } else if (pathname === "/groups") {
    segments.push({ label: "Groups" });
  } else if (pathname === "/expenses") {
    segments.push({ label: "Expenses" });
  } else if (pathname === "/activity") {
    segments.push({ label: "Activity" });
  } else if (pathname.startsWith("/itinerary")) {
    segments.push({ label: "Trip Planner" });
  } else if (pathname.startsWith("/join")) {
    segments.push({ label: "Join Group" });
  } else {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4 flex items-center gap-1.5 text-xs text-[var(--text-secondary)]"
    >
      {segments.map((seg, idx) => (
        <React.Fragment key={`${seg.label}-${idx}`}>
          {idx > 0 && <ChevronRight className="h-3 w-3 opacity-60" />}
          {seg.href ? (
            <Link
              href={seg.href}
              className="hover:text-[var(--text-primary)] transition-colors"
            >
              {seg.label}
            </Link>
          ) : (
            <span className="font-medium text-[var(--text-primary)]">{seg.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddUpiModal, setShowAddUpiModal] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isLoading } = useUser();

  useRealtimeSync();

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

  const upiBanner = currentUser && !currentUser.upiId && (
    <div className="w-full border-b border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-4 py-2 text-center text-xs font-medium text-[var(--text-primary)] flex items-center justify-center gap-2 z-20">
      <AlertCircle className="h-3.5 w-3.5 text-[var(--status-warning)] shrink-0" />
      <span>
        For one-tap settlements, add your UPI ID.{" "}
        <button
          type="button"
          onClick={() => setShowAddUpiModal(true)}
          className="font-semibold underline underline-offset-2 text-[var(--brand-dark)] dark:text-[var(--brand-primary)] hover:opacity-80 ml-1 cursor-pointer"
        >
          Click here to add
        </button>
      </span>
    </div>
  );

  // Authentication Routes (Clean, uncluttered container)
  if (isAuthRoute) {
    return (
      <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col">
        <main className="flex-1 w-full">{children}</main>
      </div>
    );
  }

  // Public Marketing / Content Routes
  if (!isAppRoute) {
    return (
      <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col">
        <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        {upiBanner}
        <main className="flex-1 w-full">{children}</main>
        <Footer />
        <AddUpiModal isOpen={showAddUpiModal} onClose={() => setShowAddUpiModal(false)} />
      </div>
    );
  }

  if (isLoading && !currentUser) {
    return (
      <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex items-center justify-center">
        <SplitRupeeLoader fullScreen={false} text="SplitRupee" subtext="Checking session..." />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex items-center justify-center">
        <SplitRupeeLoader fullScreen={false} text="SplitRupee" subtext="Redirecting to sign in..." />
      </div>
    );
  }

  // Authenticated Application Layout
  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col">
      <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
      {upiBanner}

      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 md:pl-64 flex flex-col min-w-0 overflow-hidden">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto pb-24 md:pb-10">
            <RouteBreadcrumb pathname={pathname} />
            {children}
          </main>
        </div>
      </div>

      <AddUpiModal isOpen={showAddUpiModal} onClose={() => setShowAddUpiModal(false)} />
      <OfflineSyncModal />
    </div>
  );
}
