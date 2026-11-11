import React from "react";
import Link from "next/link";
import { BookOpen, ArrowRight, Sparkles, Plane, Home, Calendar } from "lucide-react";

export default function BlogPage() {
  const articles = [
    {
      slug: "how-to-split-goa-trip-expenses",
      title: "How to Split Goa Trip Expenses Fairly with 8 Friends",
      desc: "From beach shacks to self-drive Thar rentals and villa bookings — here is how to manage group expenses with 0 awkwardness.",
      category: "Travel & Trips",
      readTime: "4 min read",
      date: "Oct 2026",
      icon: Plane,
      color: "text-[var(--status-warning)] bg-[var(--accent-sand)]/15",
    },
    {
      slug: "flatmate-rent-and-groceries-guide",
      title: "The Ultimate Flatmate Budgeting Guide: Rent, Wi-Fi & Maid",
      desc: "Stop chasing roommates every month. Learn how recurring splits and debt simplification keep your flat's finances clear.",
      category: "Flatmates",
      readTime: "5 min read",
      date: "Oct 2026",
      icon: Home,
      color: "text-[var(--brand-dark)] dark:text-[var(--brand-primary)] bg-[var(--bg-surface-secondary)]",
    },
    {
      slug: "upi-deep-linking-explained",
      title: "Behind the Scenes: How 1-Tap UPI Settlements Work in SplitRupee",
      desc: "A deep dive into NPCI UPI intent protocols, dynamic QR codes, and how SplitRupee eliminates manual VPA typos.",
      category: "Engineering & Tech",
      readTime: "6 min read",
      date: "Sep 2026",
      icon: Sparkles,
      color: "text-[var(--status-positive)] bg-[var(--status-positive-bg)]",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 space-y-10">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border-subtle)] bg-[var(--bg-surface-secondary)] px-3.5 py-1 text-xs font-medium text-[var(--brand-dark)] dark:text-[var(--brand-primary)]">
          <BookOpen className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
          <span>SplitRupee Blog &amp; Guides</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
          Tips for smarter group expense sharing
        </h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
          Insights, budgeting strategies, and guides on managing shared expenses without friction.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {articles.map((post) => {
          const Icon = post.icon;
          return (
            <div
              key={post.slug}
              className="flex flex-col justify-between rounded-xl border border-[color:var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-card)] hover:border-[color:var(--border-strong)] transition-colors group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg border border-[color:var(--border-subtle)] ${post.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] text-[var(--text-secondary)]">{post.readTime}</span>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-semibold text-[var(--status-positive)] uppercase tracking-wider">
                    {post.category}
                  </span>
                  <h3 className="font-display text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--brand-dark)] dark:group-hover:text-[var(--brand-primary)] transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {post.desc}
                  </p>
                </div>
              </div>

              <div className="pt-5 mt-5 border-t border-[color:var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span>{post.date}</span>
                <Link
                  href="/calculator"
                  className="inline-flex items-center gap-1 font-medium text-[var(--brand-dark)] dark:text-[var(--brand-primary)] group-hover:translate-x-0.5 transition-transform"
                >
                  <span>Read Guide</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
