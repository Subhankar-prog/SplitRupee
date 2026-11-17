import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Lock } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 space-y-8">
      <div className="space-y-2">
        <Link href="/" className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-2">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
        </Link>
        <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">Privacy Policy</h1>
        <p className="text-xs text-[var(--text-secondary)]">Last updated: October 2026</p>
      </div>

      <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-[var(--shadow-card)] space-y-6 text-sm text-[var(--text-secondary)] leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-display text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Lock className="h-4 w-4 text-[var(--brand-primary)]" />
            1. Information We Collect
          </h2>
          <p>
            SplitRupee collects minimal personal data necessary to enable shared expense tracking: your name, email address, optional phone number, and optional UPI Virtual Payment Address (VPA) for 1-click settlement links.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">2. How We Use Your Data</h2>
          <p>
            Your information is used strictly to display balances to members within groups you participate in, send group activity updates, and pre-fill UPI deep links. We never sell or share your data with third-party advertisers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">3. Receipt &amp; Image Uploads</h2>
          <p>
            Receipt photos uploaded to SplitRupee are stored securely and accessible only to members of the specific group where the bill was recorded.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">4. Data Deletion &amp; Account Erasure</h2>
          <p>
            You have full control over your data. You can export your transaction history or request permanent deletion of your profile at any time by reaching out to pandasubhankar24@gmail.com.
          </p>
        </section>
      </div>
    </div>
  );
}
