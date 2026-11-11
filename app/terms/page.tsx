import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 space-y-8">
      <div className="space-y-2">
        <Link href="/" className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-2">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
        </Link>
        <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">Terms of Service</h1>
        <p className="text-xs text-[var(--text-secondary)]">Last updated: October 2026</p>
      </div>

      <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-[var(--shadow-card)] space-y-6 text-sm text-[var(--text-secondary)] leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">1. Introduction</h2>
          <p>
            Welcome to SplitRupee (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). By using our website, application, and related services (collectively, the &quot;Service&quot;), you agree to be bound by these Terms of Service.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">2. Non-Custodial Expense Ledger</h2>
          <p>
            SplitRupee is a mathematical tracking tool and expense ledger. SplitRupee is NOT a bank, payment intermediary, or escrow provider. All financial transactions between users occur externally via National Payments Corporation of India (NPCI) approved Unified Payments Interface (UPI) applications or cash. SplitRupee does not hold, transmit, or custody user balances.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">3. User Accounts and Responsibility</h2>
          <p>
            You are responsible for safeguarding your login credentials and for all activities that occur under your account. You agree to provide accurate information when recording group expenses.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">4. Acceptable Use</h2>
          <p>
            You agree not to use the Service for any unlawful purpose, fraud, harassment, or to impersonate any individual. We reserve the right to suspend accounts violating these terms.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">5. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by Indian law, SplitRupee and its affiliates shall not be liable for any indirect, incidental, or consequential damages resulting from your use of the service.
          </p>
        </section>
      </div>
    </div>
  );
}
