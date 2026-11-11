"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@/lib/userContext";
import type { ActivityLogDTO, ActionTypeName } from "@/lib/types";
import { ACTION_TYPES } from "@/lib/types";
import { Activity, Clock, Filter, Sparkles } from "lucide-react";
import ActivityLogList from "@/components/ActivityLogList";
import SplitRupeeLoader from "@/components/SplitRupeeLoader";
import { getCachedActivities, saveCachedActivities } from "@/lib/offlineSync";

export default function ActivityPage() {
  const { currentUser, isLoading: usersLoading } = useUser();
  const [activities, setActivities] = useState<ActivityLogDTO[]>([]);
  const [actionFilter, setActionFilter] = useState<ActionTypeName | "ALL">("ALL");
  const [loading, setLoading] = useState(true);

  const loadActivities = useCallback(async (isInitial = false) => {
    if (!currentUser?.id) {
      const cached = getCachedActivities();
      if (cached.length > 0) setActivities(cached);
      if (!usersLoading) setLoading(false);
      return;
    }
    const cachedInitial = getCachedActivities(currentUser.id);
    if (isInitial && cachedInitial.length > 0) {
      setActivities(cachedInitial);
      setLoading(false);
    }
    try {
      if (isInitial && cachedInitial.length === 0) setLoading(true);
      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 8000) : null;
      const res = await fetch(`/api/activity?userId=${encodeURIComponent(currentUser.id)}&limit=100&_t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
        signal: controller?.signal,
      });
      if (timeoutId) clearTimeout(timeoutId);
      const data = await res.json();
      if (data.ok && Array.isArray(data.activities)) {
        saveCachedActivities(currentUser.id, data.activities);
        setActivities(getCachedActivities(currentUser.id));
      } else {
        setActivities(getCachedActivities(currentUser.id));
      }
    } catch (e) {
      console.warn("Failed to load activities (offline fallback active):", e);
      setActivities(getCachedActivities(currentUser.id));
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, usersLoading]);

  useEffect(() => {
    loadActivities(true);
    const handleRefresh = () => loadActivities(false);
    const handleQueueChanged = () => setActivities(getCachedActivities(currentUser?.id));
    window.addEventListener("splitrupee_refresh", handleRefresh);
    window.addEventListener("splitrupee_offline_queue_changed", handleQueueChanged);
    return () => {
      window.removeEventListener("splitrupee_refresh", handleRefresh);
      window.removeEventListener("splitrupee_offline_queue_changed", handleQueueChanged);
    };
  }, [loadActivities, currentUser?.id]);

  const filtered = actionFilter === "ALL"
    ? activities
    : activities.filter((a) => a.action === actionFilter);

  if (loading && activities.length === 0 && currentUser) {
    return (
      <SplitRupeeLoader
        fullScreen={false}
        text="Recent Activity & History"
        subtext="Loading real-time expense and settlement history..."
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--text-primary)] flex items-center gap-2.5">
            <Activity className="h-6 w-6 text-[var(--brand-primary)]" />
            Recent Activity & History
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Real-time record of all expense creations, edits, deletions, and settlements across your groups
          </p>
        </div>

        <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1 text-xs text-[var(--text-secondary)] font-semibold tabular-nums w-fit shadow-[var(--shadow-card)]">
          {filtered.length} total events
        </span>
      </div>

      {/* Action Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2.5 shadow-[var(--shadow-card)]">
        <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-2 flex items-center gap-1">
          <Filter className="h-3 w-3" /> Filter:
        </span>
        <button
          type="button"
          onClick={() => setActionFilter("ALL")}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            actionFilter === "ALL"
              ? "border-[var(--brand-primary)] bg-[var(--status-positive-bg)] text-[var(--brand-dark)] dark:text-[var(--brand-primary)]"
              : "border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          All Actions
        </button>
        {ACTION_TYPES.map((act) => (
          <button
            key={act}
            type="button"
            onClick={() => setActionFilter(act)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              actionFilter === act
                ? "border-[var(--brand-primary)] bg-[var(--status-positive-bg)] text-[var(--brand-dark)] dark:text-[var(--brand-primary)]"
                : "border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {act.replace("_", " ").toLowerCase()}
          </button>
        ))}
      </div>

      {/* Activity Log List */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-4 sm:p-5">
        <ActivityLogList activities={filtered} showGroupName={true} />
      </div>
    </div>
  );
}
