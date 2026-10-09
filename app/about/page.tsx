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
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 space-y-16 animate-in fade-in duration-300">
      {/* Hero */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Our Story</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          We're making shared expenses{" "}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            frictionless for India.
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Built because global splitting apps don't understand how Indian friends travel, split rent, and pay with 1-tap UPI.
        </p>
      </div>

      {/* Mission statement */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:p-10 backdrop-blur-2xl space-y-6">
        <h2 className="text-xl font-bold text-white">Why SplitRupee?</h2>
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            Whether it's a weekend road trip to Goa, splitting electricity and Wi-Fi bills with flatmates in Bengaluru, or dining out with colleagues in Mumbai — calculating who owes whom and copying UPI IDs back and forth is exhausting.
          </p>
          <p>
            Legacy apps are filled with annoying ads, charge high monthly fees for basic features, and force you to manually type 12-digit phone numbers and bank account numbers into separate payment apps.
          </p>
          <p className="font-semibold text-emerald-400">
            SplitRupee is built from the ground up for India: 1-click UPI settlements, smart graph debt minimization, WhatsApp invite links, and a lightning-fast responsive interface that works everywhere.
          </p>
        </div>
      </div>

      {/* Core Values Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Zap className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Zero Friction</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Friends can join via a single WhatsApp link without password headaches.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Non-Custodial & Safe</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            We never touch your money. All settlements flow directly through secure UPI apps.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <TrendingUp className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Smart Debt Simplifier</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Minimizes 20 messy group debts into 3 clean transfers so everyone settles up quickly.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center space-y-4 pt-6">
        <h3 className="text-xl font-bold text-white">Ready to simplify your group bills?</h3>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 px-8 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-emerald-500/25 hover:opacity-95 transition"
        >
          <span>Get Started Free</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
