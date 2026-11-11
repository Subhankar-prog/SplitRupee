"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Crown,
  Sparkles,
  Camera,
  PieChart,
  Globe2,
  FileSpreadsheet,
  Zap,
  Check,
  ArrowRight,
  ShieldCheck,
  Star,
} from "lucide-react";
import { formatINR } from "@/lib/money";

export default function ProPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

  const monthlyPrice = 49;
  const yearlyPrice = 499; // saves 15%

  const proFeatures = [
    {
      icon: Camera,
      title: "Smart Receipt & Bill Scanner",
      desc: "Snap a photo of restaurant bills, grocery invoices, or flight tickets. SplitRupee automatically extracts items, tax, and totals.",
    },
    {
      icon: PieChart,
      title: "Spending Analytics & Category Trends",
      desc: "Understand where your money goes with monthly breakdowns across food, travel, rent, groceries, and entertainment.",
    },
    {
      icon: Globe2,
      title: "100+ Live Currency Conversions",
      desc: "Traveling to Thailand, Europe, or Dubai? Record expenses in USD, EUR, THB or AED and automatically convert to INR with real-time forex rates.",
    },
    {
      icon: FileSpreadsheet,
      title: "Export to Excel, CSV & PDF Ledgers",
      desc: "Download complete tax-ready expense sheets and group financial statements with 1-click.",
    },
    {
      icon: Zap,
      title: "Unlimited Groups & Expenses",
      desc: "No limits on how many trips, flats, or shared budgets you can manage simultaneously.",
    },
    {
      icon: ShieldCheck,
      title: "100% Ad-Free & Priority Support",
      desc: "A clean, distraction-free experience with dedicated WhatsApp customer support for your group.",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 space-y-14">
      {/* Hero */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent-sand)]/35 bg-[var(--accent-sand)]/12 px-3.5 py-1 text-xs font-medium text-[var(--status-warning)]">
          <Crown className="h-3.5 w-3.5" />
          <span>SplitRupee Pro</span>
        </div>
        <h1 className="font-display text-3xl sm:text-5xl font-bold text-[var(--text-primary)] tracking-tight">
          Supercharge your group budgeting with{" "}
          <span className="text-[var(--brand-dark)] dark:text-[var(--brand-primary)] underline decoration-[var(--accent-sand)] decoration-2 underline-offset-4">
            Pro Power
          </span>
        </h1>
        <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
          Smart receipt scanning, rich spending charts, forex currency conversion, and unlimited expense exports for you and your friends.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 pt-3">
          <span
            className={`text-xs font-medium cursor-pointer transition-colors ${
              billingCycle === "monthly" ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
            }`}
            onClick={() => setBillingCycle("monthly")}
          >
            Monthly Billing
          </span>
          <button
            onClick={() =>
              setBillingCycle(billingCycle === "yearly" ? "monthly" : "yearly")
            }
            aria-label="Toggle billing cycle"
            className="relative h-7 w-14 rounded-full bg-[var(--bg-surface-secondary)] p-1 transition-colors border border-[color:var(--border-subtle)]"
          >
            <div
              className={`h-5 w-5 rounded-full bg-[var(--accent-sand)] shadow-sm transition-transform ${
                billingCycle === "yearly" ? "translate-x-7" : "translate-x-0"
              }`}
            />
          </button>
          <span
            className={`text-xs font-medium cursor-pointer flex items-center gap-1.5 transition-colors ${
              billingCycle === "yearly" ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
            }`}
            onClick={() => setBillingCycle("yearly")}
          >
            Yearly Billing
            <span className="rounded-full bg-[var(--status-positive-bg)] px-2 py-0.5 text-[10px] font-medium text-[var(--status-positive)] border border-[var(--status-positive)]/25">
              Save 15%
            </span>
          </span>
        </div>
      </div>

      {/* Pricing Card */}
      <div className="mx-auto max-w-md rounded-2xl border border-[color:var(--border-strong)] bg-[var(--bg-surface)] p-8 text-center space-y-6 shadow-[var(--shadow-card)] relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-[var(--accent-sand)] text-[#26332D] text-[10px] font-semibold uppercase px-3.5 py-1 rounded-bl-lg tracking-wider">
          Most Popular
        </div>

        <div className="space-y-1.5 pt-1">
          <span className="text-xs font-medium text-[var(--status-warning)] uppercase tracking-widest">
            All-Inclusive Pro Plan
          </span>
          <div className="flex items-baseline justify-center gap-1">
            <span className="font-display text-4xl sm:text-5xl font-bold tabular-nums text-[var(--text-primary)]">
              {billingCycle === "yearly" ? formatINR(yearlyPrice) : formatINR(monthlyPrice)}
            </span>
            <span className="text-xs text-[var(--text-secondary)]">
              {billingCycle === "yearly" ? "/ year" : "/ month"}
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)]">
            {billingCycle === "yearly"
              ? "Equivalent to just ₹41/month · Cancel anytime"
              : "Billed monthly · Cancel anytime"}
          </p>
        </div>

        <Link
          href="/signup"
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--brand-dark)] dark:bg-[var(--brand-primary)] py-3 text-sm font-medium text-white dark:text-[#171F1D] hover:opacity-95 transition-opacity"
        >
          <span>Start 14-Day Free Trial</span>
          <ArrowRight className="h-4 w-4" />
        </Link>

        <div className="space-y-2.5 pt-4 text-left border-t border-[color:var(--border-subtle)] text-xs text-[var(--text-primary)]">
          {[
            "Smart Camera Receipt & Bill Scanner",
            "Category Spending Charts & Graphs",
            "100+ Currency Live Conversion",
            "Export to Excel & PDF Ledgers",
            "Unlimited Groups & Expenses",
            "100% Ad-Free Experience",
            "Priority WhatsApp Support",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2.5">
              <Check className="h-4 w-4 text-[var(--brand-primary)] shrink-0 stroke-[2.5]" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Deep Dive Grid */}
      <div className="space-y-8">
        <div className="text-center space-y-1.5">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            Why upgrade to SplitRupee Pro?
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            Built for power users, travelers, and roommates who want zero budgeting friction.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {proFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="rounded-xl border border-[color:var(--border-subtle)] bg-[var(--bg-surface)] p-6 hover:border-[color:var(--border-strong)] transition-colors space-y-3 shadow-[var(--shadow-card)]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-surface-secondary)] text-[var(--status-warning)] border border-[color:var(--border-subtle)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">{feat.title}</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
