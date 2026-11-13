"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Crown,
  Camera,
  Repeat,
  Check,
  ArrowRight,
  ShieldCheck,
  Receipt,
  CalendarClock,
} from "lucide-react";

type BillingCycle = "yearly" | "monthly";

const MONTHLY_INR = 49;
const YEARLY_INR = 499;
const ANNUAL_AT_MONTHLY = MONTHLY_INR * 12; // 588
const YEARLY_SAVINGS_INR = ANNUAL_AT_MONTHLY - YEARLY_INR; // 89
const YEARLY_SAVINGS_PCT = Math.round((YEARLY_SAVINGS_INR / ANNUAL_AT_MONTHLY) * 100); // 15

export default function ProPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly");

  const comparisonRows = [
    { feature: "Unlimited groups, friends & expenses", free: "Included", pro: "Included" },
    { feature: "Equal, exact rupee & percentage splits", free: "Included", pro: "Included" },
    { feature: "Graph debt simplification & passbook", free: "Included", pro: "Included" },
    { feature: "1-tap UPI payment links & dynamic QR", free: "Included", pro: "Included" },
    { feature: "WhatsApp group invites & payment reminders", free: "Included", pro: "Included" },
    { feature: "127 multi-currency INR conversions", free: "Included", pro: "Included" },
    { feature: "CSV & printable PDF group statements", free: "Included", pro: "Included" },
    { feature: "Category distribution & offline sync queue", free: "Included", pro: "Included" },
    { feature: "AI Receipt & Bill Scanner (Gemini OCR)", free: "Not included", pro: "Included" },
    { feature: "Automated Weekly / Monthly Recurring Bills", free: "Not included", pro: "Included" },
  ];

  const isYearly = billingCycle === "yearly";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14 sm:px-6 space-y-16">
      {/* Split Pro Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        <div className="lg:col-span-7 space-y-5">
          <p className="text-sm font-semibold text-[var(--accent-gold-ink)] flex items-center gap-1.5">
            <Crown className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>SplitRupee Pro</span>
          </p>
          <h1 className="font-display text-3xl sm:text-5xl font-bold text-[var(--text-primary)] tracking-tight leading-[1.12]">
            Free everyday ledger. Optional automation when groups need it.
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed max-w-2xl">
            Every group gets unlimited bills, debt simplification, 1-tap UPI links, and exports at zero cost. SplitRupee Pro adds Gemini receipt extraction and scheduled recurring bills for households and regular travel organizers.
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 text-xs sm:text-sm text-[var(--text-secondary)]">
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-[var(--status-positive)] shrink-0" aria-hidden="true" />
              <span>Core splitting stays free for all members</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-[var(--status-positive)] shrink-0" aria-hidden="true" />
              <span>Request-based activation with direct confirmation</span>
            </span>
          </div>
        </div>

        {/* Focused Billing Cadence Control Panel */}
        <div className="lg:col-span-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-[var(--shadow-card)] space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Select Billing Cadence
            </span>
            <span className="rounded-md bg-[var(--status-positive-bg)] border border-[var(--status-positive-border)] px-2 py-0.5 text-[11px] font-semibold text-[var(--status-positive)] tabular-nums">
              Save ₹{YEARLY_SAVINGS_INR} ({YEARLY_SAVINGS_PCT}%) yearly
            </span>
          </div>

          {/* Segmented Monthly / Yearly Selector */}
          <div
            role="group"
            aria-label="Billing period selection"
            className="grid grid-cols-2 gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-1.5"
          >
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              aria-pressed={!isYearly}
              className={`min-h-[44px] rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                !isYearly
                  ? "bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-strong)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Monthly · ₹{MONTHLY_INR}/mo
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              aria-pressed={isYearly}
              className={`min-h-[44px] rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                isYearly
                  ? "bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-strong)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Yearly · ₹{YEARLY_INR}/yr
            </button>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] px-4 py-3.5 space-y-1">
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-3xl font-bold tabular-nums text-[var(--text-primary)]">
                  ₹{isYearly ? YEARLY_INR : MONTHLY_INR}
                </span>
                <span className="text-xs sm:text-sm font-medium text-[var(--text-secondary)]">
                  / {isYearly ? "year" : "month"}
                </span>
              </div>
              {isYearly ? (
                <span className="text-xs font-mono text-[var(--status-positive)] font-semibold tabular-nums">
                  ₹{(YEARLY_INR / 12).toFixed(0)}/mo avg
                </span>
              ) : (
                <span className="text-xs font-mono text-[var(--text-secondary)] tabular-nums">
                  ₹{ANNUAL_AT_MONTHLY}/yr total
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {isYearly
                ? `Compared with ₹${MONTHLY_INR}/month billed 12 times (₹${ANNUAL_AT_MONTHLY}/year).`
                : `Switch to yearly billing (₹${YEARLY_INR}/year) to save ₹${YEARLY_SAVINGS_INR} (${YEARLY_SAVINGS_PCT}%).`}
            </p>
          </div>

          <Link
            href={`/contact?topic=pro&plan=${billingCycle}`}
            className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-5 py-3 text-sm font-semibold text-[var(--brand-ink)] transition-colors"
          >
            <span>Request Pro Access ({isYearly ? `₹${YEARLY_INR}/yr` : `₹${MONTHLY_INR}/mo`})</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Available by request only. No payment is collected online; billing and activation are confirmed manually before any charge.
          </p>
        </div>
      </section>

      {/* Two-Column Plan Comparison Cards (Intentionally Differentiated) */}
      <section aria-label="Plan comparison" className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* Free Forever Plan (5 cols) */}
        <div className="md:col-span-5 rounded-2xl border border-[color:var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-dark)] dark:text-[var(--brand-primary)]">
                Everyday Ledger
              </p>
              <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">
                Free Forever
              </h2>
              <div className="flex items-baseline gap-2 pt-1">
                <span className="font-display text-4xl font-bold tabular-nums text-[var(--text-primary)]">
                  ₹0
                </span>
                <span className="text-xs sm:text-sm text-[var(--text-secondary)]">
                  for every group &amp; circle
                </span>
              </div>
            </div>

            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Full core splitting, trip planning, debt minimization, UPI QR links, and exports with zero advertisements.
            </p>

            <ul className="space-y-3 pt-4 border-t border-[color:var(--border-subtle)] text-sm text-[var(--text-primary)] leading-relaxed">
              {[
                "Unlimited groups and expense entries",
                "Equal, exact rupee, and percentage splits",
                "1-tap UPI payment links & dynamic QR codes",
                "127 currencies + CSV & PDF ledger exports",
                "Offline queue sync & audit trail",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[var(--status-positive)] shrink-0 mt-1" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <Link
            href="/signup"
            className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
          >
            <span>Create Free Account</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {/* Highlighted SplitRupee Pro Tier (7 cols) */}
        <div className="md:col-span-7 rounded-2xl border-2 border-[var(--accent-gold-border)] bg-[var(--bg-surface)] overflow-hidden flex flex-col justify-between shadow-[var(--shadow-card)]">
          <div>
            {/* Editorial Espresso Header Strip */}
            <div className="bg-[#29251F] dark:bg-[#302B24] px-6 sm:px-8 py-5 text-[#F8F0E4] flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)]">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#F0BD70]">
                  <Crown className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Pro Automation</span>
                </div>
                <h2 className="font-display text-2xl font-bold text-[#F8F0E4]">
                  SplitRupee Pro
                </h2>
              </div>

              <div className="text-left sm:text-right">
                <div className="flex items-baseline sm:justify-end gap-1.5">
                  <span className="font-display text-3xl sm:text-4xl font-bold tabular-nums text-[#F8F0E4]">
                    ₹{isYearly ? YEARLY_INR : MONTHLY_INR}
                  </span>
                  <span className="text-xs sm:text-sm text-[#C8BBAA]">
                    / {isYearly ? "year" : "month"}
                  </span>
                </div>
                <p className="text-[11px] text-[#C8BBAA] tabular-nums">
                  {isYearly
                    ? `or ₹${MONTHLY_INR}/month billed monthly · Save ${YEARLY_SAVINGS_PCT}% yearly`
                    : `or ₹${YEARLY_INR}/year billed annually · Save ₹${YEARLY_SAVINGS_INR}`}
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-5">
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Built for flatmates managing recurring monthly bills and travelers capturing restaurant or supermarket receipts directly from photos.
              </p>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[color:var(--border-subtle)] text-sm text-[var(--text-primary)] leading-relaxed">
                {[
                  "Everything included in Free Forever",
                  "AI Receipt & Bill Scanner (Gemini OCR extraction)",
                  "Automated Weekly & Monthly Recurring Bills",
                  "Direct Pro activation upon request approval",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-[var(--accent-gold-ink)] shrink-0 mt-1" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="px-6 sm:px-8 pb-6 sm:pb-8 space-y-2.5">
            <Link
              href={`/contact?topic=pro&plan=${billingCycle}`}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-5 py-3 text-sm font-semibold text-[var(--brand-ink)] transition-colors"
            >
              <span>Request Pro Access</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <p className="text-xs text-center text-[var(--text-secondary)]">
              Request-based activation · Pricing (₹{MONTHLY_INR}/mo or ₹{YEARLY_INR}/yr) confirmed before billing starts.
            </p>
          </div>
        </div>
      </section>

      {/* Pro Automation Workflows (Varied Structure, Grounded in Real Codebase) */}
      <section className="space-y-6">
        <div className="space-y-2 max-w-2xl">
          <p className="text-sm font-semibold text-[var(--brand-dark)] dark:text-[var(--brand-primary)]">
            Automation Workflows
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
            What SplitRupee Pro automates today
          </h2>
          <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
            Both Pro modules plug directly into the existing Add Expense and Group Ledger flows.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Workflow 1: AI Receipt OCR */}
          <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-7 space-y-5 shadow-[var(--shadow-card)]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-gold-bg)] text-[var(--accent-gold-ink)] border border-[var(--accent-gold-border)] shrink-0">
                  <Camera className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">
                    AI Receipt &amp; Bill Scanner
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Built into the Add Expense modal
                  </p>
                </div>
              </div>
              <Receipt className="h-5 w-5 text-[var(--border-strong)] shrink-0" aria-hidden="true" />
            </div>

            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Upload or photograph a restaurant bill, grocery receipt, or booking invoice. Gemini vision parses vendor title, currency total, tax, and category straight into the split form before saving.
            </p>

            <ol className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs border-t border-[var(--border-subtle)] pt-4">
              <li className="rounded-xl bg-[var(--bg-surface-secondary)] px-3 py-2.5 border border-[var(--border-subtle)]">
                <span className="font-mono text-[10px] font-semibold uppercase text-[var(--accent-gold-ink)] block">01 Capture</span>
                <span className="font-medium text-[var(--text-primary)]">Upload bill photo</span>
              </li>
              <li className="rounded-xl bg-[var(--bg-surface-secondary)] px-3 py-2.5 border border-[var(--border-subtle)]">
                <span className="font-mono text-[10px] font-semibold uppercase text-[var(--accent-gold-ink)] block">02 Extract</span>
                <span className="font-medium text-[var(--text-primary)]">Review OCR fields</span>
              </li>
              <li className="rounded-xl bg-[var(--bg-surface-secondary)] px-3 py-2.5 border border-[var(--border-subtle)]">
                <span className="font-mono text-[10px] font-semibold uppercase text-[var(--accent-gold-ink)] block">03 Split</span>
                <span className="font-medium text-[var(--text-primary)]">Save to passbook</span>
              </li>
            </ol>
          </div>

          {/* Workflow 2: Recurring Bills */}
          <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-7 space-y-5 shadow-[var(--shadow-card)]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-tint-bg)] text-[var(--brand-dark)] dark:text-[var(--brand-primary)] border border-[var(--brand-tint-border)] shrink-0">
                  <Repeat className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">
                    Automated Recurring Expenses
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Available inside every Group Ledger
                  </p>
                </div>
              </div>
              <CalendarClock className="h-5 w-5 text-[var(--border-strong)] shrink-0" aria-hidden="true" />
            </div>

            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Set up fixed flatmate or shared obligations once, such as monthly apartment rent, Wi-Fi, cook, or housekeeper splits, and let SplitRupee post recurring entries on their scheduled interval.
            </p>

            <ol className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs border-t border-[var(--border-subtle)] pt-4">
              <li className="rounded-xl bg-[var(--bg-surface-secondary)] px-3 py-2.5 border border-[var(--border-subtle)]">
                <span className="font-mono text-[10px] font-semibold uppercase text-[var(--brand-dark)] dark:text-[var(--brand-primary)] block">01 Define</span>
                <span className="font-medium text-[var(--text-primary)]">Set amount &amp; payer</span>
              </li>
              <li className="rounded-xl bg-[var(--bg-surface-secondary)] px-3 py-2.5 border border-[var(--border-subtle)]">
                <span className="font-mono text-[10px] font-semibold uppercase text-[var(--brand-dark)] dark:text-[var(--brand-primary)] block">02 Cadence</span>
                <span className="font-medium text-[var(--text-primary)]">Weekly or monthly</span>
              </li>
              <li className="rounded-xl bg-[var(--bg-surface-secondary)] px-3 py-2.5 border border-[var(--border-subtle)]">
                <span className="font-mono text-[10px] font-semibold uppercase text-[var(--brand-dark)] dark:text-[var(--brand-primary)] block">03 Post</span>
                <span className="font-medium text-[var(--text-primary)]">Auto-logged due dates</span>
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* Detailed Feature Comparison Table */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
            Free vs Pro feature comparison
          </h2>
          <span className="text-xs text-[var(--text-secondary)] font-mono">
            Monthly ₹{MONTHLY_INR} · Yearly ₹{YEARLY_INR} (Save {YEARLY_SAVINGS_PCT}%)
          </span>
        </div>

        <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden shadow-[var(--shadow-card)]">
          <div className="grid grid-cols-12 border-b border-[color:var(--border-subtle)] bg-[var(--bg-surface-secondary)] px-4 sm:px-6 py-3.5 text-xs sm:text-sm font-semibold text-[var(--text-primary)]">
            <div className="col-span-6">Capability</div>
            <div className="col-span-3 text-center">Free (₹0)</div>
            <div className="col-span-3 text-center text-[var(--accent-gold-ink)]">Pro</div>
          </div>
          <div className="divide-y divide-[color:var(--border-subtle)]">
            {comparisonRows.map((row) => (
              <div
                key={row.feature}
                className="grid grid-cols-12 items-center px-4 sm:px-6 py-3.5 text-xs sm:text-sm"
              >
                <div className="col-span-6 font-medium text-[var(--text-primary)] pr-3 leading-snug">
                  {row.feature}
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

        <p className="text-xs sm:text-sm text-[var(--text-secondary)] flex items-start sm:items-center gap-2 leading-relaxed">
          <ShieldCheck className="h-4 w-4 text-[var(--brand-primary)] shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
          <span>SplitRupee is non-custodial on both Free and Pro plans. Payments settle externally via NPCI UPI apps or cash.</span>
        </p>
      </section>
    </div>
  );
}
