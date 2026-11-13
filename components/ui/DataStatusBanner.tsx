"use client";

import React from "react";
import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react";
import type { FetchIssueState } from "@/lib/apiResponse";

interface DataStatusBannerProps {
  issue: FetchIssueState;
  onRetry: () => void;
  isRetrying?: boolean;
  cachedLabel?: string;
}

/**
 * Accessible banner communicating offline fallback or transient API errors while preserving stale cached content.
 */
export default function DataStatusBanner({
  issue,
  onRetry,
  isRetrying = false,
  cachedLabel,
}: DataStatusBannerProps) {
  const isOffline = issue.kind === "offline";

  return (
    <div
      role="alert"
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs ${
        isOffline
          ? "border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] text-[var(--status-warning)]"
          : "border-[var(--status-negative-border)] bg-[var(--status-negative-bg)] text-[var(--status-negative)]"
      }`}
    >
      <div className="flex items-start sm:items-center gap-2.5 min-w-0">
        {isOffline ? (
          <WifiOff className="h-4 w-4 shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
        ) : (
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
        )}
        <div className="min-w-0">
          <p className="font-semibold text-[var(--text-primary)]">{issue.message}</p>
          {cachedLabel && (
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{cachedLabel}</p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className="self-start sm:self-auto inline-flex min-h-[44px] sm:min-h-[36px] items-center gap-1.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] transition-colors disabled:opacity-50 shrink-0"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin" : ""}`} aria-hidden="true" />
        <span>{isRetrying ? "Retrying..." : "Retry"}</span>
      </button>
    </div>
  );
}

