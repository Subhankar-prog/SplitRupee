import React from "react";
import Link from "next/link";
import { ShieldCheck, Zap, TrendingUp } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 space-y-12">
      <div className="space-y-3 max-w-2xl">
        <p className="text-xs font-semibold text-[var(--brand-dark)] dark:text-[var(--brand-primary)]">About SplitRupee</p>
        <h1 className="font-display text-3xl sm:text-5xl font-bold text-[var(--text-primary)] tracking-tight leading-tight">
          Clear shared expenses built for Indian groups
        </h1>
        <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
          Built around the way friends travel, roommates share monthly household bills, and everyone settles via UPI.
        </p>
      </div>

      <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-10 shadow-[var(--shadow-card)] space-y-5">
        <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">Why SplitRupee?</h2>
        <div className="space-y-4 text-sm text-[var(--text-secondary)] leading-relaxed">
          <p>
            Whether it is a weekend road trip to Goa, splitting electricity and Wi-Fi bills with flatmates in Bengaluru, or dining out with colleagues in Mumbai, calculating who owes whom and copying UPI IDs across apps gets tedious quickly.
          </p>
          <p>
            Traditional splitting tools often clutter basic ledgers with advertisements or require switching manually between sheets and payment apps without pre-filled transfer links.
          </p>
          <p className="font-medium text-[var(--status-positive)]">
            SplitRupee keeps the workflow straightforward: 1-tap NPCI UPI deep links, graph debt simplification, WhatsApp invite codes, and offline-capable local queueing.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-xl border border-[color:var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-3 shadow-[var(--shadow-card)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--status-positive-bg)] text-[var(--status-positive)] border border-[color:var(--border-subtle)]">
            <Zap className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="font-display text-sm font-semibold text-[var(--text-primary)]">Direct Group Joining</h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Friends can join via a shareable invite link or QR code, and link past placeholder splits automatically.
          </p>
        </div>

        <div className="rounded-xl border border-[color:var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-3 shadow-[var(--shadow-card)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-surface-secondary)] text-[var(--brand-primary)] border border-[color:var(--border-subtle)]">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="font-display text-sm font-semibold text-[var(--text-primary)]">Non-Custodial Ledger</h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            SplitRupee never holds user money. Transfers settle directly through standard UPI apps or cash records.
          </p>
        </div>

        <div className="rounded-xl border border-[color:var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-3 shadow-[var(--shadow-card)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-gold-bg)] text-[var(--accent-gold-ink)] border border-[var(--accent-gold-border)]">
            <TrendingUp className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="font-display text-sm font-semibold text-[var(--text-primary)]">Graph Debt Simplifier</h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Collapses overlapping bilateral balances across a group into the fewest possible net transfers.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[color:var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-6">
        <div className="space-y-1">
          <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">
            Ready to organize a shared group ledger?
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Create a free account or try the public Split Calculator with zero signup.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <Link
            href="/signup"
            className="min-h-[44px] inline-flex items-center justify-center rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-5 py-2.5 text-xs font-semibold text-[var(--brand-ink)] transition-colors"
          >
            Create Free Account
          </Link>
          <Link
            href="/calculator"
            className="min-h-[44px] inline-flex items-center justify-center rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-5 py-2.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
          >
            Try Split Calculator
          </Link>
        </div>
      </div>
    </div>
  );
}
