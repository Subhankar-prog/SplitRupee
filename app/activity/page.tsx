"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@/lib/userContext";
import type { ActivityLogDTO, ActionTypeName } from "@/lib/types";
import { ACTION_TYPES } from "@/lib/types";
import { Activity, Clock, Filter, Sparkles } from "lucide-react";
import ActivityLogList from "@/components/ActivityLogList";
import SplitRupeeLoader from "@/components/SplitRupeeLoader";

export default function ActivityPage() {
  const { currentUser } = useUser();
  const [activities, setActivities] = useState<ActivityLogDTO[]>([]);
  const [actionFilter, setActionFilter] = useState<ActionTypeName | "ALL">("ALL");
  const [loading, setLoading] = useState(true);

  const loadActivities = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/activity?userId=${encodeURIComponent(currentUser.id)}&limit=100`);
      const data = await res.json();
      if (data.ok) {
        setActivities(data.activities);
      }
    } catch (e) {
      console.error("Failed to load activities", e);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const filtered = actionFilter === "ALL"
    ? activities
    : activities.filter((a) => a.action === actionFilter);

  if (loading) {
    return (
      <SplitRupeeLoader
        fullScreen={false}
        text="Recent Activity & Audit Log"
        subtext="Loading real-time expense and settlement history..."
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Activity className="h-6 w-6 text-emerald-400" />
            Recent Activity & Audit Log
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time audit trail of all expense creations, edits, deletions, and settlements across your groups
          </p>
        </div>

        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 font-semibold w-fit">
          {filtered.length} total events
        </span>
      </div>

      {/* Action Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.02] p-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center gap-1">
          <Filter className="h-3 w-3" /> Filter:
        </span>
        <button
          onClick={() => setActionFilter("ALL")}
          className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
            actionFilter === "ALL"
              ? "border-emerald-500 bg-emerald-500/15 text-emerald-300"
              : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
          }`}
        >
          All Actions
        </button>
        {ACTION_TYPES.map((act) => (
          <button
            key={act}
            onClick={() => setActionFilter(act)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              actionFilter === act
                ? "border-emerald-500 bg-emerald-500/15 text-emerald-300"
                : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            {act.replace("_", " ").toLowerCase()}
          </button>
        ))}
      </div>

      {/* Activity Log List */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
        <ActivityLogList activities={filtered} showGroupName={true} />
      </div>
    </div>
  );
}
