import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Home, Plane, QrCode } from "lucide-react";
import { BLOG_GUIDES } from "@/lib/blogGuides";

export const metadata: Metadata = {
  title: "Guides & Tips | SplitRupee",
  description:
    "Practical guides on managing shared trip expenses, flatmate rent splits, and 1-tap UPI settlements with SplitRupee.",
};

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 space-y-10">
      <div className="space-y-3 max-w-2xl">
        <p className="text-sm font-semibold text-[var(--brand-dark)] dark:text-[var(--brand-primary)]">SplitRupee Guides</p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
          Practical guides for sharing group expenses
        </h1>
        <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
          Clear workflows for splitting road trip tabs, monthly roommate bills, and direct UPI settlements.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {BLOG_GUIDES.map((post) => {
          const Icon =
            post.iconName === "plane"
              ? Plane
              : post.iconName === "home"
                ? Home
                : QrCode;
          const badgeStyle =
            post.iconName === "plane"
              ? "text-[var(--status-warning)] bg-[var(--status-warning-bg)]"
              : post.iconName === "home"
                ? "text-[var(--brand-dark)] dark:text-[var(--brand-primary)] bg-[var(--bg-surface-secondary)]"
                : "text-[var(--status-positive)] bg-[var(--status-positive-bg)]";

          return (
            <article
              key={post.slug}
              className="flex flex-col justify-between rounded-2xl border border-[color:var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-card)] hover:border-[color:var(--border-strong)] transition-colors"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg border border-[color:var(--border-subtle)] ${badgeStyle}`}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <span className="text-xs font-medium text-[var(--text-secondary)]">{post.readTime}</span>
                </div>

                <div className="space-y-2.5">
                  <span className="block text-xs font-semibold text-[var(--status-positive)]">
                    {post.category}
                  </span>
                  <h2 className="font-display text-lg font-semibold text-[var(--text-primary)] leading-snug">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="hover:text-[var(--brand-dark)] dark:hover:text-[var(--brand-primary)] transition-colors"
                    >
                      {post.title}
                    </Link>
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {post.desc}
                  </p>
                </div>
              </div>

              <div className="pt-5 mt-5 border-t border-[color:var(--border-subtle)] flex items-center justify-between text-xs sm:text-sm text-[var(--text-secondary)]">
                <span>{post.date}</span>
                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex min-h-[44px] sm:min-h-0 items-center gap-1.5 font-semibold text-[var(--brand-dark)] dark:text-[var(--brand-primary)] hover:underline"
                >
                  <span>Read Guide</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
