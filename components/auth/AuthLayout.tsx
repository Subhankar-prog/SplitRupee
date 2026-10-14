"use client";

import React from "react";
import Link from "next/link";

import TravelAuthBackground from "@/components/auth/TravelAuthBackground";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-[100dvh] md:h-[100dvh] md:max-h-[100dvh] md:overflow-hidden w-full text-white flex flex-col justify-between relative selection:bg-emerald-500 selection:text-slate-950">
      {/* Moving Travel-Themed Background */}
      <TravelAuthBackground />

      {/* Top Bar with Clickable SplitRupee Logo on Top-Left */}
      <header className="w-full max-w-7xl mx-auto px-6 pt-3 pb-1 flex items-center justify-start z-20 shrink-0">
        <Link
          href="/"
          className="flex items-center gap-2.5 group transition-transform hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl p-1"
          aria-label="Back to SplitRupee Homepage"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 font-bold text-slate-950 text-base shadow-md shadow-emerald-500/20 group-hover:shadow-emerald-500/35 transition">
            ₹
          </div>
          <span className="font-bold tracking-tight text-white text-base group-hover:text-emerald-400 transition-colors">
            SplitRupee
          </span>
        </Link>
      </header>

      {/* Main Authentication Content (Vertically and Horizontally Centered, No Scroll on Desktop) */}
      <main className="flex-1 min-h-0 flex items-center justify-center px-4 py-1 z-10 w-full overflow-hidden">
        {children}
      </main>

      {/* Subtle Accessible Footer Note */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-2 text-center text-xs text-slate-400/80 shrink-0 z-20">
        <span>© {new Date().getFullYear()} SplitRupee · India's Smart Group Expense Manager</span>
      </footer>
    </div>
  );
}
