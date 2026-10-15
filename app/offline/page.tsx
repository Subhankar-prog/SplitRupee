"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  WifiOff,
  RotateCw,
  LayoutDashboard,
  Receipt,
  Users,
  ShieldAlert,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

export default function OfflinePage() {
  const [retrying, setRetrying] = useState(false);
  const [onlineNow, setOnlineNow] = useState(false);

  useEffect(() => {
    const handleOnline = () => setOnlineNow(true);
    const handleOffline = () => setOnlineNow(false);

    if (typeof window !== "undefined") {
      setOnlineNow(navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, []);

  const handleRetry = () => {
    setRetrying(true);
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 w-[30rem] h-[30rem] bg-teal-500/10 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-lg w-full text-center space-y-8">
        {/* Offline Icon Badge */}
        <div className="inline-flex items-center justify-center p-5 rounded-3xl bg-slate-900/90 border border-white/10 shadow-2xl backdrop-blur-xl">
          <div className="relative">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <WifiOff className="h-8 w-8 animate-pulse" />
            </div>
            {onlineNow && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
              </span>
            )}
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-300">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>No Internet Connection</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            You are Offline
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            SplitRupee is running in <strong className="text-emerald-400">Offline PWA Mode</strong>. You can still view cached groups, recent expenses, and calculate splits without an active internet connection.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 active:scale-95 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            <RotateCw className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`} />
            <span>{retrying ? "Reconnecting..." : "Retry Connection"}</span>
          </button>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10 hover:text-white transition"
          >
            <LayoutDashboard className="h-4 w-4 text-emerald-400" />
            <span>Open Cached Dashboard</span>
          </Link>
        </div>

        {/* Cached Quick Links */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-xl text-left space-y-3">
          <h2 className="text-xs font-bold tracking-wider uppercase text-slate-400">
            Available While Offline:
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <Link
              href="/dashboard"
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition"
            >
              <div className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4 text-emerald-400" />
                <span>Dashboard</span>
              </div>
              <ArrowRight className="h-3 w-3 text-slate-500" />
            </Link>

            <Link
              href="/expenses"
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition"
            >
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-teal-400" />
                <span>Expenses List</span>
              </div>
              <ArrowRight className="h-3 w-3 text-slate-500" />
            </Link>

            <Link
              href="/groups"
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition"
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan-400" />
                <span>Your Groups</span>
              </div>
              <ArrowRight className="h-3 w-3 text-slate-500" />
            </Link>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>Offline Ledger Active</span>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-500">
          SplitRupee automatically syncs changes when you reconnect to the internet.
        </p>
      </div>
    </div>
  );
}
