"use client";

import React from "react";
import Link from "next/link";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/themeContext";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <div className="auth-layout min-h-[100dvh] w-full flex flex-col justify-between relative bg-[var(--bg-canvas)] text-[var(--text-primary)] selection:bg-[var(--brand-primary)] selection:text-[var(--brand-ink)] transition-colors duration-200">
      {/* Top Bar with Clickable SplitRupee Logo on Top-Left & Theme Toggle */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-2 flex items-center justify-between z-20 shrink-0">
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] rounded-xl p-1"
          aria-label="Back to SplitRupee Homepage"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-primary)] font-display font-bold text-[var(--brand-ink)] text-base transition-transform group-hover:scale-[1.03]">
            ₹
          </div>
          <span className="font-display font-semibold tracking-tight text-[var(--text-primary)] text-base">
            SplitRupee
          </span>
        </Link>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] transition-colors"
        >
          {isLight ? (
            <>
              <Moon className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
              <span className="hidden sm:inline">Dark Mode</span>
            </>
          ) : (
            <>
              <Sun className="h-3.5 w-3.5 text-[var(--accent-gold-ink)]" />
              <span className="hidden sm:inline">Light Mode</span>
            </>
          )}
        </button>
      </header>

      {/* Main Authentication Content */}
      <main className="flex-1 min-h-0 flex items-center justify-center px-4 py-4 z-10 w-full">
        {children}
      </main>

      {/* Subtle Accessible Footer Note */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-3 text-center text-xs text-[var(--text-secondary)] shrink-0 z-20">
        <span>© {new Date().getFullYear()} SplitRupee · Smart Group Expense Manager</span>
      </footer>
    </div>
  );
}
