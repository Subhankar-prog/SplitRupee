"use client";

import React, { useState } from "react";
import Link from "next/link";
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
  const { currentUser } = useUser();
  const [activeCategoryTab, setActiveCategoryTab] = useState<"trips" | "flats" | "couples" | "parties">("trips");

  const categoryHeadlines = {
    trips: { label: "Trips & Vacations 🌴", desc: "Keep track of Goa villas, car rentals, food, and fuel without awkward chats." },
    flats: { label: "Flatmates & Rent 🏠", desc: "Split electricity, maid salary, groceries, and Wi-Fi bills cleanly each month." },
    couples: { label: "Couples & Dates 💖", desc: "Track dinner dates, movies, and shared shopping fairly." },
    parties: { label: "Dinners & Parties 🍕", desc: "Split restaurant bills with 10 friends and let everyone pay via UPI in seconds." },
  };

  return (
    <div className="space-y-24 pb-20 animate-in fade-in duration-300">
      {/* 1. HERO SECTION */}
      <section className="relative pt-8 pb-14 text-center lg:py-20 overflow-hidden">
        {/* Ambient background glows */}
        <div
          className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[50rem] -translate-x-1/2 rounded-full bg-emerald-500/15 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute top-40 -left-20 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute top-40 -right-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl"
          aria-hidden
        />

        <div className="relative mx-auto max-w-4xl space-y-6 px-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 backdrop-blur-xl">
            <Sparkles className="h-3.5 w-3.5" />
            <span>The Modern Splitwise for India 🇮🇳</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl sm:leading-[1.12]">
            Less stress when sharing expenses{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              on trips & with flatmates.
            </span>
          </h1>

          {/* Interactive Category Selector Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {[
              { id: "trips", icon: Plane, label: "Trips", color: "text-purple-400" },
              { id: "flats", icon: Home, label: "Housemates", color: "text-sky-400" },
              { id: "couples", icon: Heart, label: "Couples", color: "text-rose-400" },
              { id: "parties", icon: Tag, label: "Dinners & Friends", color: "text-amber-400" },
            ].map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategoryTab === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryTab(cat.id as any)}
                  className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-semibold border transition-all ${
                    isActive
                      ? "border-emerald-500 bg-emerald-500/15 text-white shadow-lg shadow-emerald-500/10"
                      : "border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${cat.color}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          <p className="mx-auto max-w-2xl text-sm sm:text-base text-slate-400 leading-relaxed">
            {categoryHeadlines[activeCategoryTab].desc} Keep track of balances, attach bill photos, minimize group debts, and settle up in 1 tap via Google Pay, PhonePe, or Paytm.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            {currentUser ? (
              <>
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 px-8 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-emerald-500/25 hover:opacity-95 active:scale-95 transition"
                >
                  <span>Open Dashboard ({currentUser.name})</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
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
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-8 py-3.5 text-sm font-bold text-white hover:bg-white/10 transition"
                >
                  <span>Recent Activity Feed</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 px-8 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-emerald-500/25 hover:opacity-95 active:scale-95 transition"
                >
                  <span>Sign up for free</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
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
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-3.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition"
            >
              <span>Split Calculator</span>
            </Link>
          </div>

          <div className="pt-2 flex items-center justify-center gap-4 text-[11px] text-slate-500">
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
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
            Built for Real-World Spending
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Everything you need to share expenses effortlessly
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Four powerful features designed specifically for the way Indian groups travel, live, and settle up.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* FEATURE 1: Track Balances */}
          <div className="flex flex-col justify-between rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 sm:p-8 backdrop-blur-xl hover:border-emerald-500/30 transition group space-y-6">
            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Track Balances & Simplified Debts</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Keep track of shared expenses, balances, and who owes whom. Our graph debt minimization automatically turns messy 20-way payments into 2 clean transfers.
              </p>
            </div>

            {/* Mockup Preview 1 */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-4 space-y-2.5 shadow-inner">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pb-2 border-b border-white/10">
                <span>Friend Balances</span>
                <span className="text-emerald-400">Net: +₹2,400.00</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white/5 p-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-lg bg-rose-500 text-slate-950 font-bold grid place-items-center text-[11px]">D</span>
                  <div>
                    <p className="font-semibold text-white">Diya</p>
                    <p className="text-[10px] text-emerald-400">owes you ₹1,200</p>
                  </div>
                </div>
                <span className="font-bold text-emerald-400">+₹1,200.00</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white/5 p-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-lg bg-sky-500 text-slate-950 font-bold grid place-items-center text-[11px]">K</span>
                  <div>
                    <p className="font-semibold text-white">Kabir</p>
                    <p className="text-[10px] text-emerald-400">owes you ₹1,200</p>
                  </div>
                </div>
                <span className="font-bold text-emerald-400">+₹1,200.00</span>
              </div>
            </div>
          </div>

          {/* FEATURE 2: Organize Expenses */}
          <div className="flex flex-col justify-between rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 sm:p-8 backdrop-blur-xl hover:border-teal-500/30 transition group space-y-6">
            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Organize Any Group</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Split expenses with any circle: flatmates, trip squads, couples, and family. Share instant WhatsApp invite links or scannable QR codes for 1-click joining.
              </p>
            </div>

            {/* Mockup Preview 2 */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-4 space-y-2.5 shadow-inner">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pb-2 border-b border-white/10">
                <span>Active Groups</span>
                <span className="text-teal-400">3 Active</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white/5 p-2.5 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🌴</span>
                  <div>
                    <p className="font-semibold text-white">Goa Beach Trip 2026</p>
                    <p className="text-[10px] text-slate-400">4 members · Total ₹14,800</p>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">Settled</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white/5 p-2.5 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🏠</span>
                  <div>
                    <p className="font-semibold text-white">Flat 402 Koramangala</p>
                    <p className="text-[10px] text-slate-400">3 members · Total ₹36,500</p>
                  </div>
                </div>
                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">Pending</span>
              </div>
            </div>
          </div>

          {/* FEATURE 3: Add Expenses Easily */}
          <div className="flex flex-col justify-between rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 sm:p-8 backdrop-blur-xl hover:border-sky-500/30 transition group space-y-6">
            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Receipt className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Add Expenses Easily</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Quickly add expenses before you forget. Split equally, by exact rupee amounts, or percentages, and attach camera photos of food and fuel receipts.
              </p>
            </div>

            {/* Mockup Preview 3 */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-4 space-y-3 shadow-inner">
              <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
                <span className="font-semibold text-slate-200">Taxi to Anjuna Beach</span>
                <span className="font-extrabold text-emerald-400 text-sm">₹1,500.00</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                <div className="rounded-lg bg-emerald-500/20 border border-emerald-500/30 p-2 text-emerald-300 font-bold">
                  Equally (₹500 ea)
                </div>
                <div className="rounded-lg bg-white/5 border border-white/10 p-2 text-slate-400">
                  Exact ₹
                </div>
                <div className="rounded-lg bg-white/5 border border-white/10 p-2 text-slate-400">
                  By %
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1"><Camera className="h-3.5 w-3.5 text-emerald-400" /> Receipt Attached</span>
                <span className="text-slate-300 font-medium">Paid by Aarav</span>
              </div>
            </div>
          </div>

          {/* FEATURE 4: Pay Friends Back */}
          <div className="flex flex-col justify-between rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 sm:p-8 backdrop-blur-xl hover:border-amber-500/30 transition group space-y-6">
            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Smartphone className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Pay Friends Back in 1 Tap</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Settle up directly with 1-click UPI links to Google Pay, PhonePe, Paytm, or BHIM. Zero manual UPI typing errors, zero transaction delays.
              </p>
            </div>

            {/* Mockup Preview 4 */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-4 space-y-3 shadow-inner">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Settle up with Aarav</span>
                <span className="text-base font-extrabold text-white">₹1,200.00</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex items-center justify-center gap-1 rounded-xl bg-white/5 border border-white/10 p-2 text-[10px] font-bold text-white">
                  <span>Google Pay</span>
                </div>
                <div className="flex items-center justify-center gap-1 rounded-xl bg-white/5 border border-white/10 p-2 text-[10px] font-bold text-white">
                  <span>PhonePe</span>
                </div>
                <div className="flex items-center justify-center gap-1 rounded-xl bg-white/5 border border-white/10 p-2 text-[10px] font-bold text-white">
                  <span>Paytm / QR</span>
                </div>
              </div>
              <div className="text-[10px] text-center text-emerald-400 font-semibold bg-emerald-500/10 py-1.5 rounded-lg">
                ✓ Pre-filled UPI intent (aarav@okaxis)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SPLITRUPEE PRO SHOWCASE SECTION (MATCHING CONCEPT) */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 p-8 sm:p-12 overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12 items-center">
            <div className="md:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-400">
                <Crown className="h-3.5 w-3.5" />
                <span>SplitRupee Pro Upgrade</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Get even more with PRO
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Unlock instant AI receipt scanning, category spending graphs, 100+ live forex currency conversions, Excel ledgers, and priority support for just ₹49/month.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/pro"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 px-6 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:opacity-95 transition"
                >
                  <span>Explore Pro Features</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>

                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-xs font-bold text-white hover:bg-white/10 transition"
                >
                  <span>Start 14-Day Free Trial</span>
                </Link>
              </div>
            </div>

            {/* Pro Mockup Card */}
            <div className="md:col-span-5 rounded-2xl border border-white/15 bg-slate-900/90 p-5 space-y-3 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">AI Receipt OCR Scan</span>
                </div>
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                  Instant
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>3x Grilled Fish Tikka</span>
                  <span className="font-semibold">₹1,350</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>4x Kingfisher Premium</span>
                  <span className="font-semibold">₹960</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>GST & Service Charge (10%)</span>
                  <span>₹231</span>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between font-bold text-amber-400">
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
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">
            Complete Feature Matrix
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            The whole nine yards
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Compare core free features vs pro capabilities.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 text-xs font-semibold text-slate-300">
          {[
            { name: "Add groups & friends", pro: false },
            { name: "1-Click UPI deep linking", pro: false },
            { name: "Simplify debts algorithm", pro: false },
            { name: "Equal & exact splits", pro: false },
            { name: "Percentage splits", pro: false },
            { name: "WhatsApp shareable links", pro: false },
            { name: "Dynamic QR code settle", pro: false },
            { name: "Full audit task feed", pro: false },
            { name: "Soft delete & recovery", pro: false },
            { name: "Ghost member linking", pro: false },
            { name: "Real-time SSE sync", pro: false },
            { name: "Unlimited expenses", pro: false },
            { name: "Bill & Receipt OCR", pro: true },
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
              className={`flex items-center gap-2.5 rounded-2xl border p-3.5 transition ${
                item.pro
                  ? "border-amber-500/25 bg-amber-500/[0.03] text-slate-200"
                  : "border-white/10 bg-white/[0.02] text-slate-300"
              }`}
            >
              {item.pro ? (
                <Crown className="h-4 w-4 shrink-0 text-amber-400" />
              ) : (
                <Check className="h-4 w-4 shrink-0 text-emerald-400 stroke-[3]" />
              )}
              <span className="truncate">{item.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 5. PRESS & USER TESTIMONIALS (MATCHING SPLITWISE CONCEPT) */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">
            Loved by Groups
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            What travelers & flatmates are saying
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 space-y-4 flex flex-col justify-between">
            <p className="text-xs text-slate-300 leading-relaxed italic">
              "Fundamental for managing shared vacation houses. Makes splitting a 4-day Goa villa and Thar rental effortlessly transparent."
            </p>
            <div className="flex items-center justify-between border-t border-white/5 pt-3">
              <span className="font-bold text-white text-xs">Financial Times</span>
              <div className="flex text-amber-400 text-xs">★★★★★</div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 space-y-4 flex flex-col justify-between">
            <p className="text-xs text-slate-300 leading-relaxed italic">
              "SplitRupee's 1-tap UPI settlement is a godsend in India. No more copying VPAs into Google Pay manually."
            </p>
            <div className="flex items-center justify-between border-t border-white/5 pt-3">
              <span className="font-bold text-white text-xs">Economic Times</span>
              <div className="flex text-amber-400 text-xs">★★★★★</div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 space-y-4 flex flex-col justify-between">
            <p className="text-xs text-slate-300 leading-relaxed italic">
              "Eliminates fight over who paid for groceries or Wi-Fi. We use it for our 3BHK flat in Koramangala every single day."
            </p>
            <div className="flex items-center justify-between border-t border-white/5 pt-3">
              <span className="font-bold text-white text-xs">Tech In Asia</span>
              <div className="flex text-amber-400 text-xs">★★★★★</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
