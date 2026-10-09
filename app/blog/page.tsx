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
      color: "text-purple-400 bg-purple-500/10",
    },
    {
      slug: "flatmate-rent-and-groceries-guide",
      title: "The Ultimate Flatmate Budgeting Guide: Rent, Wi-Fi & Maid",
      desc: "Stop chasing roommates every month. Learn how recurring splits and debt simplification keep your flat's finances clear.",
      category: "Flatmates",
      readTime: "5 min read",
      date: "Oct 2026",
      icon: Home,
      color: "text-sky-400 bg-sky-500/10",
    },
    {
      slug: "upi-deep-linking-explained",
      title: "Behind the Scenes: How 1-Tap UPI Settlements Work in SplitRupee",
      desc: "A deep dive into NPCI UPI intent protocols, dynamic QR codes, and how SplitRupee eliminates manual VPA typos.",
      category: "Engineering & Tech",
      readTime: "6 min read",
      date: "Sep 2026",
      icon: Sparkles,
      color: "text-emerald-400 bg-emerald-500/10",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 space-y-12 animate-in fade-in duration-300">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400">
          <BookOpen className="h-3.5 w-3.5" />
          <span>SplitRupee Blog & Guides</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          Tips for smarter group expense sharing
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Insights, budgeting strategies, and guides on managing shared expenses without friction.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {articles.map((post) => {
          const Icon = post.icon;
          return (
            <div
              key={post.slug}
              className="flex flex-col justify-between rounded-3xl border border-white/10 bg-white/[0.02] p-6 hover:border-emerald-500/30 transition group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 ${post.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] text-slate-500">{post.readTime}</span>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    {post.category}
                  </span>
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition">
                    {post.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {post.desc}
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
                <span>{post.date}</span>
                <Link
                  href="/calculator"
                  className="inline-flex items-center gap-1 font-semibold text-emerald-400 group-hover:translate-x-1 transition"
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
