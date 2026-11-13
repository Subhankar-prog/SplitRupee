"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/userContext";
import ThemeScreenshot from "@/components/landing/ThemeScreenshot";
import ScrollReveal from "@/components/ui/ScrollReveal";
import SplitRupeeLoader from "@/components/SplitRupeeLoader";
import {
  Plane,
  Home,
  Users,
  Heart,
  Utensils,
  Check,
  ShieldCheck,
  Calculator,
  Camera,
  Repeat,
  FileText,
  WifiOff,
  QrCode,
  Compass,
  ArrowRight,
  Calendar,
  Sparkles,
} from "lucide-react";

type UseCaseId = "trips" | "flats" | "friends" | "couples" | "dinners";
type ShowcaseTabId = "passbook" | "upi" | "distribution";

const USE_CASES: Array<{
  id: UseCaseId;
  label: string;
  icon: typeof Plane;
  headline: string;
  summary: string;
  highlights: string[];
  sampleTitle: string;
  sampleRows: Array<{ item: string; payer: string; split: string; amount: string }>;
  sampleResult: string;
}> = [
  {
    id: "trips",
    label: "Trips with friends",
    icon: Plane,
    headline: "Road trips, flights, villas, and highway fuel",
    summary:
      "Log bookings, hotel stays, fuel, and meals as they happen. Invite friends with a simple link or QR code — even if they sign up after returning.",
    highlights: [
      "Share a group invite link on WhatsApp so everyone sees the live balance.",
      "Support for 127 currencies with instant Indian Rupee (INR) reference totals.",
      "Log expenses offline on remote highways; syncs automatically once back online.",
    ],
    sampleTitle: "Goa Weekend Trip (3 members)",
    sampleRows: [
      { item: "Beachside Villa Stay", payer: "Member A", split: "Equal (3 ways)", amount: "₹6,000" },
      { item: "Vande Bharat Rail & Cabs", payer: "Member B", split: "Equal (3 ways)", amount: "₹3,000" },
      { item: "Seafood Shack Dinner", payer: "Member A", split: "Equal (3 ways)", amount: "₹4,200" },
    ],
    sampleResult: "Consolidated to 2 direct UPI transfers at checkout.",
  },
  {
    id: "flats",
    label: "Shared apartments",
    icon: Home,
    headline: "Monthly rent, electricity, Wi-Fi, and groceries",
    summary:
      "Keep household contributions clear all month without digging through chat messages. Split unequal room rents and shared groceries without awkwardness.",
    highlights: [
      "Split uneven room rents by exact rupee amounts or custom percentages.",
      "Divide Wi-Fi, electricity, water cans, and cook salaries equally.",
      "Download a clean PDF or CSV summary on the 1st of every month.",
    ],
    sampleTitle: "Koramangala Flat (3 flatmates)",
    sampleRows: [
      { item: "Monthly Apartment Rent", payer: "Member A", split: "Exact room shares", amount: "₹36,000" },
      { item: "Fiber Wi-Fi & Electricity", payer: "Member B", split: "Equal (3 ways)", amount: "₹3,300" },
      { item: "Kitchen & Groceries", payer: "Member C", split: "Equal (3 ways)", amount: "₹4,500" },
    ],
    sampleResult: "Clear month-end balance showing who pays whom.",
  },
  {
    id: "friends",
    label: "Friend circles",
    icon: Users,
    headline: "Weekend outings, party pools, and group gifts",
    summary:
      "Track ongoing tabs with close friends across multiple hangouts without sending awkward reminder messages every couple of days.",
    highlights: [
      "Cross-group balance totals appear together on your main dashboard.",
      "Smart debt simplification eliminates A-pays-B-pays-C chains automatically.",
      "Full edit history visible to everyone whenever a bill needs updating.",
    ],
    sampleTitle: "Concert & Weekend Outing (4 friends)",
    sampleRows: [
      { item: "Group Event Passes", payer: "Member A", split: "Equal (4 ways)", amount: "₹8,000" },
      { item: "Birthday Gift Contribution", payer: "Member D", split: "Exact amounts", amount: "₹2,400" },
    ],
    sampleResult: "Balances updated immediately for every friend.",
  },
  {
    id: "couples",
    label: "Couples",
    icon: Heart,
    headline: "Shared home supplies, travel bookings, and dinner dates",
    summary:
      "Use a private two-person ledger to stay fair on bigger bookings and daily errands without keeping mental tallies.",
    highlights: [
      "Split 50/50 equally or choose custom shares based on preference.",
      "Attach bill receipts directly to expenses for easy reference.",
      "View clear balances anytime with zero confusion.",
    ],
    sampleTitle: "Shared Home & Dates (2 partners)",
    sampleRows: [
      { item: "Weekend Grocery Run", payer: "Partner A", split: "50% / 50%", amount: "₹2,600" },
      { item: "Dinner & Movie Tickets", payer: "Partner B", split: "50% / 50%", amount: "₹1,800" },
    ],
    sampleResult: "Only ₹400 difference remaining to settle.",
  },
  {
    id: "dinners",
    label: "Group outings & food",
    icon: Utensils,
    headline: "Team lunches, group dinners, and food bills",
    summary:
      "Split a dinner bill in seconds using the free Split Calculator before creating a group, or record itemized orders directly into your group ledger.",
    highlights: [
      "Calculate dish totals plus GST and tips with zero signup needed.",
      "Copy a clean summary message directly into WhatsApp.",
      "Settle shares directly via Google Pay, PhonePe, Paytm, or BHIM.",
    ],
    sampleTitle: "Team Dinner (6 diners)",
    sampleRows: [
      { item: "Main Course & Platters", payer: "Host", split: "Equal + GST/Tip", amount: "₹5,400" },
      { item: "Dessert Table", payer: "Host", split: "3 people", amount: "₹900" },
    ],
    sampleResult: "Per-person shares calculated down to exact rupees.",
  },
];

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Create a group",
    desc: "Start a group for a trip, flatmates, friends, or couple and invite members via link or QR code.",
  },
  {
    step: "02",
    title: "Add shared expenses",
    desc: "Record who paid and split equally, by exact rupee amounts, or by custom percentages.",
  },
  {
    step: "03",
    title: "See who owes whom",
    desc: "View each member's total spend, fair share, and net balance in a clear live ledger.",
  },
  {
    step: "04",
    title: "Simplify group debts",
    desc: "Automatically collapse circular IOUs so everyone settles with the fewest possible transfers.",
  },
  {
    step: "05",
    title: "Settle up via UPI or cash",
    desc: "Pay in one tap using Google Pay, PhonePe, or Paytm with pre-filled amounts, or record cash.",
  },
];

