import React from "react";
import Link from "next/link";
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Users,
  Heart,
  Globe,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 space-y-12">
      {/* Hero */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border-subtle)] bg-[var(--bg-surface-secondary)] px-3.5 py-1 text-xs font-medium text-[var(--brand-dark)] dark:text-[var(--brand-primary)]">
          <Sparkles className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
          <span>Our Story</span>
        </div>
        <h1 className="font-display text-3xl sm:text-5xl font-bold text-[var(--text-primary)] tracking-tight">
          We&apos;re making shared expenses{" "}
          <span className="text-[var(--brand-dark)] dark:text-[var(--brand-primary)] underline decoration-[var(--accent-sand)] decoration-2 underline-offset-4">
            frictionless for India.
          </span>
        </h1>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Built because global splitting apps don&apos;t understand how Indian friends travel, split rent, and pay with 1-tap UPI.
        </p>
      </div>

      {/* Mission statement */}
      <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-[var(--bg-surface)] p-8 sm:p-10 shadow-[var(--shadow-card)] space-y-5">
        <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">Why SplitRupee?</h2>
        <div className="space-y-4 text-sm text-[var(--text-secondary)] leading-relaxed">
          <p>
            Whether it&apos;s a weekend road trip to Goa, splitting electricity and Wi-Fi bills with flatmates in Bengaluru, or dining out with colleagues in Mumbai — calculating who owes whom and copying UPI IDs back and forth is exhausting.
          </p>
          <p>
            Legacy apps are filled with annoying ads, charge high monthly fees for basic features, and force you to manually type 12-digit phone numbers and bank account numbers into separate payment apps.
          </p>
          <p className="font-medium text-[var(--status-positive)]">
            SplitRupee is built from the ground up for India: 1-click UPI settlements, smart graph debt minimization, WhatsApp invite links, and a lightning-fast responsive interface that works everywhere.
          </p>
        </div>
      </div>

      {/* Core Values Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-xl border border-[color:var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-3 shadow-[var(--shadow-card)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--status-positive-bg)] text-[var(--status-positive)] border border-[color:var(--border-subtle)]">
            <Zap className="h-5 w-5" />
          </div>
          <h3 className="font-display text-sm font-semibold text-[var(--text-primary)]">Zero Friction</h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Friends can join via a single WhatsApp link without password headaches.
          </p>
        </div>

        <div className="rounded-xl border border-[color:var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-3 shadow-[var(--shadow-card)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-surface-secondary)] text-[var(--brand-dark)] dark:text-[var(--brand-primary)] border border-[color:var(--border-subtle)]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="font-display text-sm font-semibold text-[var(--text-primary)]">Non-Custodial &amp; Safe</h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            We never touch your money. All settlements flow directly through secure UPI apps.
          </p>
        </div>

        <div className="rounded-xl border border-[color:var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-3 shadow-[var(--shadow-card)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-sand)]/15 text-[var(--status-warning)] border border-[color:var(--border-subtle)]">
            <TrendingUp className="h-5 w-5" />
          </div>
          <h3 className="font-display text-sm font-semibold text-[var(--text-primary)]">Smart Debt Simplifier</h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Minimizes 20 messy group debts into 3 clean transfers so everyone settles up quickly.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center space-y-4 pt-4">
        <h3 className="font-display text-xl font-bold text-[var(--text-primary)]">Ready to simplify your group bills?</h3>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-dark)] dark:bg-[var(--brand-primary)] px-7 py-3 text-sm font-medium text-white dark:text-[#171F1D] hover:opacity-95 transition-opacity"
        >
          <span>Get Started Free</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
