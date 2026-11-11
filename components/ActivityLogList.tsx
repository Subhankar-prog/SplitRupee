"use client";

import React from "react";
import type { ActivityLogDTO } from "@/lib/types";
import {
  PlusCircle,
  Edit3,
  Trash2,
  CheckCircle2,
  UserPlus,
  UserMinus,
  Users,
  Clock,
} from "lucide-react";

const ACTION_CONFIG = {
  EXPENSE_CREATED: {
    icon: PlusCircle,
    label: "Added expense",
    color: "text-[var(--status-positive)] bg-[var(--status-positive-bg)] border-[var(--status-positive-border)]",
  },
  EXPENSE_UPDATED: {
    icon: Edit3,
    label: "Updated expense",
    color: "text-[var(--status-warning)] bg-[var(--status-warning-bg)] border-[var(--status-warning-border)]",
  },
  EXPENSE_DELETED: {
    icon: Trash2,
    label: "Deleted expense",
    color: "text-[var(--status-negative)] bg-[var(--status-negative-bg)] border-[var(--status-negative-border)]",
  },
  PAYMENT_SETTLED: {
    icon: CheckCircle2,
    label: "Settled up payment",
    color: "text-[var(--brand-dark)] dark:text-[var(--brand-primary)] bg-[var(--status-positive-bg)] border-[var(--status-positive-border)]",
  },
  MEMBER_ADDED: {
    icon: UserPlus,
    label: "Added member",
    color: "text-[var(--brand-primary)] bg-[var(--bg-surface-secondary)] border-[var(--border-subtle)]",
  },
  MEMBER_REMOVED: {
    icon: UserMinus,
    label: "Removed member",
    color: "text-[var(--status-negative)] bg-[var(--status-negative-bg)] border-[var(--status-negative-border)]",
  },
  GROUP_CREATED: {
    icon: Users,
    label: "Created group",
    color: "text-[var(--status-warning)] bg-[var(--status-warning-bg)] border-[var(--status-warning-border)]",
  },
};

function formatTimeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export default function ActivityLogList({
  activities,
  showGroupName = false,
}: {
  activities: ActivityLogDTO[];
  showGroupName?: boolean;
}) {
  if (activities.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center">
        <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)]">
          <Clock className="h-5 w-5" />
        </div>
        <p className="mt-2.5 text-sm font-medium text-[var(--text-primary)]">No activity yet</p>
        <p className="mt-1 text-xs text-[var(--text-secondary)] max-w-xs mx-auto">
          Every time an expense is created, edited, deleted, or settled, an audit log will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="relative space-y-2.5 before:absolute before:left-[26px] before:top-5 before:bottom-5 before:w-px before:bg-[var(--border-subtle)]">
      {activities.map((log) => {
        const conf = ACTION_CONFIG[log.action] || ACTION_CONFIG.EXPENSE_CREATED;
        const Icon = conf.icon;

        return (
          <div
            key={log.id}
            className="relative flex items-start gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 shadow-[var(--shadow-card)] hover:border-[var(--border-strong)] transition-colors"
          >
            {/* Action Icon Badge */}
            <div
              className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${conf.color}`}
            >
              <Icon className="h-4 w-4" />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: log.user.avatarColor || "#739B83" }}
                  />
                  <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                    {log.user.name}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)]">
                    {conf.label.toLowerCase()}
                  </span>
                  {showGroupName && log.group && (
                    <span className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--brand-dark)] dark:text-[var(--brand-primary)]">
                      in {log.group.name}
                    </span>
                  )}
                  {(log as any).isOfflinePending && (
                    <span className="rounded-full border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--status-warning)]">
                      Pending Sync
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-[var(--text-secondary)] shrink-0 tabular-nums">
                  {formatTimeAgo(log.createdAt)}
                </span>
              </div>

              <p className="mt-1 text-xs font-medium text-[var(--text-primary)] truncate">
                {log.entityTitle}
              </p>

              {log.details && (
                <p className="mt-0.5 text-[11px] text-[var(--text-secondary)] break-words">
                  {log.details}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
