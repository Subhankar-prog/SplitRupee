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
  CheckCircle2,
  Calculator,
  History,
  Compass,
  CloudUpload,
} from "lucide-react";
import { getOfflineQueue, syncOfflineQueue } from "@/lib/offlineSync";

export default function OfflinePage() {
  const [retrying, setRetrying] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [onlineNow, setOnlineNow] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const updateQueue = () => setPendingCount(getOfflineQueue().length);
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
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      <div className="relative z-10 max-w-lg w-full text-center space-y-7">
        {/* Offline Icon Badge */}
        <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)]">
          <div className="relative">
            <div className="grid h-14 w-14 place-items-center rounded-xl bg-[var(--status-warning-bg)] border border-[var(--status-warning-border)] text-[var(--status-warning)]">
              <WifiOff className="h-7 w-7" />
            </div>
            {onlineNow && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5" aria-label="Online now">
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[var(--status-positive)] ring-2 ring-[var(--bg-surface)]"></span>
              </span>
            )}
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-3.5 py-1 text-xs font-semibold text-[var(--status-warning)]">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>No Internet Connection</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--text-primary)]">
            You are Offline
          </h1>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
            SplitRupee is running in <strong className="text-[var(--brand-primary)]">Offline PWA Mode</strong>. You can still view cached groups, recent expenses, and calculate splits without an active internet connection.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="w-full sm:w-auto h-10 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-6 text-xs sm:text-sm font-semibold text-[var(--brand-ink)] transition-colors disabled:opacity-50"
          >
            <RotateCw className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`} />
            <span>{retrying ? "Reconnecting..." : "Retry Connection"}</span>
          </button>

          {onlineNow && pendingCount > 0 && (
            <button
              type="button"
              onClick={handleSyncNow}
              disabled={syncing}
              className="w-full sm:w-auto h-10 inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-5 text-xs sm:text-sm font-semibold text-[var(--status-warning)] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <CloudUpload className={`h-4 w-4 ${syncing ? "animate-pulse" : ""}`} />
              <span>{syncing ? "Syncing..." : `Sync ${pendingCount} Queued Action${pendingCount > 1 ? "s" : ""}`}</span>
            </button>
          )}

          <Link
            href="/dashboard"
            className="w-full sm:w-auto h-10 inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-5 text-xs sm:text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] transition-colors"
          >
            <LayoutDashboard className="h-4 w-4 text-[var(--brand-primary)]" />
            <span>Open Cached Dashboard</span>
          </Link>
        </div>

        {/* Cached Quick Links */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)] text-left space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold tracking-wider uppercase text-[var(--text-secondary)]">
              Available While Offline:
            </h2>
            {pendingCount > 0 && (
              <span className="rounded-full border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--status-warning)] tabular-nums">
                {pendingCount} waiting to sync
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <Link
              href="/dashboard"
              className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)] text-[var(--text-primary)] transition-colors"
            >
              <div className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4 text-[var(--brand-primary)]" />
                <span>Dashboard</span>
              </div>
              <ArrowRight className="h-3 w-3 text-[var(--text-secondary)]" />
            </Link>

            <Link
              href="/expenses"
              className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)] text-[var(--text-primary)] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-[var(--brand-primary)]" />
                <span>Expenses List</span>
              </div>
              <ArrowRight className="h-3 w-3 text-[var(--text-secondary)]" />
            </Link>

            <Link
              href="/groups"
              className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)] text-[var(--text-primary)] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[var(--brand-primary)]" />
                <span>Your Groups</span>
              </div>
              <ArrowRight className="h-3 w-3 text-[var(--text-secondary)]" />
            </Link>

            <Link
              href="/activity"
              className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)] text-[var(--text-primary)] transition-colors"
            >
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-[var(--status-warning)]" />
                <span>Activity Feed</span>
              </div>
              <ArrowRight className="h-3 w-3 text-[var(--text-secondary)]" />
            </Link>

            <Link
              href="/calculator"
              className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)] text-[var(--text-primary)] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-[var(--brand-primary)]" />
                <span>Split Calculator</span>
              </div>
              <ArrowRight className="h-3 w-3 text-[var(--text-secondary)]" />
            </Link>

            <Link
              href="/itinerary"
              className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)] text-[var(--text-primary)] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-[var(--brand-primary)]" />
                <span>Saved Itineraries</span>
              </div>
              <ArrowRight className="h-3 w-3 text-[var(--text-secondary)]" />
            </Link>

            <div className="sm:col-span-2 flex items-center gap-2 p-2.5 rounded-xl bg-[var(--status-positive-bg)] text-[var(--status-positive)] border border-[var(--status-positive-border)]">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Offline Ledger Active: New expenses, edits, deletes &amp; cash settlements queue safely locally</span>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-[var(--text-secondary)]">
          SplitRupee automatically syncs changes when you reconnect to the internet.
        </p>
      </div>
    </div>
  );
}
