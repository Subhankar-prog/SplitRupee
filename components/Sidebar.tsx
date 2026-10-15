"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/lib/userContext";
import type { GroupDTO } from "@/lib/types";
import {
  LayoutDashboard,
  Activity,
  Receipt,
  Users,
  Plus,
  Plane,
  Home,
  Heart,
  Tag,
  ChevronRight,
  Sparkles,
  UserPlus,
  Loader2,
  X,
} from "lucide-react";
import CreateGroupModal from "./CreateGroupModal";

const TYPE_ICONS = {
  TRIP: Plane,
  HOME: Home,
  COUPLE: Heart,
  OTHER: Tag,
};

import { getCachedGroupsList, saveCachedGroupsList } from "@/lib/offlineSync";

export default function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const { currentUser } = useUser();
  const [groups, setGroups] = useState<GroupDTO[]>(() => getCachedGroupsList());
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [loading, setLoading] = useState(() => getCachedGroupsList().length === 0);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinErr, setJoinErr] = useState("");

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || !currentUser) return;
    try {
      setJoining(true);
      setJoinErr("");
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode: joinCode.trim(),
          userId: currentUser.id,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setJoinCode("");
        setShowJoinModal(false);
        window.dispatchEvent(new Event("splitrupee_refresh"));
      } else {
        setJoinErr(data.error || "Invalid invite code");
      }
    } catch {
      setJoinErr("Failed to join group");
    } finally {
      setJoining(false);
    }
  };

  async function loadGroups() {
    if (!currentUser?.id) {
      const cached = getCachedGroupsList();
      if (cached.length > 0) {
        setGroups(cached);
      } else {
        setGroups([]);
      }
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/groups?userId=${encodeURIComponent(currentUser.id)}&_t=${Date.now()}`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.groups)) {
        setGroups(data.groups);
        saveCachedGroupsList(data.groups);
      } else {
        const cached = getCachedGroupsList();
        if (cached.length > 0) setGroups(cached);
        else if (!data.offline) setGroups([]);
      }
    } catch (e) {
      console.warn("Failed to load sidebar groups (offline mode active):", e);
      const cached = getCachedGroupsList();
      if (cached.length > 0) setGroups(cached);
    } finally {
      setLoading(false);
    }
  }

  // Reload groups whenever current user changes OR route pathname changes (e.g. redirected after exiting/deleting group)
  useEffect(() => {
    loadGroups();
  }, [currentUser?.id, pathname]);

  // Listen for real-time splitrupee_refresh events across the app
  useEffect(() => {
    const handleRefresh = (e?: any) => {
      const exitedId = e?.detail?.groupId;
      if (exitedId) {
        setGroups((prev) => prev.filter((g) => g.id !== exitedId));
      }
      loadGroups();
    };
    window.addEventListener("splitrupee_refresh", handleRefresh as EventListener);
    return () => window.removeEventListener("splitrupee_refresh", handleRefresh as EventListener);
  }, [currentUser?.id]);

  const navLinks = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Recent Activity", href: "/activity", icon: Activity },
    { label: "All Expenses", href: "/expenses", icon: Receipt },
    { label: "AI Itinerary", href: "/itinerary", icon: Plane },
  ];

  return (
    <>
      {/* Sidebar Panel — Desktop Only (hidden on mobile, pristine on md+) */}
      <aside className="hidden md:block fixed top-14 sm:top-16 bottom-0 left-0 z-40 w-64 border-r border-white/10 bg-slate-950/95 backdrop-blur-xl">
        <div className="flex h-full flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Main Navigation Links */}
            <nav className="space-y-1" aria-label="Main navigation">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                    {isActive && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-50" />}
                  </Link>
                );
              })}
            </nav>

            {/* Groups Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-3">
                <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  Groups
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowJoinModal(true)}
                    className="flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/10 transition"
                    title="Join group with invite code"
                  >
                    <UserPlus className="h-3 w-3" />
                    <span>Join</span>
                  </button>
                  <button
                    onClick={() => setShowCreateGroup(true)}
                    className="flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/10 transition"
                    title="Create new group"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                {groups.map((group) => {
                  const Icon = TYPE_ICONS[group.type] || Tag;
                  const isCurrent = pathname === `/groups/${group.id}`;
                  return (
                    <Link
                      key={group.id}
                      href={`/groups/${group.id}`}
                      onClick={onClose}
                      className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition ${
                        isCurrent
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white/5 text-slate-300">
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="truncate">{group.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                        {group.members.length}
                      </span>
                    </Link>
                  );
                })}

                {groups.length === 0 && !loading && (
                  <div className="rounded-xl border border-dashed border-white/10 p-3 text-center text-xs text-slate-500">
                    No groups yet
                  </div>
                )}

                {loading && (
                  <div className="space-y-1.5">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-9 rounded-xl bg-white/5 animate-pulse" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* User Quick Info Box */}
          {currentUser && (
            <div className="p-4 border-t border-white/10">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-bold text-slate-950 text-xs shadow"
                    style={{ background: currentUser.avatarColor || "#10b981" }}
                  >
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-200 truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-emerald-400 truncate">
                      ● Active Session
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-slate-950/95 backdrop-blur-xl" aria-label="Mobile bottom navigation">
        <div className="flex items-center justify-around px-2 py-2">
          <Link
            href="/dashboard"
            className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition ${
              pathname === "/dashboard" ? "text-emerald-400" : "text-slate-500"
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-[10px] font-medium">Dashboard</span>
          </Link>

          <Link
            href="/expenses"
            className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition ${
              pathname === "/expenses" ? "text-emerald-400" : "text-slate-500"
            }`}
          >
            <Receipt className="h-5 w-5" />
            <span className="text-[10px] font-medium">Expenses</span>
          </Link>

          {/* Center: Groups link */}
          <Link
            href="/groups"
            onClick={onClose ? onClose : undefined}
            className="relative -top-4 flex flex-col items-center group"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition">
              <Users className="h-5 w-5 text-slate-950" />
            </div>
            <span className="text-[10px] font-medium text-slate-400 mt-1">Groups</span>
          </Link>

          <Link
            href="/activity"
            className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition ${
              pathname === "/activity" ? "text-emerald-400" : "text-slate-500"
            }`}
          >
            <Activity className="h-5 w-5" />
            <span className="text-[10px] font-medium">Activity</span>
          </Link>

          {/* AI Itinerary link */}
          <Link
            href="/itinerary"
            className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition ${
              pathname === "/itinerary" ? "text-emerald-400" : "text-slate-500"
            }`}
          >
            <Plane className="h-5 w-5" />
            <span className="text-[10px] font-medium">Itinerary</span>
          </Link>
        </div>
      </nav>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <CreateGroupModal
          onClose={() => setShowCreateGroup(false)}
          onCreated={() => {
            setShowCreateGroup(false);
            loadGroups();
            window.dispatchEvent(new Event("splitrupee_refresh"));
          }}
        />
      )}

      {/* Join Group by Code Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-emerald-400" />
                Join Group with Code
              </h3>
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setJoinErr("");
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleJoinByCode} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Invite Code
                </label>
                <input
                  type="text"
                  required
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SR-ABCD12"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-mono tracking-widest text-white uppercase placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
                />
                {joinErr && (
                  <p className="mt-1.5 text-xs text-rose-400">{joinErr}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowJoinModal(false);
                    setJoinErr("");
                  }}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={joining || !joinCode.trim()}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-4 py-2 text-xs font-bold text-slate-950 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-50 shadow-md shadow-emerald-500/20"
                >
                  {joining && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Join Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
