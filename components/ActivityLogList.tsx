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
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  EXPENSE_UPDATED: {
    icon: Edit3,
    label: "Updated expense",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  EXPENSE_DELETED: {
    icon: Trash2,
    label: "Deleted expense",
    color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  },
  PAYMENT_SETTLED: {
    icon: CheckCircle2,
    label: "Settled up payment",
    color: "text-teal-400 bg-teal-500/10 border-teal-500/20",
  },
  MEMBER_ADDED: {
    icon: UserPlus,
    label: "Added member",
    color: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  },
  MEMBER_REMOVED: {
    icon: UserMinus,
    label: "Removed member",
    color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  },
  GROUP_CREATED: {
    icon: Users,
    label: "Created group",
    color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
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
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
        <Clock className="mx-auto h-8 w-8 text-slate-500" />
        <p className="mt-2 text-sm font-medium text-slate-300">No activity yet</p>
        <p className="mt-1 text-xs text-slate-500">
          Every time an expense is created, edited, deleted, or settled, an audit log will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="relative space-y-3 before:absolute before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-white/10">
      {activities.map((log) => {
        const conf = ACTION_CONFIG[log.action] || ACTION_CONFIG.EXPENSE_CREATED;
        const Icon = conf.icon;

        return (
          <div
            key={log.id}
            className="relative flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 backdrop-blur-xl hover:border-white/20 hover:bg-white/[0.05] transition"
          >
            {/* Action Icon Badge */}
            <div
              className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${conf.color} shadow`}
            >
              <Icon className="h-4 w-4" />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: log.user.avatarColor || "#10b981" }}
                  />
                  <span className="text-xs font-bold text-slate-200 truncate">
                    {log.user.name}
                  </span>
                  <span className="text-xs text-slate-400">
                    {conf.label.toLowerCase()}
                  </span>
                  {showGroupName && log.group && (
                    <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">
                      in {log.group.name}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 shrink-0">
                  {formatTimeAgo(log.createdAt)}
                </span>
              </div>

              <p className="mt-1 text-xs font-medium text-white truncate">
                {log.entityTitle}
              </p>

              {log.details && (
                <p className="mt-0.5 text-[11px] text-slate-400 break-words">
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
