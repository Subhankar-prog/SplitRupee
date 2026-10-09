"use client";

import React from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { ArrowLeft, Construction } from "lucide-react";

/*
  ========================================================================
  NOTE: ITINERARY FEATURE HAS BEEN DISABLED AND COMMENTED OUT PER USER REQUEST.
  ========================================================================
*/

export default function ItineraryPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl py-20 px-4 text-center">
        <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-12 backdrop-blur-xl space-y-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto">
            <Construction className="h-8 w-8" />
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            Itinerary Feature Disabled
          </h1>

          <p className="text-slate-400 text-sm max-w-md mx-auto">
            The AI Travel Itinerary Studio feature has been disabled and removed from navigation.
          </p>

          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950 hover:bg-emerald-400 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
