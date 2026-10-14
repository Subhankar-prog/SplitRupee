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
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 space-y-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Frequently Asked Questions</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          Everything you need to know about SplitRupee
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          Have questions about UPI settlements, debt simplification, or group invites? We've got answers.
        </p>

        {/* Search bar */}
        <div className="pt-4 max-w-md mx-auto">
          <input
            type="text"
            placeholder="Search questions (e.g. UPI, QR, invite, ghost member)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
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
            className={`rounded-xl px-4 py-2 text-xs font-semibold border transition ${
              activeCategory === cat.id
                ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
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
              className={`rounded-2xl border transition-all ${
                isOpen
                  ? "border-emerald-500/40 bg-white/[0.04]"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20"
              }`}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="flex w-full items-center justify-between p-5 text-left text-sm font-bold text-white"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={`h-4 w-4 text-emerald-400 transition-transform duration-200 shrink-0 ml-4 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-white/5 pt-3 animate-in fade-in duration-200">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Still have questions banner */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-base font-bold text-white">Still have questions?</h3>
          <p className="text-xs text-slate-400">
            Our team is available on WhatsApp and email to assist your group.
          </p>
        </div>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
        >
          <span>Contact Support</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
