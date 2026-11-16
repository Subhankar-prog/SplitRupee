"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  WifiOff,
  Wifi,
  RotateCw,
  LayoutDashboard,
  Receipt,
  Users,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Calculator,
  History,
  Compass,
  CloudUpload,
  HardDrive,
  RefreshCw,
} from "lucide-react";
import { getOfflineQueue, syncOfflineQueue } from "@/lib/offlineSync";

export default function OfflinePage() {
  const [retrying, setRetrying] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [onlineNow, setOnlineNow] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const updateQueue = () => {
      try {
        setPendingCount(getOfflineQueue().length);
      } catch {
        setPendingCount(0);
      }
    };

    const handleOnline = () => setOnlineNow(true);
    const handleOffline = () => setOnlineNow(false);

    if (typeof window !== "undefined") {
      setOnlineNow(navigator.onLine);
      updateQueue();
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      window.addEventListener("splitrupee_offline_queue_changed", updateQueue);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        window.removeEventListener("splitrupee_offline_queue_changed", updateQueue);
      }
    };
  }, []);

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      await syncOfflineQueue();
      setPendingCount(getOfflineQueue().length);
    } finally {
      setSyncing(false);
    }
  };

  const handleRetry = () => {
    setRetrying(true);
    if (typeof window !== "undefined") {
      if (navigator.onLine) {
        window.location.href = "/dashboard";
      } else {
        setTimeout(() => {
          setOnlineNow(navigator.onLine);
          setRetrying(false);
        }, 800);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col justify-center items-center px-4 py-8 sm:py-14 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-[var(--brand-primary)] opacity-5 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-xl w-full text-center space-y-6 sm:space-y-8">
        {/* Offline Badge & Emblem */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative inline-flex items-center justify-center p-4 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)]">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--status-warning-bg)] border border-[var(--status-warning-border)] text-[var(--status-warning)]">
              {onlineNow ? <Wifi className="h-8 w-8 text-[var(--status-positive)]" /> : <WifiOff className="h-8 w-8" />}
            </div>
            <span
              className={`absolute -top-1 -right-1 flex h-4 w-4 rounded-full ring-2 ring-[var(--bg-surface)] ${
                onlineNow ? "bg-[var(--status-positive)]" : "bg-[var(--status-warning)]"
              }`}
              title={onlineNow ? "Internet connection restored" : "Offline mode active"}
            />
          </div>

          <div
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-semibold ${
              onlineNow
                ? "border-[var(--status-positive-border)] bg-[var(--status-positive-bg)] text-[var(--status-positive)]"
                : "border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] text-[var(--status-warning)]"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${onlineNow ? "bg-[var(--status-positive)]" : "bg-[var(--status-warning)] animate-pulse"}`} />
            <span>{onlineNow ? "Internet Connection Restored" : "Offline Mode Active"}</span>
          </div>
        </div>

        {/* Hero Title & Description */}
        <div className="space-y-2.5">
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            {onlineNow ? "You're Back Online!" : "You are Browsing Offline"}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
            SplitRupee is built with full offline capability. Every expense you record, group ledger you view, and calculation you make is stored safely in your browser and automatically syncs when reconnected.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="w-full sm:w-auto h-10 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-5 text-xs sm:text-sm font-semibold text-[var(--brand-ink)] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <RotateCw className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`} />
            <span>{retrying ? "Checking connection..." : "Check Connection"}</span>
          </button>

          {pendingCount > 0 && (
            <button
              type="button"
              onClick={handleSyncNow}
              disabled={syncing}
              className="w-full sm:w-auto h-10 inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-4 text-xs sm:text-sm font-semibold text-[var(--status-warning)] hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
            >
              <CloudUpload className={`h-4 w-4 ${syncing ? "animate-pulse" : ""}`} />
              <span>{syncing ? "Syncing..." : `Sync ${pendingCount} Queued Action${pendingCount > 1 ? "s" : ""}`}</span>
            </button>
          )}

          <Link
            href="/dashboard"
            className="w-full sm:w-auto h-10 inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-5 text-xs sm:text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] transition-colors"
          >
            <LayoutDashboard className="h-4 w-4 text-[var(--brand-primary)]" />
            <span>Go to Dashboard</span>
          </Link>
        </div>

        {/* Available Offline Modules Grid */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5 shadow-[var(--shadow-card)] text-left space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-[var(--text-secondary)]">
              Cached &amp; Ready Offline:
            </span>
            {pendingCount > 0 ? (
              <span className="rounded-full border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--status-warning)] tabular-nums">
                {pendingCount} waiting to sync
              </span>
            ) : (
              <span className="rounded-full border border-[var(--status-positive-border)] bg-[var(--status-positive-bg)] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--status-positive)]">
                All changes synced
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <Link
              href="/dashboard"
              className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)] text-[var(--text-primary)] transition-all hover:scale-[1.01]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--bg-surface)] text-[var(--brand-primary)] border border-[var(--border-subtle)]">
                  <LayoutDashboard className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold truncate">Dashboard</p>
                  <p className="text-[10px] text-[var(--text-secondary)] truncate">Balances &amp; debt summary</p>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-[var(--text-secondary)] shrink-0 ml-2" />
            </Link>

            <Link
              href="/expenses"
              className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)] text-[var(--text-primary)] transition-all hover:scale-[1.01]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--bg-surface)] text-[var(--brand-primary)] border border-[var(--border-subtle)]">
                  <Receipt className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold truncate">Expenses</p>
                  <p className="text-[10px] text-[var(--text-secondary)] truncate">Log new offline bills</p>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-[var(--text-secondary)] shrink-0 ml-2" />
            </Link>

            <Link
              href="/groups"
              className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)] text-[var(--text-primary)] transition-all hover:scale-[1.01]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--bg-surface)] text-[var(--brand-primary)] border border-[var(--border-subtle)]">
                  <Users className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold truncate">Groups</p>
                  <p className="text-[10px] text-[var(--text-secondary)] truncate">Members &amp; group ledgers</p>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-[var(--text-secondary)] shrink-0 ml-2" />
            </Link>

            <Link
              href="/activity"
              className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)] text-[var(--text-primary)] transition-all hover:scale-[1.01]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--bg-surface)] text-[var(--status-warning)] border border-[var(--border-subtle)]">
                  <History className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold truncate">Activity Feed</p>
                  <p className="text-[10px] text-[var(--text-secondary)] truncate">Audit trails &amp; events</p>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-[var(--text-secondary)] shrink-0 ml-2" />
            </Link>

            <Link
              href="/calculator"
              className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)] text-[var(--text-primary)] transition-all hover:scale-[1.01]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--bg-surface)] text-[var(--brand-primary)] border border-[var(--border-subtle)]">
                  <Calculator className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold truncate">Split Calculator</p>
                  <p className="text-[10px] text-[var(--text-secondary)] truncate">Instant math offline</p>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-[var(--text-secondary)] shrink-0 ml-2" />
            </Link>

            <Link
              href="/itinerary"
              className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)] text-[var(--text-primary)] transition-all hover:scale-[1.01]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--bg-surface)] text-[var(--brand-primary)] border border-[var(--border-subtle)]">
                  <Compass className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold truncate">Saved Trips</p>
                  <p className="text-[10px] text-[var(--text-secondary)] truncate">View trip day plans offline</p>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-[var(--text-secondary)] shrink-0 ml-2" />
            </Link>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--status-positive-bg)] text-[var(--status-positive)] border border-[var(--status-positive-border)] text-xs">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>
              Offline Ledger Active: Add expenses, edits, and settlements freely. Changes queue safely to browser memory.
            </span>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
          <ShieldCheck className="h-3.5 w-3.5 text-[var(--status-positive)]" />
          <span>Encrypted Local Storage • SplitRupee PWA Engine</span>
        </div>
      </div>
    </div>
  );
}