const SHOWCASE_VIEWS: Array<{
  id: ShowcaseTabId;
  label: string;
  caption: string;
  lightSrc: string;
  darkSrc: string;
  width: number;
  height: number;
  mobileLightSrc?: string;
  mobileDarkSrc?: string;
  mobileWidth?: number;
  mobileHeight?: number;
}> = [
  {
    id: "passbook",
    label: "Group Ledger & Balances",
    caption:
      "Live ledger summarizing total spend, fair shares, and direct settlement transfers.",
    lightSrc: "/images/showcase/group-passbook-light.png",
    darkSrc: "/images/showcase/group-passbook-dark.png",
    width: 1920,
    height: 1452,
    mobileLightSrc: "/images/showcase/group-passbook-mobile-light.png",
    mobileDarkSrc: "/images/showcase/group-passbook-mobile-dark.png",
    mobileWidth: 760,
    mobileHeight: 1460,
  },
  {
    id: "upi",
    label: "One-Tap UPI Settlement",
    caption:
      "Pre-filled UPI link and scannable QR code ready for Google Pay, PhonePe, Paytm, or BHIM.",
    lightSrc: "/images/showcase/upi-settle-light.png",
    darkSrc: "/images/showcase/upi-settle-dark.png",
    width: 1024,
    height: 1937,
  },
  {
    id: "distribution",
    label: "Spending Breakdown",
    caption:
      "Category breakdown across Rent, Food, Travel, Entertainment, Shopping, and Utilities.",
    lightSrc: "/images/showcase/expense-distribution-light.png",
    darkSrc: "/images/showcase/expense-distribution-dark.png",
    width: 1264,
    height: 481,
  },
];

