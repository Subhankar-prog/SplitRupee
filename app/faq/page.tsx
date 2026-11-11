"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  HelpCircle,
  ChevronDown,
  Sparkles,
  Smartphone,
  ShieldCheck,
  Zap,
  Users,
  ArrowRight,
} from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
  category: "upi" | "splits" | "groups" | "privacy";
}

const faqs: FaqItem[] = [
  {
    category: "upi",
    question: "How do UPI 1-click settlements work?",
    answer:
      "When a group member owes money, clicking 'Settle Up' generates a standard UPI deep link (upi://pay) or dynamic QR code with the exact payee VPA and amount prefilled. You can open Google Pay, PhonePe, Paytm, or BHIM directly on your phone and complete the transfer with 0 manual typing errors.",
  },
  {
    category: "splits",
    question: "How does the Debt Simplification algorithm work?",
    answer:
      "SplitRupee uses graph theory / debt minimization algorithm to collapse multi-person debt loops. For example, if Aarav owes Diya ₹500, and Diya owes Kabir ₹500, SplitRupee simplifies the group ledger so Aarav directly pays Kabir ₹500. This drastically reduces the number of payments required to settle a trip.",
  },
  {
    category: "groups",
    question: "How do friends join my group?",
    answer:
      "Every group has a unique invite link (e.g. splitrupee.com/join/goa2026) and a scannable QR code. When you tap 'Share Invite Link' on WhatsApp, friends can click and instantly join the group without needing to download a heavy app.",
  },
  {
    category: "groups",
    question: "What happens if a friend doesn't have an account yet (Ghost Member)?",
    answer:
      "You can add any friend to an expense by their name or phone number even if they haven't signed up yet. A ghost placeholder profile is created for them. Once they join via the invite link with their phone or Google account, SplitRupee automatically links their past expenses and balances.",
  },
  {
    category: "splits",
    question: "Can we split expenses unequally or by percentage?",
    answer:
      "Yes! When adding an expense, you can choose between 'Equally', 'Exact Rupee Amounts', or 'Percentages'. SplitRupee ensures exact paise precision and verifies that the sum of splits equals the total bill before saving.",
  },
  {
    category: "privacy",
    question: "Is SplitRupee secure? Does SplitRupee hold my money?",
    answer:
      "No, SplitRupee is a non-custodial expense ledger. We never hold your funds. All money transfers happen directly between your bank accounts via NPCI's official UPI network on Google Pay, PhonePe, and Paytm.",
  },
  {
    category: "privacy",
    question: "How often can I reset my password?",
    answer:
      "For account security and protection against unauthorized access, password reset requests are limited to once every 7 days per account. Each secure reset link delivered to your registered email remains valid for 15 minutes.",
  },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCat =
      activeCategory === "all" || faq.category === activeCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border-subtle)] bg-[var(--bg-surface-secondary)] px-3.5 py-1 text-xs font-medium text-[var(--brand-dark)] dark:text-[var(--brand-primary)]">
          <HelpCircle className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
          <span>Frequently Asked Questions</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
          Everything you need to know about SplitRupee
        </h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-lg mx-auto">
          Have questions about UPI settlements, debt simplification, or group invites? We&apos;ve got answers.
        </p>

        {/* Search bar */}
        <div className="pt-3 max-w-md mx-auto">
          <input
            type="text"
            placeholder="Search questions (e.g. UPI, QR, invite, ghost member)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[color:var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/70 focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap justify-center gap-2">
        {[
          { id: "all", label: "All Questions" },
          { id: "upi", label: "UPI & Payments" },
          { id: "splits", label: "Splits & Math" },
          { id: "groups", label: "Groups & Invites" },
          { id: "privacy", label: "Security & Privacy" },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`rounded-lg px-4 py-2 text-xs font-medium border transition-colors ${
              activeCategory === cat.id
                ? "border-[var(--brand-primary)] bg-[var(--status-positive-bg)] text-[var(--status-positive)]"
                : "border-[color:var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[color:var(--border-strong)]"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={faq.question}
              className={`rounded-xl border transition-colors ${
                isOpen
                  ? "border-[var(--brand-primary)]/50 bg-[var(--bg-surface)] shadow-[var(--shadow-card)]"
                  : "border-[color:var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[color:var(--border-strong)]"
              }`}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="flex w-full items-center justify-between p-5 text-left font-display text-sm font-semibold text-[var(--text-primary)]"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={`h-4 w-4 text-[var(--brand-primary)] transition-transform duration-200 shrink-0 ml-4 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed border-t border-[color:var(--border-subtle)] pt-3.5">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Still have questions banner */}
      <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">Still have questions?</h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Our team is available on WhatsApp and email to assist your group.
          </p>
        </div>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-dark)] dark:bg-[var(--brand-primary)] px-6 py-2.5 text-xs font-medium text-white dark:text-[#171F1D] hover:opacity-95 transition-opacity shrink-0"
        >
          <span>Contact Support</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
