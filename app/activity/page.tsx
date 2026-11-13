"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@/lib/userContext";
import type { ActivityLogDTO, ActionTypeName } from "@/lib/types";
import { ACTION_TYPES } from "@/lib/types";
import { Activity, AlertTriangle, Filter, RefreshCw } from "lucide-react";
import ActivityLogList from "@/components/ActivityLogList";
import SplitRupeeLoader from "@/components/SplitRupeeLoader";
import DataStatusBanner from "@/components/ui/DataStatusBanner";
import { getCachedActivities, saveCachedActivities } from "@/lib/offlineSync";
import { parseApiJsonResponse, resolveDataViewMode, type FetchIssueState } from "@/lib/apiResponse";

export default function ActivityPage() {
  const { currentUser, isLoading: usersLoading } = useUser();
  const [activities, setActivities] = useState<ActivityLogDTO[]>([]);
  const [actionFilter, setActionFilter] = useState<ActionTypeName | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [fetchIssue, setFetchIssue] = useState<FetchIssueState | null>(null);

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
      const outcome = await parseApiJsonResponse<{ ok?: boolean; activities?: ActivityLogDTO[] }>(
        res,
        "Could not load your activity history."
      );
      if (outcome.kind === "ok" && Array.isArray(outcome.data.activities)) {
        saveCachedActivities(currentUser.id, outcome.data.activities);
        setActivities(getCachedActivities(currentUser.id));
        setFetchIssue(null);
      } else {
        setActivities(getCachedActivities(currentUser.id));
        setFetchIssue(
          outcome.kind === "offline"
            ? { kind: "offline", message: outcome.message }
            : { kind: "error", message: outcome.kind === "error" ? outcome.message : "Could not load your activity history." }
        );
      }
    } catch {
      const cachedFallback = getCachedActivities(currentUser.id);
      setActivities(cachedFallback);
      const isOfflineNow = typeof navigator !== "undefined" && !navigator.onLine;
      setFetchIssue({
        kind: isOfflineNow ? "offline" : "error",
        message: isOfflineNow
          ? "You are currently offline. Showing cached activity if available."
          : "Network error while loading activity history.",
      });
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  }, [currentUser?.id, usersLoading]);

  const handleRetry = () => {
    setIsRetrying(true);
    loadActivities(false);
  };

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

  const viewMode = resolveDataViewMode({
    isLoading: loading || usersLoading,
    totalCount: activities.length,
    visibleCount: filtered.length,
    hasFilterActive: actionFilter !== "ALL",
    fetchIssue,
  });

  if (viewMode === "loading" && currentUser) {
    return (
      <SplitRupeeLoader
        variant="page"
        text="Recent Activity"
        subtext="Loading your latest expense and settlement updates..."
      />
    );
  }

  return (
    <div className="space-y-6">
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

      {fetchIssue && activities.length > 0 && (
        <DataStatusBanner
          issue={fetchIssue}
          onRetry={handleRetry}
          isRetrying={isRetrying}
          cachedLabel="Showing cached activity entries until live sync succeeds."
        />
      )}

      {/* Action Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2.5 shadow-[var(--shadow-card)]">
        <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-2 flex items-center gap-1">
          <Filter className="h-3 w-3" aria-hidden="true" /> Filter:
        </span>
        <button
          type="button"
          aria-pressed={actionFilter === "ALL"}
          onClick={() => setActionFilter("ALL")}
          className={`min-h-[44px] sm:min-h-[32px] rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
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
            aria-pressed={actionFilter === act}
            onClick={() => setActionFilter(act)}
            className={`min-h-[44px] sm:min-h-[32px] rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              actionFilter === act
                ? "border-[var(--brand-primary)] bg-[var(--status-positive-bg)] text-[var(--brand-dark)] dark:text-[var(--brand-primary)]"
                : "border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {act.replace("_", " ").toLowerCase()}
          </button>
        ))}
      </div>

      {/* Activity Log List or Error State */}
      {viewMode === "error" && fetchIssue ? (
        <div role="alert" className="rounded-2xl border border-[var(--status-negative-border)] bg-[var(--bg-surface)] p-8 text-center space-y-3 shadow-[var(--shadow-card)]">
          <AlertTriangle className="mx-auto h-8 w-8 text-[var(--status-negative)]" aria-hidden="true" />
          <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">Could not load activity</h2>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">{fetchIssue.message}</p>
          <button
            type="button"
            onClick={handleRetry}
            disabled={isRetrying}
            className="inline-flex min-h-[44px] sm:min-h-[38px] items-center gap-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-4 text-xs font-semibold text-[var(--brand-ink)] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin" : ""}`} aria-hidden="true" />
            <span>{isRetrying ? "Retrying..." : "Retry"}</span>
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-4 sm:p-5">
          <ActivityLogList
            activities={filtered}
            showGroupName={true}
            isFiltered={actionFilter !== "ALL"}
            onResetFilter={() => setActionFilter("ALL")}
          />
        </div>
      )}
    </div>
  );
}
