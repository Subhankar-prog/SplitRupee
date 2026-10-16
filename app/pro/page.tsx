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
      title: "AI Receipt & Bill OCR Scanner",
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
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 space-y-16 animate-in fade-in duration-300">
      {/* Hero */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-400">
          <Crown className="h-3.5 w-3.5" />
          <span>SplitRupee Pro</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          Supercharge your group budgeting with{" "}
          <span className="bg-gradient-to-r from-amber-400 via-orange-300 to-yellow-400 bg-clip-text text-transparent">
            Pro Power
          </span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          AI receipt scanning, rich spending charts, forex currency conversion, and unlimited expense exports for you and your friends.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 pt-4">
          <span
            className={`text-xs font-semibold cursor-pointer ${
              billingCycle === "monthly" ? "text-white" : "text-slate-400"
            }`}
            onClick={() => setBillingCycle("monthly")}
          >
            Monthly Billing
          </span>
          <button
            onClick={() =>
              setBillingCycle(billingCycle === "yearly" ? "monthly" : "yearly")
            }
            className="relative h-7 w-14 rounded-full bg-slate-800 p-1 transition border border-white/10"
          >
            <div
              className={`h-5 w-5 rounded-full bg-amber-400 shadow-md transition-transform ${
                billingCycle === "yearly" ? "translate-x-7" : "translate-x-0"
              }`}
            />
          </button>
          <span
            className={`text-xs font-semibold cursor-pointer flex items-center gap-1.5 ${
              billingCycle === "yearly" ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"
            }`}
            onClick={() => setBillingCycle("yearly")}
          >
            Yearly Billing
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              Save 15%
            </span>
          </span>
        </div>
      </div>

      {/* Pricing Card */}
      <div className="mx-auto max-w-md rounded-3xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-950 p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase px-4 py-1 rounded-bl-xl tracking-wider">
          Most Popular
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
            All-Inclusive Pro Plan
          </span>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl sm:text-5xl font-extrabold text-slate-950 dark:text-white">
              {billingCycle === "yearly" ? formatINR(yearlyPrice) : formatINR(monthlyPrice)}
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {billingCycle === "yearly" ? "/ year" : "/ month"}
            </span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            {billingCycle === "yearly"
              ? "Equivalent to just ₹41/month · Cancel anytime"
              : "Billed monthly · Cancel anytime"}
          </p>
        </div>

        <Link
          href="/signup"
          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-amber-500/20 hover:opacity-95 transition active:scale-95"
        >
          <span>Start 14-Day Free Trial</span>
          <ArrowRight className="h-4 w-4" />
        </Link>

        <div className="space-y-2.5 pt-4 text-left border-t border-amber-500/20 dark:border-white/10 text-xs text-slate-800 dark:text-slate-300 font-medium">
          {[
            "AI Camera Receipt & Invoice OCR",
            "Category Spending Charts & Graphs",
            "100+ Currency Live Conversion",
            "Export to Excel & PDF Ledgers",
            "Unlimited Groups & Expenses",
            "100% Ad-Free Experience",
            "Priority WhatsApp Support",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2.5">
              <Check className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 stroke-[3]" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Deep Dive Grid */}
      <div className="space-y-8">
        <div className="text-center space-y-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Why upgrade to SplitRupee Pro?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Built for power users, travelers, and roommates who want zero budgeting friction.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {proFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-6 backdrop-blur-xl hover:border-amber-500/30 transition space-y-3 shadow-sm"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{feat.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
