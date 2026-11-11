import React from "react";
import Link from "next/link";
import { ShieldCheck, Sparkles, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] pt-14 pb-10 text-xs text-[var(--text-secondary)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
          {/* Col 1: Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 w-fit">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-dark)] dark:bg-[var(--brand-primary)] font-display font-bold text-white dark:text-[#171F1D] keep-white">
                <span className="text-lg">₹</span>
              </div>
              <span className="font-display text-base font-bold text-[var(--text-primary)] tracking-tight">
                SplitRupee
              </span>
            </Link>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm leading-relaxed">
              India&apos;s modern expense-sharing platform. Split bills transparently with friends, flatmates, and travel groups with one-click UPI settlements.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] px-2.5 py-0.5 text-[11px] text-[var(--text-primary)]">
                <ShieldCheck className="h-3 w-3 text-[var(--status-positive)]" />
                <span>UPI Enabled</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] px-2.5 py-0.5 text-[11px] text-[var(--text-primary)]">
                <Sparkles className="h-3 w-3 text-[var(--accent-sand)]" />
                <span>Smart Bill OCR</span>
              </div>
            </div>
          </div>

          {/* Col 2: Features */}
          <div className="space-y-3">
            <p className="font-semibold text-[var(--text-primary)] uppercase text-[11px] tracking-wider">
              SplitRupee
            </p>
            <ul className="space-y-2.5">
              <li>
                <Link href="/about" className="hover:text-[var(--text-primary)] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/calculator"
                  className="hover:text-[var(--text-primary)] transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Split Calculator</span>
                  <span className="rounded-full border border-[var(--status-positive-border)] bg-[var(--status-positive-bg)] px-1.5 py-0.2 text-[9px] font-semibold text-[var(--status-positive)]">
                    Free
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/pro" className="hover:text-[var(--text-primary)] transition-colors">
                  SplitRupee Pro
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-[var(--text-primary)] transition-colors">
                  Blog &amp; Guides
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Account */}
          <div className="space-y-3">
            <p className="font-semibold text-[var(--text-primary)] uppercase text-[11px] tracking-wider">
              Account
            </p>
            <ul className="space-y-2.5">
              <li>
                <Link href="/login" className="hover:text-[var(--text-primary)] transition-colors">
                  Log In
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-[var(--text-primary)] transition-colors">
                  Sign Up
                </Link>
              </li>
              <li>
                <Link href="/forgot-password" className="hover:text-[var(--text-primary)] transition-colors">
                  Reset Password
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[var(--text-primary)] transition-colors">
                  App Dashboard
                </Link>
              </li>
              <li>
                <Link href="/activity" className="hover:text-[var(--text-primary)] transition-colors">
                  Audit Activity
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Resources */}
          <div className="space-y-3">
            <p className="font-semibold text-[var(--text-primary)] uppercase text-[11px] tracking-wider">
              Resources
            </p>
            <ul className="space-y-2.5">
              <li>
                <Link href="/faq" className="hover:text-[var(--text-primary)] transition-colors">
                  FAQ &amp; Support
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[var(--text-primary)] transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[var(--text-primary)] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[var(--text-primary)] transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-[var(--text-secondary)]">
            © {new Date().getFullYear()} SplitRupee. Crafted with{" "}
            <Heart className="inline h-3 w-3 text-[var(--status-negative)] fill-[var(--status-negative)] mx-0.5" />{" "}
            in India · By Subhankar
          </p>
          <div className="flex items-center gap-4 text-[11px] text-[var(--text-secondary)]">
            <Link href="/terms" className="hover:text-[var(--text-primary)] transition-colors">
              Terms
            </Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-[var(--text-primary)] transition-colors">
              Privacy
            </Link>
            <span>·</span>
            <Link href="/faq" className="hover:text-[var(--text-primary)] transition-colors">
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
