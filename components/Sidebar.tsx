"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Copy,
  Check,
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
  const router = useRouter();
  const { currentUser } = useUser();
  const [groups, setGroups] = useState<GroupDTO[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinErr, setJoinErr] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || !currentUser) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setJoinErr("You're offline. Internet connection is required to join a group.");
      return;
    }
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
        if (data.group?.id) {
          router.push(`/groups/${data.group.id}`);
        }
      } else {
        setJoinErr(
          data.offline
            ? "You're offline. Internet connection is required to join a group."
            : data.error || "Invalid invite code"
        );
      }
    } catch {
      setJoinErr("Failed to join group");
    } finally {
      setJoining(false);
    }
  };

  async function loadGroups() {
    const cachedInitial = getCachedGroupsList();
    if (cachedInitial.length > 0) {
      setGroups(cachedInitial);
      setLoading(false);
    }
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
    { label: "Your Groups", href: "/groups", icon: Users, badge: groups.length > 0 ? groups.length : undefined },
    { label: "All Expenses", href: "/expenses", icon: Receipt },
    { label: "Recent Activity", href: "/activity", icon: Activity },
    { label: "Trip Planner", href: "/itinerary", icon: Plane },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Main Navigation Links */}
        <nav className="space-y-1" aria-label="Main navigation">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href === "/groups" && pathname.startsWith("/groups"));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-[var(--status-positive-bg)] text-[var(--brand-dark)] dark:text-[var(--brand-primary)] border border-[var(--status-positive-border)] font-semibold"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-secondary)] hover:text-[var(--text-primary)] font-medium border border-transparent"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="ml-auto rounded-full bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-primary)] tabular-nums">
                    {item.badge}
                  </span>
                )}
                {isActive && !item.badge && (
                  <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-60" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Groups Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-3">
            <Link
              href="/groups"
              onClick={onClose}
              className="group/title flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-[var(--text-secondary)] uppercase hover:text-[var(--text-primary)] transition-colors"
              title="View all groups and invite codes"
            >
              <Users className="h-3 w-3 text-[var(--brand-primary)]" />
              <span>Groups</span>
              <ChevronRight className="h-3 w-3 opacity-60 group-hover/title:translate-x-0.5 transition-transform" />
            </Link>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowJoinModal(true)}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-[var(--status-positive)] hover:bg-[var(--status-positive-bg)] transition-colors"
                title="Join group with invite code"
              >
                <UserPlus className="h-3 w-3" />
                <span>Join</span>
              </button>
              <button
                onClick={() => setShowCreateGroup(true)}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-[var(--status-positive)] hover:bg-[var(--status-positive-bg)] transition-colors"
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
              const isCurrent =
                pathname === `/groups/${group.id}` ||
                pathname === `/groups/${(group as any).inviteCode}`;
              const effectiveCode = (group as any).inviteCode || group.id.slice(0, 8);
              const isCopied = copiedId === group.id;

              return (
                <div
                  key={group.id}
                  className={`flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium transition-colors border ${
                    isCurrent
                      ? "bg-[var(--status-positive-bg)] text-[var(--brand-dark)] dark:text-[var(--brand-primary)] border-[var(--status-positive-border)]"
                      : "border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-surface-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <Link
                    href={`/groups/${group.id}`}
                    onClick={onClose}
                    className="flex items-center gap-2 min-w-0 flex-1"
                    title={group.name}
                  >
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="truncate">{group.name}</span>
                  </Link>

                  <button
                    type="button"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      try {
                        await navigator.clipboard.writeText(effectiveCode);
                        setCopiedId(group.id);
                        setTimeout(() => setCopiedId(null), 2000);
                      } catch {}
                    }}
                    className={`ml-1.5 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-mono transition-colors flex items-center gap-1 border ${
                      isCopied
                        ? "bg-[var(--status-positive-bg)] text-[var(--status-positive)] border-[var(--status-positive-border)]"
                        : "bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]"
                    }`}
                    title={`Group Invite Code: ${effectiveCode} (Click to copy)`}
                  >
                    {isCopied ? (
                      <Check className="h-2.5 w-2.5 text-[var(--status-positive)]" />
                    ) : (
                      <Copy className="h-2.5 w-2.5 opacity-60" />
                    )}
                    <span>{effectiveCode}</span>
                  </button>
                </div>
              );
            })}

            {groups.length === 0 && !loading && (
              <div className="rounded-xl border border-dashed border-[var(--border-subtle)] p-3 text-center text-xs text-[var(--text-secondary)]">
                No groups yet
              </div>
            )}

            {loading && (
              <div className="space-y-1.5">
                {[1, 2].map((i) => (
                  <div key={i} className="h-9 rounded-xl bg-[var(--bg-surface-secondary)] animate-pulse" />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {currentUser && (
        <div className="p-4 border-t border-[var(--border-subtle)]">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-3">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-semibold text-white text-xs keep-white"
                style={{ background: currentUser.avatarColor || "#739B83" }}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-[var(--status-positive)] truncate font-medium">
                  Active Session
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-[var(--overlay-backdrop)]"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-72 max-w-[85vw] h-full border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-popover)] flex flex-col">
            <div className="flex items-center justify-between px-4 h-14 border-b border-[var(--border-subtle)]">
              <span className="font-display text-sm font-semibold text-[var(--text-primary)]">
                Navigation
              </span>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-surface-secondary)] hover:text-[var(--text-primary)]"
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">{sidebarContent}</div>
          </aside>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]"
        aria-label="Mobile bottom navigation"
      >
        <div className="flex items-center justify-around px-2 py-1.5">
          <Link
            href="/dashboard"
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
              pathname === "/dashboard"
                ? "text-[var(--brand-dark)] dark:text-[var(--brand-primary)] font-semibold"
                : "text-[var(--text-secondary)]"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="text-[10px]">Dashboard</span>
          </Link>

          <Link
            href="/expenses"
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
              pathname === "/expenses"
                ? "text-[var(--brand-dark)] dark:text-[var(--brand-primary)] font-semibold"
                : "text-[var(--text-secondary)]"
            }`}
          >
            <Receipt className="h-4 w-4" />
            <span className="text-[10px]">Expenses</span>
          </Link>

          <Link
            href="/groups"
            onClick={onClose ? onClose : undefined}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
              pathname.startsWith("/groups")
                ? "text-[var(--brand-dark)] dark:text-[var(--brand-primary)] font-semibold"
                : "text-[var(--text-secondary)]"
            }`}
          >
            <Users className="h-4 w-4" />
            <span className="text-[10px]">Groups</span>
          </Link>

          <Link
            href="/activity"
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
              pathname === "/activity"
                ? "text-[var(--brand-dark)] dark:text-[var(--brand-primary)] font-semibold"
                : "text-[var(--text-secondary)]"
            }`}
          >
            <Activity className="h-4 w-4" />
            <span className="text-[10px]">Activity</span>
          </Link>

          <Link
            href="/itinerary"
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
              pathname.startsWith("/itinerary")
                ? "text-[var(--brand-dark)] dark:text-[var(--brand-primary)] font-semibold"
                : "text-[var(--text-secondary)]"
            }`}
          >
            <Plane className="h-4 w-4" />
            <span className="text-[10px]">Trips</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay-backdrop)] backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-popover)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <h3 className="font-display text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-[var(--status-positive)]" />
                Join Group with Code
              </h3>
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setJoinErr("");
                }}
                className="p-1 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-surface-secondary)] hover:text-[var(--text-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleJoinByCode} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                  Invite Code
                </label>
                <input
                  type="text"
                  required
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SR-ABCD12"
                  className="w-full h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 text-sm font-mono tracking-widest text-[var(--text-primary)] uppercase placeholder:text-[var(--text-secondary)]/60 focus:border-[var(--brand-primary)] focus:outline-none"
                />
                {joinErr && (
                  <p className="mt-1.5 text-xs text-[var(--status-negative)]">{joinErr}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowJoinModal(false);
                    setJoinErr("");
                  }}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] px-4 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={joining || !joinCode.trim()}
                  className="flex items-center gap-2 rounded-xl bg-[var(--brand-dark)] dark:bg-[var(--brand-primary)] px-4 py-2 text-xs font-semibold text-white dark:text-[#171F1D] keep-white hover:opacity-95 disabled:opacity-50"
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