const COMPARISON_ROWS = [
  { capability: "Unlimited groups, friends & expenses", free: "Included", pro: "Included" },
  { capability: "Equal, exact rupee & percentage splits", free: "Included", pro: "Included" },
  { capability: "Smart debt simplification & balances", free: "Included", pro: "Included" },
  { capability: "1-tap UPI deep links, QR codes & cash logs", free: "Included", pro: "Included" },
  { capability: "Add friends before they sign up", free: "Included", pro: "Included" },
  { capability: "127 currency conversions to INR", free: "Included", pro: "Included" },
  { capability: "CSV & printable PDF statement downloads", free: "Included", pro: "Included" },
  { capability: "Offline support with automatic sync", free: "Included", pro: "Included" },
  { capability: "AI Receipt & Bill Scanner (Gemini OCR)", free: "Not included", pro: "Included" },
  { capability: "Automated Weekly & Monthly Recurring Bills", free: "Not included", pro: "Included" },
];

export default function LandingPage() {
  const { currentUser, isLoading } = useUser();
  const router = useRouter();
  const [activeUseCase, setActiveUseCase] = useState<UseCaseId>("trips");
  const [activeShowcase, setActiveShowcase] = useState<ShowcaseTabId>("passbook");

  // Redirect signed-in users straight to their dashboard
  useEffect(() => {
    if (!isLoading && currentUser) {
      router.replace("/dashboard");
    }
  }, [currentUser, isLoading, router]);

  if (!isLoading && currentUser) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 print:hidden">
        <SplitRupeeLoader variant="page" text="SplitRupee" subtext="Opening your dashboard..." />
      </div>
    );
  }

  const currentUseCase = USE_CASES.find((c) => c.id === activeUseCase) ?? USE_CASES[0];
  const currentShowcase = SHOWCASE_VIEWS.find((v) => v.id === activeShowcase) ?? SHOWCASE_VIEWS[0];

  return (
    <div className="pb-16 space-y-12 sm:space-y-16">
      {/* 1. HERO SECTION */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 pb-4 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          <div className="lg:col-span-6 space-y-5">
            <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[var(--text-primary)] leading-[1.12]">
              Share expenses. Plan better trips. Stay friends.
            </h1>

            <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-xl">
              SplitRupee makes it easy to share expenses, track group balances and settle up. Planning a trip? Use our standalone AI Itinerary Planner to build your travel plan too.
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-1">
              <Link
                href="/signup"
                className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-6 py-3 text-sm font-semibold text-[var(--brand-ink)] sr-interactive-transition sr-button-press shadow-sm"
              >
                <span>Start Splitting Expenses</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/itinerary"
                className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-5 py-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] sr-interactive-transition sr-button-press"
              >
                <Plane className="h-4 w-4 text-[var(--brand-dark)] dark:text-[var(--brand-primary)]" aria-hidden="true" />
                <span>Explore AI Trip Planner</span>
              </Link>
              <Link
                href="/calculator"
                className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] sr-interactive-transition sr-button-press"
              >
                <Calculator className="h-4 w-4 text-[var(--brand-dark)] dark:text-[var(--brand-primary)]" aria-hidden="true" />
                <span>Split Calculator</span>
              </Link>
            </div>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              Non-custodial expense ledger · Core splitting free for all groups · No bank credentials required
            </p>
          </div>

          <div className="lg:col-span-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2.5 sm:p-3 shadow-[var(--shadow-card)]">
            <ThemeScreenshot
              lightSrc="/images/showcase/hero-standing-light.png"
              darkSrc="/images/showcase/hero-standing-dark.png"
              mobileLightSrc="/images/showcase/hero-standing-mobile-light.png"
              mobileDarkSrc="/images/showcase/hero-standing-mobile-dark.png"
              alt="SplitRupee dashboard showing Financial Standing Overview, group summaries, and balances"
              width={2048}
              height={982}
              mobileWidth={824}
              mobileHeight={1648}
              priority={true}
            />
          </div>
        </div>
      </section>

      {/* 2. EXPENSE SHARING IN THREE SIMPLE STEPS */}
      <section className="border-y border-[var(--border-subtle)] bg-[var(--bg-surface)] py-10 lg:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-10">
          <div className="space-y-2 max-w-2xl">
            <p className="text-sm font-semibold text-[var(--brand-dark)] dark:text-[var(--brand-primary)]">
              Core Expense Sharing
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
              Split bills fairly in three simple steps
            </h2>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
              Everything you need to share everyday expenses without mental math or awkward follow-ups.
            </p>
          </div>

          {/* 3 Steps Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ScrollReveal stagger={1} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-6 space-y-3 sr-card-interactive">
              <span className="font-display text-xs font-bold uppercase tracking-wider text-[var(--brand-dark)] dark:text-[var(--brand-primary)]">
                Step 1
              </span>
              <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">
                Create a group
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Set up a group for your trip, flatmates, friends, or couple. Invite members with a simple share link or QR code.
              </p>
            </ScrollReveal>

            <ScrollReveal stagger={2} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-6 space-y-3 sr-card-interactive">
              <span className="font-display text-xs font-bold uppercase tracking-wider text-[var(--brand-dark)] dark:text-[var(--brand-primary)]">
                Step 2
              </span>
              <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">
                Add shared expenses
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Record who paid and choose how to split — equally, by exact rupee amounts, or by custom percentages.
              </p>
            </ScrollReveal>

            <ScrollReveal stagger={3} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-6 space-y-3 sr-card-interactive">
              <span className="font-display text-xs font-bold uppercase tracking-wider text-[var(--brand-dark)] dark:text-[var(--brand-primary)]">
                Step 3
              </span>
              <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">
                See balances &amp; settle up
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                See who owes whom at a glance. Settle up in one tap using Google Pay, PhonePe, Paytm, or record cash.
              </p>
            </ScrollReveal>
          </div>

          {/* Real Showcase Tabs */}
          <div className="space-y-6 pt-4 border-t border-[var(--border-subtle)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="font-display text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                See the product in action
              </p>
              <div role="tablist" aria-label="Product interface views" className="flex flex-wrap gap-2">
                {SHOWCASE_VIEWS.map((view) => {
                  const isSelected = activeShowcase === view.id;
                  return (
                    <button
                      key={view.id}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      onClick={() => setActiveShowcase(view.id)}
                      className={`min-h-[40px] rounded-xl border px-3.5 py-1.5 text-xs sm:text-sm font-semibold sr-interactive-transition sr-button-press ${
                        isSelected
                          ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--brand-ink)] shadow-sm"
                          : "border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
                      }`}
                    >
                      {view.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div key={activeShowcase} className="sr-tab-panel rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3 sm:p-6">
              <div
                className={
                  currentShowcase.id === "upi"
                    ? "mx-auto max-w-md"
                    : currentShowcase.id === "distribution"
                      ? "mx-auto max-w-3xl"
                      : "mx-auto max-w-5xl"
                }
              >
                <ThemeScreenshot
                  lightSrc={currentShowcase.lightSrc}
                  darkSrc={currentShowcase.darkSrc}
                  mobileLightSrc={currentShowcase.mobileLightSrc}
                  mobileDarkSrc={currentShowcase.mobileDarkSrc}
                  alt={currentShowcase.label}
                  width={currentShowcase.width}
                  height={currentShowcase.height}
                  mobileWidth={currentShowcase.mobileWidth}
                  mobileHeight={currentShowcase.mobileHeight}
                />
              </div>
            </div>
            <p className="text-sm text-[var(--text-secondary)] text-center max-w-2xl mx-auto leading-relaxed">
              {currentShowcase.caption}
            </p>
          </div>
        </div>
      </section>

      {/* 3. AI ITINERARY PLANNER SPOTLIGHT (STANDALONE TRAVEL EXPERIENCE) */}
      <ScrollReveal as="section" className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-3xl border border-[var(--border-subtle)] bg-[#29251F] dark:bg-[#24221D] text-[#F8F0E4] p-6 sm:p-10 shadow-[var(--shadow-card)] space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#51483D] bg-[#362E25] px-3.5 py-1 text-xs font-semibold text-[#F0BD70]">
                <Compass className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Standalone Travel Experience</span>
              </div>

              <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#F8F0E4] leading-tight">
                Your next trip starts with a plan.
              </h2>

              <p className="text-sm sm:text-base text-[#C8BBAA] leading-relaxed">
                Plan destinations, routes, stays and daily activities with SplitRupee&apos;s standalone AI Itinerary Planner. You can use it independently anytime, or link your saved travel plan directly to a group expense ledger when traveling together.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href="/itinerary"
                  className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#E28A63] hover:bg-[#F09A72] px-6 py-3 text-sm font-semibold text-[#171613] sr-interactive-transition sr-button-press"
                >
                  <Plane className="h-4 w-4" aria-hidden="true" />
                  <span>Explore AI Itinerary Planner</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/blog/how-to-split-goa-trip-expenses"
                  className="min-h-[44px] inline-flex items-center justify-center rounded-xl border border-[#8E8070] bg-[#302B24] hover:bg-[#3B352C] px-5 py-3 text-sm font-medium text-[#F8F0E4] sr-interactive-transition sr-button-press"
                >
                  Read Trip Planning Guide
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="rounded-xl border border-[#51483D] bg-[#1D1B17] p-4 space-y-1.5 sr-card-interactive">
                <Plane className="h-4 w-4 text-[#E28A63]" aria-hidden="true" />
                <p className="font-display text-sm font-semibold text-[#F8F0E4]">Transit &amp; Routes</p>
                <p className="text-[#C8BBAA] leading-relaxed">
                  Rail coaches (1A to SL), AC sleeper buses, flights, and local cabs.
                </p>
              </div>

              <div className="rounded-xl border border-[#51483D] bg-[#1D1B17] p-4 space-y-1.5 sr-card-interactive">
                <Calculator className="h-4 w-4 text-[#A5B995]" aria-hidden="true" />
                <p className="font-display text-sm font-semibold text-[#F8F0E4]">Stay &amp; Daily Caps</p>
                <p className="text-[#C8BBAA] leading-relaxed">
                  Calculates nightly hotel caps against your total group budget.
                </p>
              </div>

              <div className="rounded-xl border border-[#51483D] bg-[#1D1B17] p-4 space-y-1.5 sr-card-interactive">
                <FileText className="h-4 w-4 text-[#F0BD70]" aria-hidden="true" />
                <p className="font-display text-sm font-semibold text-[#F8F0E4]">Magazine PDF Export</p>
                <p className="text-[#C8BBAA] leading-relaxed">
                  Download printable multi-day travel guides and packing checklists.
                </p>
              </div>

              <div className="rounded-xl border border-[#51483D] bg-[#1D1B17] p-4 space-y-1.5 sr-card-interactive">
                <Calendar className="h-4 w-4 text-[#9FB3C8]" aria-hidden="true" />
                <p className="font-display text-sm font-semibold text-[#F8F0E4]">Calendar &amp; Group Sync</p>
                <p className="text-[#C8BBAA] leading-relaxed">
                  Export schedule to calendar (.ics) and import costs into any group ledger.
                </p>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* 4. REAL-WORLD USE CASES */}
      <section className="border-y border-[var(--border-subtle)] bg-[var(--bg-surface)] py-10 lg:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-8">
          <div className="space-y-2 max-w-2xl">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
              Designed for everyday spending
            </h2>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
              Keep separate groups for road trips, flatmate expenses, and weekend outings so balances never get mixed up.
            </p>
          </div>

          {/* Use Case Tabs */}
          <div role="tablist" aria-label="Use cases" className="flex flex-wrap gap-2">
            {USE_CASES.map((item) => {
              const Icon = item.icon;
              const isSelected = activeUseCase === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveUseCase(item.id)}
                  className={`min-h-[44px] inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs sm:text-sm font-semibold sr-interactive-transition sr-button-press ${
                    isSelected
                      ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--brand-ink)] shadow-sm"
                      : "border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${isSelected ? "text-[var(--brand-ink)]" : "text-[var(--brand-primary)]"}`}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Selected Case Content */}
          <div
            key={activeUseCase}
            role="tabpanel"
            aria-label={currentUseCase.label}
            className="sr-tab-panel grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2"
          >
            <div className="lg:col-span-6 space-y-4">
              <h3 className="font-display text-xl sm:text-2xl font-semibold text-[var(--text-primary)]">
                {currentUseCase.headline}
              </h3>
              <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
                {currentUseCase.summary}
              </p>
              <ul className="space-y-3 pt-1 text-sm text-[var(--text-primary)]">
                {currentUseCase.highlights.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2.5">
                    <Check
                      className="h-4 w-4 text-[var(--status-positive)] shrink-0 mt-1"
                      aria-hidden="true"
                    />
                    <span className="leading-relaxed">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3 gap-2">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-[var(--text-secondary)]">Sample Group</p>
                  <p className="font-display text-base font-semibold text-[var(--text-primary)]">
                    {currentUseCase.sampleTitle}
                  </p>
                </div>
              </div>

              <div className="divide-y divide-[var(--border-subtle)]">
                {currentUseCase.sampleRows.map((row) => (
                  <div key={row.item} className="py-3 flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0 space-y-0.5">
                      <p className="font-semibold text-[var(--text-primary)] break-words leading-snug">
                        {row.item}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        Paid by {row.payer} · {row.split}
                      </p>
                    </div>
                    <span className="font-display font-semibold tabular-nums text-[var(--text-primary)] shrink-0">
                      {row.amount}
                    </span>
                  </div>
                ))}
              </div>

              <p className="rounded-xl border border-[var(--status-positive-border)] bg-[var(--status-positive-bg)] px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[var(--status-positive)] leading-relaxed">
                {currentUseCase.sampleResult}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS WORKFLOW */}
      <ScrollReveal as="section" id="how-it-works" className="scroll-mt-20 mx-auto max-w-6xl px-4 sm:px-6 space-y-8">
        <div className="space-y-2 max-w-2xl">
          <p className="text-sm font-semibold text-[var(--brand-dark)] dark:text-[var(--brand-primary)]">
            How It Works
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
            From shared bill to settlement in five steps
          </h2>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-5 gap-6 border-t border-[var(--border-subtle)] pt-8">
          {WORKFLOW_STEPS.map((item) => (
            <li key={item.step} className="space-y-2.5">
              <span className="font-display text-sm font-bold tabular-nums text-[var(--brand-dark)] dark:text-[var(--brand-primary)]">
                Step {item.step}
              </span>
              <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
                {item.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
            </li>
          ))}
        </ol>
      </ScrollReveal>

      {/* 6. SPLITRUPEE PRO */}
      <ScrollReveal as="section" className="border-y border-[var(--border-subtle)] bg-[var(--bg-surface)] py-10 lg:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-6 space-y-4">
              <p className="text-sm font-semibold text-[var(--accent-gold-ink)]">
                SplitRupee Pro · ₹49/month or ₹499/year
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
                Optional Pro tools on top of a 100% free core ledger
              </h2>
              <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
                Core expense splitting, 1-tap UPI payments, smart debt reduction, and statement exports are completely free for everyone. Pro accounts unlock two automated tools: AI Receipt OCR and Recurring Monthly Bills.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <Link
                  href="/contact?topic=pro"
                  className="min-h-[44px] inline-flex items-center justify-center rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-5 py-2.5 text-sm font-semibold text-[var(--brand-ink)] sr-interactive-transition sr-button-press"
                >
                  Request Pro Access
                </Link>
                <Link
                  href="/pro"
                  className="min-h-[44px] inline-flex items-center justify-center rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] px-5 py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] sr-interactive-transition sr-button-press"
                >
                  View Pro Details &amp; Pricing
                </Link>
              </div>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                ₹49/month or ₹499/year (Save 15%). Pro access is activated upon request; no payment is collected before confirmation.
              </p>
            </div>

            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[var(--accent-gold-border)] bg-[var(--bg-surface-secondary)] p-5 space-y-2.5 sr-card-interactive">
                <Camera className="h-5 w-5 text-[var(--accent-gold-ink)]" aria-hidden="true" />
                <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
                  AI Receipt &amp; Bill Scanner
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Upload a photo of your receipt to read items, merchant name, and total amount automatically.
                </p>
              </div>

              <div className="rounded-xl border border-[var(--accent-gold-border)] bg-[var(--bg-surface-secondary)] p-5 space-y-2.5 sr-card-interactive">
                <Repeat className="h-5 w-5 text-[var(--accent-gold-ink)]" aria-hidden="true" />
                <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
                  Automated Recurring Bills
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Schedule regular expenses like apartment rent, Wi-Fi, or cook salaries to post on their due dates.
                </p>
              </div>
            </div>
          </div>

          {/* Feature Comparison Table */}
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] overflow-hidden">
            <div className="grid grid-cols-12 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] px-4 sm:px-6 py-3.5 text-xs sm:text-sm font-semibold text-[var(--text-primary)]">
              <div className="col-span-6">Features &amp; Capabilities</div>
              <div className="col-span-3 text-center">Free (₹0)</div>
              <div className="col-span-3 text-center text-[var(--accent-gold-ink)]">Pro</div>
            </div>
            <div className="divide-y divide-[var(--border-subtle)]">
              {COMPARISON_ROWS.map((row) => (
                <div
                  key={row.capability}
                  className="grid grid-cols-12 items-center px-4 sm:px-6 py-3.5 text-xs sm:text-sm"
                >
                  <div className="col-span-6 font-medium text-[var(--text-primary)] pr-3 leading-snug">
                    {row.capability}
                  </div>
                  <div className="col-span-3 text-center text-[var(--text-secondary)]">
                    {row.free}
                  </div>
                  <div
                    className={`col-span-3 text-center font-semibold ${
                      row.pro === "Included"
                        ? "text-[var(--status-positive)]"
                        : "text-[var(--text-secondary)]"
                    }`}
                  >
                    {row.pro}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* 7. FINAL INVITATION & CALL TO ACTION */}
      <ScrollReveal as="section" className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 sm:p-12 text-center space-y-5 shadow-[var(--shadow-card)]">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-[var(--brand-primary)] text-[var(--brand-ink)] grid place-items-center font-display font-bold text-xl shadow-sm">
            ₹
          </div>
          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
              Ready to share expenses without awkward math?
            </h2>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
              Create a group in seconds and start tracking shared expenses with your friends.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/signup"
              className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-7 py-3 text-sm font-semibold text-[var(--brand-ink)] sr-interactive-transition sr-button-press shadow-sm"
            >
              <span>Start Splitting for Free</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/calculator"
              className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] hover:bg-[var(--bg-surface-hover)] px-5 py-3 text-sm font-medium text-[var(--text-primary)] sr-interactive-transition sr-button-press"
            >
              <Calculator className="h-4 w-4 text-[var(--brand-primary)]" aria-hidden="true" />
              <span>Try Bill Split Calculator</span>
            </Link>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
