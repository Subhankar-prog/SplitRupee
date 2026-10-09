import React from "react";
import Link from "next/link";
import { Sparkles, ShieldCheck, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-slate-950 pt-16 pb-12 text-xs text-slate-400 overflow-hidden">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 h-48 w-[40rem] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl"
        aria-hidden
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
          {/* Col 1: Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 font-bold text-slate-950 shadow-lg shadow-emerald-500/20">
                <span className="text-lg">₹</span>
              </div>
              <span className="text-base font-bold text-white tracking-tight">
                SplitRupee
              </span>
            </Link>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              India's modern expense sharing platform. Split bills seamlessly with friends, roommates, and travel buddies with native 1-click UPI settlements.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] text-slate-300">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                <span>UPI Enabled</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] text-slate-300">
                <Sparkles className="h-3 w-3 text-teal-400" />
                <span>AI Bill OCR</span>
              </div>
            </div>
          </div>

          {/* Col 2: SplitRupee Features */}
          <div className="space-y-3">
            <p className="font-bold text-white uppercase text-[11px] tracking-wider">
              SplitRupee
            </p>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="hover:text-white transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/calculator" className="hover:text-white transition flex items-center gap-1">
                  Split Calculator
                  <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-bold text-emerald-400">
                    Free
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/pro" className="hover:text-white transition">
                  SplitRupee Pro
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition">
                  Blog & Guides
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Account & App */}
          <div className="space-y-3">
            <p className="font-bold text-white uppercase text-[11px] tracking-wider">
              Account
            </p>
            <ul className="space-y-2">
              <li>
                <Link href="/login" className="hover:text-white transition">
                  Log In
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-white transition">
                  Sign Up
                </Link>
              </li>
              <li>
                <Link href="/forgot-password" className="hover:text-white transition">
                  Reset Password
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition">
                  App Dashboard
                </Link>
              </li>
              <li>
                <Link href="/activity" className="hover:text-white transition">
                  Audit Activity
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Resources & Legal */}
          <div className="space-y-3">
            <p className="font-bold text-white uppercase text-[11px] tracking-wider">
              Resources
            </p>
            <ul className="space-y-2">
              <li>
                <Link href="/faq" className="hover:text-white transition">
                  FAQ & Support
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Decorative Geometric Mountain Polygon Banner matching the concept */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-slate-500">
            © {new Date().getFullYear()} SplitRupee App. Made with <Heart className="inline h-3 w-3 text-rose-500 fill-rose-500" /> in India - By Subhankar
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <Link href="/terms" className="hover:text-slate-300 transition">Terms</Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-slate-300 transition">Privacy</Link>
            <span>·</span>
            <Link href="/faq" className="hover:text-slate-300 transition">Security</Link>
          </div>
        </div>

        {/* Colorful Geometric Peaks Accent */}
        <div className="mt-8 flex h-2 w-full overflow-hidden rounded-full opacity-60">
          <div className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
          <div className="flex-1 bg-gradient-to-r from-teal-400 to-cyan-500" />
          <div className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
          <div className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
          <div className="flex-1 bg-gradient-to-r from-purple-500 to-rose-500" />
          <div className="flex-1 bg-gradient-to-r from-rose-500 to-amber-500" />
        </div>
      </div>
    </footer>
  );
}
