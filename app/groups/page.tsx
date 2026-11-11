"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { getCachedGroupsList, saveCachedGroupsList } from "@/lib/offlineSync";

const TYPE_ICONS: Record<string, any> = {
  TRIP: Plane,
  HOME: Home,
  COUPLE: Heart,
  OTHER: Tag,
};

export default function GroupsPage() {
  const router = useRouter();
  const { currentUser, isLoading: usersLoading } = useUser();
  const [groups, setGroups] = useState<GroupDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joining, setJoining] = useState(false);

  const groupsRef = useRef(groups);
  groupsRef.current = groups;

  const fetchGroups = useCallback(async (isInitial = false) => {
    if (!currentUser?.id) {
      const cached = getCachedGroupsList();
      if (cached.length > 0) setGroups(cached);
      if (!usersLoading) setLoading(false);
      return;
    }
    const cachedInitial = getCachedGroupsList();
    if (isInitial && cachedInitial.length > 0) {
      setGroups(cachedInitial);
      setLoading(false);
    }
    try {
      if (isInitial && groupsRef.current.length === 0 && cachedInitial.length === 0) setLoading(true);
      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 8000) : null;
      const res = await fetch(`/api/groups?userId=${encodeURIComponent(currentUser.id)}&_t=${Date.now()}`, {
        signal: controller?.signal,
      });
      if (timeoutId) clearTimeout(timeoutId);
      const data = await res.json();
      if (data.ok && Array.isArray(data.groups)) {
        setGroups(data.groups);
        saveCachedGroupsList(data.groups);
      } else {
        const cached = getCachedGroupsList();
        if (cached.length > 0) setGroups(cached);
      }
    } catch (err) {
      console.warn("Failed to load groups (offline mode active):", err);
      const cached = getCachedGroupsList();
      if (cached.length > 0) setGroups(cached);
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
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setJoinError("You're offline. Internet connection is required to join a group.");
      return;
    }
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
        if (data.group?.id) {
          router.push(`/groups/${data.group.id}`);
        }
      } else {
        setJoinError(
          data.offline
            ? "You're offline. Internet connection is required to join a group."
            : data.error || "Invalid invite code"
        );
      }
    } catch (err) {
      setJoinError("Network error. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  return (
    <>
      <div className="mx-auto max-w-6xl space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-[var(--bg-surface)] p-6 border border-[var(--border-subtle)] shadow-[var(--shadow-card)]">
          <div>
            <div className="flex items-center gap-2 text-[var(--brand-dark)] dark:text-[var(--brand-primary)] font-semibold text-xs mb-1">
              <Users className="h-4 w-4" />
              <span>SplitRupee Trip & Shared Groups</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text-primary)]">Your Groups</h1>
            <p className="text-[var(--text-secondary)] text-xs sm:text-sm mt-1">
              Manage expenses, track balances, and plan AI itineraries with your travel buddies.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateGroup(true)}
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--brand-dark)] dark:bg-[var(--brand-primary)] px-5 font-semibold text-xs sm:text-sm text-white dark:text-[#171F1D] hover:opacity-95 transition-opacity shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Group</span>
          </button>
        </div>

        {/* Join Group Bar */}
        <div className="rounded-2xl bg-[var(--bg-surface)] p-4 border border-[var(--border-subtle)] shadow-[var(--shadow-card)]">
          <form onSubmit={handleJoinGroup} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 text-[var(--text-primary)] text-xs sm:text-sm font-medium shrink-0 w-full sm:w-auto">
              <UserPlus className="h-4 w-4 text-[var(--brand-primary)]" />
              <span>Have an Invite Code?</span>
            </div>
            <div className="flex-1 w-full flex items-center gap-2">
              <input
                type="text"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value)}
                placeholder="Enter 8-digit invite code (e.g. TRIP2026)"
                className="h-10 w-full rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] px-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/70 focus:border-[var(--brand-primary)] focus:outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={joining || !joinCodeInput.trim()}
                className="h-10 rounded-xl bg-[var(--status-positive-bg)] hover:opacity-90 border border-[var(--status-positive-border)] px-4 text-xs sm:text-sm font-semibold text-[var(--status-positive)] transition-opacity disabled:opacity-50 shrink-0"
              >
                {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join"}
              </button>
            </div>
          </form>
          {joinError && <p className="text-[var(--status-negative)] text-xs mt-2 pl-1">{joinError}</p>}
        </div>

        {/* Loading State */}
        {loading && groups.length === 0 ? (
          <SplitRupeeLoader
            fullScreen={false}
            text="Your Groups"
            subtext="Loading your active expense groups..."
          />
        ) : !currentUser ? (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-12 text-center shadow-[var(--shadow-card)]">
            <Users className="mx-auto h-10 w-10 text-[var(--brand-primary)] mb-3" />
            <h2 className="font-display text-xl font-semibold text-[var(--text-primary)] mb-2">Login Required</h2>
            <p className="text-[var(--text-secondary)] text-sm max-w-md mx-auto mb-6">
              Please login or sign up to view and manage your trip groups and shared expenses.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/login"
                className="h-10 inline-flex items-center rounded-xl bg-[var(--brand-dark)] dark:bg-[var(--brand-primary)] px-6 text-xs sm:text-sm font-semibold text-white dark:text-[#171F1D] hover:opacity-95 transition-opacity"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="h-10 inline-flex items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] px-6 text-xs sm:text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] p-12 text-center">
            <Users className="mx-auto h-11 w-11 text-[var(--text-secondary)] mb-3" />
            <h2 className="font-display text-xl font-semibold text-[var(--text-primary)] mb-2">No Groups Yet</h2>
            <p className="text-[var(--text-secondary)] text-sm max-w-md mx-auto mb-6">
              You haven&apos;t joined or created any trip groups. Start a group with friends to split costs and plan itineraries together!
            </p>
            <button
              type="button"
              onClick={() => setShowCreateGroup(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--brand-dark)] dark:bg-[var(--brand-primary)] px-5 text-xs sm:text-sm font-semibold text-white dark:text-[#171F1D] hover:opacity-95 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              <span>Create Your First Group</span>
            </button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => {
              const IconComponent = TYPE_ICONS[g.type] || Users;
              return (
                <Link
                  key={g.id}
                  href={`/groups/${g.id}`}
                  prefetch={false}
                  className="group relative flex flex-col justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)] transition-colors hover:border-[var(--brand-primary)]"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--status-positive-bg)] border border-[var(--status-positive-border)] text-[var(--brand-dark)] dark:text-[var(--brand-primary)]">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <span className="rounded-full bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                        {g.type}
                      </span>
                    </div>

                    <h3 className="font-display text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--brand-dark)] dark:group-hover:text-[var(--brand-primary)] transition-colors line-clamp-1">
                      {g.name}
                    </h3>
                    {(g as any).description && (
                      <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                        {(g as any).description}
                      </p>
                    )}
                    <p className="text-xs text-[var(--text-secondary)] mt-2 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span>{g.members?.length || 1} Members</span>
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold block">
                        Invite Code
                      </span>
                      <span className="text-xs font-mono text-[var(--brand-dark)] dark:text-[var(--brand-primary)] font-semibold">
                        {(g as any).inviteCode || g.id.slice(0, 8)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-semibold text-[var(--brand-dark)] dark:text-[var(--brand-primary)] group-hover:translate-x-0.5 transition-transform">
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
