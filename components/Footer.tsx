import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-chrome)] pt-12 pb-10 text-xs text-[var(--text-secondary)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-12 lg:gap-10">
          {/* Column 1: Brand Identity */}
          <div className="col-span-2 md:col-span-4 space-y-3">
            <Link href="/" className="inline-flex items-center gap-2.5 w-fit">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-primary)] font-display font-bold text-[var(--brand-ink)]">
                <span className="text-base">₹</span>
              </div>
              <span className="font-display text-base font-bold text-[var(--text-primary)] tracking-tight">
                SplitRupee
              </span>
            </Link>
            <p className="text-xs text-[var(--text-secondary)] max-w-xs leading-relaxed">
              Shared expense tracking, debt simplification, and non-custodial UPI settlement links for Indian groups, flatmates, and trips.
            </p>
          </div>

          {/* Column 2: Product */}
          <div className="md:col-span-3 space-y-3">
            <p className="font-semibold text-[var(--text-primary)] text-xs">Product</p>
            <ul className="space-y-2.5">
              <li>
                <Link href="/#how-it-works" className="hover:text-[var(--brand-primary)] transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-[var(--brand-primary)] transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/calculator" className="hover:text-[var(--brand-primary)] transition-colors">
                  Split Calculator
                </Link>
              </li>
              <li>
                <Link href="/itinerary" className="hover:text-[var(--brand-primary)] transition-colors">
                  Trip Planner
                </Link>
              </li>
              <li>
                <Link href="/pro" className="hover:text-[var(--brand-primary)] transition-colors">
                  SplitRupee Pro
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div className="md:col-span-3 space-y-3">
            <p className="font-semibold text-[var(--text-primary)] text-xs">Resources</p>
            <ul className="space-y-2.5">
              <li>
                <Link href="/blog" className="hover:text-[var(--brand-primary)] transition-colors">
                  Guides &amp; Blog
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-[var(--brand-primary)] transition-colors">
                  FAQ &amp; Support
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[var(--brand-primary)] transition-colors">
                  About SplitRupee
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[var(--brand-primary)] transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Account & Legal */}
          <div className="col-span-2 md:col-span-2 space-y-3">
            <p className="font-semibold text-[var(--text-primary)] text-xs">Account &amp; Legal</p>
            <ul className="space-y-2.5">
              <li>
                <Link href="/login" className="hover:text-[var(--brand-primary)] transition-colors">
                  Log In
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-[var(--brand-primary)] transition-colors">
                  Sign Up
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[var(--brand-primary)] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[var(--brand-primary)] transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--text-secondary)]">
            © {new Date().getFullYear()} SplitRupee · Built in India
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-secondary)]">
            <Link href="/terms" className="hover:text-[var(--text-primary)] transition-colors">
              Terms
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/privacy" className="hover:text-[var(--text-primary)] transition-colors">
              Privacy
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/faq" className="hover:text-[var(--text-primary)] transition-colors">
              Security &amp; FAQ
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/contact" className="hover:text-[var(--text-primary)] transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
