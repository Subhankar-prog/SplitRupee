"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useUser } from "@/lib/userContext";
import { type GroupDTO } from "@/lib/types";
import { formatINR } from "@/lib/money";
import {
  Users,
  Plus,
  ArrowRight,
  Plane,
  Home,
  Heart,
  Tag,
  Loader2,
  Sparkles,
  UserPlus
} from "lucide-react";
import CreateGroupModal from "@/components/CreateGroupModal";
import SplitRupeeLoader from "@/components/SplitRupeeLoader";

const TYPE_ICONS: Record<string, any> = {
  TRIP: Plane,
  HOME: Home,
  COUPLE: Heart,
  OTHER: Tag,
};

export default function GroupsPage() {
  const { currentUser, isLoading: usersLoading } = useUser();
  const [groups, setGroups] = useState<GroupDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joining, setJoining] = useState(false);

  const fetchGroups = useCallback(async (isInitial = false) => {
    if (!currentUser?.id) {
      if (!usersLoading) setLoading(false);
      return;
    }
    try {
      if (isInitial) setLoading(true);
      const res = await fetch(`/api/groups?userId=${encodeURIComponent(currentUser.id)}&_t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
      });
      const data = await res.json();
      if (data.ok && Array.isArray(data.groups)) {
        setGroups(data.groups);
      }
    } catch (err) {
      console.error("Failed to load groups:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, usersLoading]);

  useEffect(() => {
    fetchGroups(true);

    const handleRefresh = (e?: any) => {
      const exitedId = e?.detail?.groupId;
      if (exitedId) {
        setGroups((prev) => prev.filter((g) => g.id !== exitedId));
      }
      fetchGroups(false);
    };
    window.addEventListener("splitrupee_refresh", handleRefresh as EventListener);
    return () => window.removeEventListener("splitrupee_refresh", handleRefresh as EventListener);
  }, [fetchGroups]);

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim() || !currentUser) return;
    try {
      setJoining(true);
      setJoinError("");
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode: joinCodeInput.trim(),
          userId: currentUser.id
        })
      });
      const data = await res.json();
      if (data.ok) {
        setJoinCodeInput("");
        fetchGroups(false);
      } else {
        setJoinError(data.error || "Invalid invite code");
      }
    } catch (err) {
      setJoinError("Network error. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  return (
    <>
      <div className="mx-auto max-w-6xl space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl bg-slate-900/60 p-6 md:p-8 border border-white/10 backdrop-blur-xl">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-1">
              <Users className="h-4 w-4" />
              <span>SplitRupee Trip & Shared Groups</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">Your Groups</h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage expenses, track balances, and plan AI itineraries with your travel buddies.
            </p>
          </div>

          <button
            onClick={() => setShowCreateGroup(true)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition"
          >
            <Plus className="h-5 w-5" />
            <span>Create New Group</span>
          </button>
        </div>

        {/* Join Group Bar */}
        <div className="rounded-2xl bg-slate-900/40 p-4 border border-white/5 backdrop-blur-md">
          <form onSubmit={handleJoinGroup} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 text-slate-300 text-sm font-medium shrink-0">
              <UserPlus className="h-4 w-4 text-emerald-400" />
              <span>Have an Invite Code?</span>
            </div>
            <div className="flex-1 w-full flex items-center gap-2">
              <input
                type="text"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value)}
                placeholder="Enter 8-digit invite code (e.g. TRIP2026)"
                className="w-full rounded-xl bg-slate-950 border border-white/10 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={joining || !joinCodeInput.trim()}
                className="rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 px-4 py-2 text-sm font-semibold text-emerald-400 transition disabled:opacity-50 shrink-0"
              >
                {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join"}
              </button>
            </div>
          </form>
          {joinError && <p className="text-rose-400 text-xs mt-2 pl-1">{joinError}</p>}
        </div>

        {/* Loading State */}
        {loading && groups.length === 0 ? (
          <SplitRupeeLoader
            fullScreen={false}
            text="Your Groups"
            subtext="Loading your active expense groups..."
          />
        ) : !currentUser ? (
          <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-12 text-center backdrop-blur-xl">
            <Users className="mx-auto h-12 w-12 text-emerald-400/60 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Login Required</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
              Please login or sign up to view and manage your trip groups and shared expenses.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/login"
                className="rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-xl bg-white/10 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition"
              >
                Sign Up
              </Link>
            </div>
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-slate-900/30 p-12 text-center backdrop-blur-xl">
            <Users className="mx-auto h-14 w-14 text-slate-600 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No Groups Yet</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
              You haven&apos;t joined or created any trip groups. Start a group with friends to split costs and plan itineraries together!
            </p>
            <button
              onClick={() => setShowCreateGroup(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition"
            >
              <Plus className="h-5 w-5" />
              <span>Create Your First Group</span>
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => {
              const IconComponent = TYPE_ICONS[g.type] || Users;
              return (
                <Link
                  key={g.id}
                  href={`/groups/${g.id}`}
                  className="group relative flex flex-col justify-between rounded-3xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-xl transition hover:border-emerald-500/40 hover:bg-slate-900/80 shadow-lg hover:shadow-emerald-500/5"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition">
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        {g.type}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition line-clamp-1">
                      {g.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span>{g.members?.length || 1} Members</span>
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">
                        Invite Code
                      </span>
                      <span className="text-xs font-mono text-emerald-400 font-medium">
                        {(g as any).inviteCode || g.id.slice(0, 8)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition">
                      <span>View Group</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {showCreateGroup && (
        <CreateGroupModal
          onClose={() => setShowCreateGroup(false)}
          onCreated={() => {
            setShowCreateGroup(false);
            fetchGroups(false);
          }}
        />
      )}
    </>
  );
}
