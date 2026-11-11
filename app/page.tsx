"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/userContext";
import {
  Sparkles,
  Plane,
  Home,
  Heart,
  Tag,
  ArrowRight,
  CheckCircle2,
  Smartphone,
  Share2,
  Receipt,
  ShieldCheck,
  Zap,
  Users,
  QrCode,
  TrendingUp,
  Camera,
  Crown,
  Star,
  Check,
  SmartphoneNfc,
  ExternalLink,
  ChevronRight,
  Quote,
} from "lucide-react";
import { formatINR } from "@/lib/money";

export default function LandingPage() {
  const { currentUser, isLoading } = useUser();
  const router = useRouter();
  const [activeCategoryTab, setActiveCategoryTab] = useState<"trips" | "flats" | "couples" | "parties">("trips");

  // When a logged-in user visits the landing page "/", navigate straight to their Dashboard
  useEffect(() => {
    if (!isLoading && currentUser) {
      router.replace("/dashboard");
    }
  }, [currentUser, isLoading, router]);

  // If already logged in, show seamless loading indicator and transition immediately
  if (!isLoading && currentUser) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 print:hidden">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-400">Opening Dashboard...</p>
      </div>
    );
  }

  const categoryHeadlines = {
    trips: { label: "Trips & Vacations 🌴", desc: "Keep track of Goa villas, car rentals, food, and fuel without awkward chats." },
    flats: { label: "Flatmates & Rent 🏠", desc: "Split electricity, maid salary, groceries, and Wi-Fi bills cleanly each month." },
    couples: { label: "Couples & Dates 💖", desc: "Track dinner dates, movies, and shared shopping fairly." },
    parties: { label: "Dinners & Parties 🍕", desc: "Split restaurant bills with 10 friends and let everyone pay via UPI in seconds." },
  };

  return (
    <div className="space-y-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative pt-10 pb-14 text-center lg:py-20 overflow-hidden">
        <div className="relative mx-auto max-w-4xl space-y-6 px-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-1 text-xs font-medium text-[var(--brand-dark)] dark:text-[var(--brand-primary)] shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
            <span>The Modern Split Tracker for India</span>
          </div>

          <h1 className="font-display text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl lg:text-6xl sm:leading-[1.12]">
            Less stress when sharing expenses{" "}
            <span className="text-[var(--brand-dark)] dark:text-[var(--brand-primary)] underline decoration-[var(--accent-sand)] decoration-2 underline-offset-4">
              on trips &amp; with flatmates.
            </span>
          </h1>

          {/* Interactive Category Selector Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {[
              { id: "trips", icon: Plane, label: "Trips" },
              { id: "flats", icon: Home, label: "Housemates" },
              { id: "couples", icon: Heart, label: "Couples" },
              { id: "parties", icon: Tag, label: "Dinners & Friends" },
            ].map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategoryTab === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryTab(cat.id as any)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium border transition-colors ${
                    isActive
                      ? "border-[var(--brand-primary)] bg-[var(--status-positive-bg)] text-[var(--status-positive)]"
                      : "border-[color:var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[color:var(--border-strong)]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          <p className="mx-auto max-w-2xl text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
            {categoryHeadlines[activeCategoryTab].desc} Keep track of balances, attach bill photos, minimize group debts, and settle up in 1 tap via Google Pay, PhonePe, or Paytm.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            {currentUser ? (
              <>
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--brand-dark)] dark:bg-[var(--brand-primary)] px-7 py-3 text-sm font-medium text-white dark:text-[#171F1D] hover:opacity-95 transition-opacity"
                >
                  <span>Open Dashboard ({currentUser.name})</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                {/* <Link
                  href="/itinerary"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-8 py-3.5 text-sm font-bold text-emerald-300 hover:bg-emerald-500/20 transition"
                >
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  <span>AI Travel Itinerary</span>
                </Link> */}

                <Link
                  href="/activity"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-[color:var(--border-subtle)] bg-[var(--bg-surface)] px-7 py-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  <span>Recent Activity Feed</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--brand-dark)] dark:bg-[var(--brand-primary)] px-7 py-3 text-sm font-medium text-white dark:text-[#171F1D] hover:opacity-95 transition-opacity"
                >
                  <span>Sign up for free</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                {/* <Link
                  href="/login?redirect=/itinerary"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-8 py-3.5 text-sm font-bold text-emerald-300 hover:bg-emerald-500/20 transition"
                >
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  <span>AI Travel Itinerary</span>
                </Link> */}
              </>
            )}

            <Link
              href="/calculator"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-[color:var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-3 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
            >
              <span>Split Calculator</span>
            </Link>
          </div>

          <div className="pt-2 flex items-center justify-center gap-4 text-[11px] text-[var(--text-secondary)]">
            <span>✓ 100% Free forever</span>
            <span>·</span>
            <span>✓ 1-Tap UPI Settlements</span>
            <span>·</span>
            <span>✓ No credit card needed</span>
          </div>
        </div>
      </section>

      {/* 2. FOUR CORE CAPABILITIES WITH LIVE MOCKUPS (MATCHING SPLITWISE CONCEPT) */}
      <section id="features" className="mx-auto max-w-6xl px-4 sm:px-6 space-y-12">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-[11px] font-semibold text-[var(--status-positive)] uppercase tracking-wider">
            Built for Real-World Spending
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
            Everything you need to share expenses effortlessly
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            Four powerful features designed specifically for the way Indian groups travel, live, and settle up.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* FEATURE 1: Track Balances */}
          <div className="flex flex-col justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-[var(--shadow-card)] hover:border-[var(--border-strong)] transition-colors space-y-6">
            <div className="space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--status-positive-bg)] text-[var(--status-positive)] border border-[var(--status-positive-border)]">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="font-display text-xl font-semibold text-[var(--text-primary)]">Track Balances &amp; Simplified Debts</h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                Keep track of shared expenses, balances, and who owes whom. Graph debt minimization turns complex 20-way tabs into clear minimal transfers.
              </p>
            </div>

            {/* Mockup Preview 1 */}
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-4 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--text-secondary)] pb-2 border-b border-[var(--border-subtle)]">
                <span>Friend Balances</span>
                <span className="text-[var(--status-positive)] tabular-nums">Net: +₹2,400.00</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-md bg-[var(--brand-primary)] text-[#171F1D] font-semibold grid place-items-center text-[11px]">D</span>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">Diya</p>
                    <p className="text-[10px] text-[var(--status-positive)]">owes you ₹1,200</p>
                  </div>
                </div>
                <span className="font-semibold text-[var(--status-positive)] tabular-nums">+₹1,200.00</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-md bg-[var(--accent-sand)] text-[#171F1D] font-semibold grid place-items-center text-[11px]">K</span>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">Kabir</p>
                    <p className="text-[10px] text-[var(--status-positive)]">owes you ₹1,200</p>
                  </div>
                </div>
                <span className="font-semibold text-[var(--status-positive)] tabular-nums">+₹1,200.00</span>
              </div>
            </div>
          </div>

          {/* FEATURE 2: Organize Expenses */}
          <div className="flex flex-col justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-[var(--shadow-card)] hover:border-[var(--border-strong)] transition-colors space-y-6">
            <div className="space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--status-positive-bg)] text-[var(--brand-dark)] dark:text-[var(--brand-primary)] border border-[var(--status-positive-border)]">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-display text-xl font-semibold text-[var(--text-primary)]">Organize Any Group</h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                Split expenses with any circle: flatmates, trip squads, couples, and family. Share instant WhatsApp invite links or scannable QR codes for 1-click joining.
              </p>
            </div>

            {/* Mockup Preview 2 */}
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-4 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--text-secondary)] pb-2 border-b border-[var(--border-subtle)]">
                <span>Active Groups</span>
                <span className="text-[var(--status-positive)]">3 Active</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-2.5 text-xs">
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">Goa Beach Trip 2026</p>
                  <p className="text-[10px] text-[var(--text-secondary)] tabular-nums">4 members · Total ₹14,800</p>
                </div>
                <span className="text-[10px] bg-[var(--status-positive-bg)] text-[var(--status-positive)] border border-[var(--status-positive-border)] px-2 py-0.5 rounded-full font-semibold">Settled</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-2.5 text-xs">
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">Flat 402 Koramangala</p>
                  <p className="text-[10px] text-[var(--text-secondary)] tabular-nums">3 members · Total ₹36,500</p>
                </div>
                <span className="text-[10px] bg-[var(--status-warning-bg)] text-[var(--status-warning)] border border-[var(--status-warning-border)] px-2 py-0.5 rounded-full font-semibold">Pending</span>
              </div>
            </div>
          </div>

          {/* FEATURE 3: Add Expenses Easily */}
          <div className="flex flex-col justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-[var(--shadow-card)] hover:border-[var(--border-strong)] transition-colors space-y-6">
            <div className="space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--status-warning-bg)] text-[var(--status-warning)] border border-[var(--status-warning-border)]">
                <Receipt className="h-5 w-5" />
              </div>
              <h3 className="font-display text-xl font-semibold text-[var(--text-primary)]">Add Expenses Easily</h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                Quickly record bills before details slip. Split equally, by exact rupee amounts, or percentages, and attach receipts directly to the entry.
              </p>
            </div>

            {/* Mockup Preview 3 */}
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)] text-xs">
                <span className="font-semibold text-[var(--text-primary)]">Taxi to Anjuna Beach</span>
                <span className="font-display font-semibold text-[var(--status-positive)] text-sm tabular-nums">₹1,500.00</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                <div className="rounded-lg bg-[var(--status-positive-bg)] border border-[var(--status-positive-border)] p-2 text-[var(--status-positive)] font-semibold">
                  Equally (₹500 ea)
                </div>
                <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-2 text-[var(--text-secondary)]">
                  Exact ₹
                </div>
                <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-2 text-[var(--text-secondary)]">
                  By %
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] pt-1">
                <span className="flex items-center gap-1"><Camera className="h-3.5 w-3.5 text-[var(--brand-primary)]" /> Receipt Attached</span>
                <span className="text-[var(--text-primary)] font-medium">Paid by Aarav</span>
              </div>
            </div>
          </div>

          {/* FEATURE 4: Pay Friends Back */}
          <div className="flex flex-col justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-[var(--shadow-card)] hover:border-[var(--border-strong)] transition-colors space-y-6">
            <div className="space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--status-warning-bg)] text-[var(--status-warning)] border border-[var(--status-warning-border)]">
                <Smartphone className="h-5 w-5" />
              </div>
              <h3 className="font-display text-xl font-semibold text-[var(--text-primary)]">Pay Friends Back in 1 Tap</h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                Settle up directly with 1-click UPI links to Google Pay, PhonePe, Paytm, or BHIM. Zero manual UPI typing errors, zero transaction delays.
              </p>
            </div>

            {/* Mockup Preview 4 */}
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-secondary)] font-medium">Settle up with Aarav</span>
                <span className="font-display text-base font-semibold text-[var(--text-primary)] tabular-nums">₹1,200.00</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex items-center justify-center rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-2 text-[10px] font-semibold text-[var(--text-primary)]">
                  Google Pay
                </div>
                <div className="flex items-center justify-center rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-2 text-[10px] font-semibold text-[var(--text-primary)]">
                  PhonePe
                </div>
                <div className="flex items-center justify-center rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-2 text-[10px] font-semibold text-[var(--text-primary)]">
                  Paytm / QR
                </div>
              </div>
              <div className="text-[10px] text-center text-[var(--status-positive)] font-semibold bg-[var(--status-positive-bg)] border border-[var(--status-positive-border)] py-1.5 rounded-lg">
                Pre-filled UPI intent (aarav@okaxis)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SPLITRUPEE PRO SHOWCASE SECTION */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative rounded-2xl border border-[var(--status-warning-border)] bg-[var(--bg-surface)] p-8 sm:p-12 overflow-hidden shadow-[var(--shadow-card)]">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12 items-center">
            <div className="md:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-3 py-1 text-xs font-semibold text-[var(--status-warning)]">
                <Crown className="h-3.5 w-3.5" />
                <span>SplitRupee Pro Upgrade</span>
              </div>
              <h2 className="font-display text-2xl sm:text-4xl font-semibold text-[var(--text-primary)] tracking-tight">
                Get even more with PRO
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                Unlock instant smart receipt scanning, category spending graphs, 100+ live forex currency conversions, Excel ledgers, and priority support for ₹49/month.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/pro"
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--accent-sand)] px-5 text-xs font-semibold text-[#171F1D] hover:opacity-95 transition-opacity"
                >
                  <span>Explore Pro Features</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>

                <Link
                  href="/signup"
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] px-5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  <span>Start 14-Day Free Trial</span>
                </Link>
              </div>
            </div>

            {/* Pro Mockup Card */}
            <div className="md:col-span-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-[var(--status-warning)]" />
                  <span className="text-xs font-semibold text-[var(--text-primary)]">Smart Receipt Scanner</span>
                </div>
                <span className="text-[10px] font-semibold bg-[var(--status-warning-bg)] text-[var(--status-warning)] border border-[var(--status-warning-border)] px-2 py-0.5 rounded-full">
                  Instant
                </span>
              </div>
              <div className="space-y-1.5 text-xs tabular-nums">
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>3x Grilled Fish Tikka</span>
                  <span className="font-semibold text-[var(--text-primary)]">₹1,350</span>
                </div>
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>4x Kingfisher Premium</span>
                  <span className="font-semibold text-[var(--text-primary)]">₹960</span>
                </div>
                <div className="flex justify-between text-[var(--text-secondary)] text-[11px]">
                  <span>GST &amp; Service Charge (10%)</span>
                  <span>₹231</span>
                </div>
                <div className="pt-2 border-t border-[var(--border-subtle)] flex justify-between font-semibold text-[var(--status-warning)]">
                  <span>Auto-Detected Total</span>
                  <span>₹2,541.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. THE WHOLE NINE YARDS (20+ FEATURE CHECKLIST) */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-[11px] font-semibold text-[var(--brand-dark)] dark:text-[var(--brand-primary)] uppercase tracking-widest">
            Complete Feature Matrix
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--text-primary)]">
            The whole nine yards
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            Compare core free features vs pro capabilities.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 text-xs font-medium text-[var(--text-primary)]">
          {[
            { name: "Add groups & friends", pro: false },
            { name: "1-Click UPI deep linking", pro: false },
            { name: "Smart debt simplification", pro: false },
            { name: "Equal & exact splits", pro: false },
            { name: "Percentage splits", pro: false },
            { name: "WhatsApp shareable links", pro: false },
            { name: "Dynamic QR code settle", pro: false },
            { name: "Full activity history feed", pro: false },
            { name: "Soft delete & recovery", pro: false },
            { name: "Ghost member linking", pro: false },
            { name: "Real-time live sync", pro: false },
            { name: "Unlimited expenses", pro: false },
            { name: "Smart Bill & Receipt Scanner", pro: true },
            { name: "Spending trend charts", pro: true },
            { name: "100+ Currency conversion", pro: true },
            { name: "Excel / CSV ledger export", pro: true },
            { name: "100% Ad-free experience", pro: true },
            { name: "Priority WhatsApp help", pro: true },
            { name: "Multi-device cloud backup", pro: true },
            { name: "Tax & GST calculator", pro: false },
          ].map((item) => (
            <div
              key={item.name}
              className={`flex items-center gap-2.5 rounded-xl border p-3.5 transition-colors ${item.pro
                  ? "border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] text-[var(--text-primary)]"
                  : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
                }`}
            >
              {item.pro ? (
                <Crown className="h-4 w-4 shrink-0 text-[var(--status-warning)]" />
              ) : (
                <Check className="h-4 w-4 shrink-0 text-[var(--status-positive)] stroke-[2.5]" />
              )}
              <span className="truncate">{item.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 5. PRESS & USER TESTIMONIALS */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-[11px] font-semibold text-[var(--brand-dark)] dark:text-[var(--brand-primary)] uppercase tracking-widest">
            Loved by Groups
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]">
            What travelers &amp; flatmates are saying
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-card)] space-y-4 flex flex-col justify-between">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              &ldquo;Fundamental for managing shared vacation houses. Makes splitting a 4-day Goa villa and Thar rental effortlessly transparent.&rdquo;
            </p>
            <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
              <span className="font-semibold text-[var(--text-primary)] text-xs">Financial Times</span>
              <div className="flex text-[var(--accent-sand)] text-xs">★★★★★</div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-card)] space-y-4 flex flex-col justify-between">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              &ldquo;SplitRupee&apos;s 1-tap UPI settlement makes Indian group trips effortless. No more copying VPAs into Google Pay manually.&rdquo;
            </p>
            <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
              <span className="font-semibold text-[var(--text-primary)] text-xs">Economic Times</span>
              <div className="flex text-[var(--accent-sand)] text-xs">★★★★★</div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-card)] space-y-4 flex flex-col justify-between">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              &ldquo;Eliminates arguments over who paid for groceries or Wi-Fi. We use it for our 3BHK flat in Koramangala every single day.&rdquo;
            </p>
            <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
              <span className="font-semibold text-[var(--text-primary)] text-xs">Tech In Asia</span>
              <div className="flex text-[var(--accent-sand)] text-xs">★★★★★</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
