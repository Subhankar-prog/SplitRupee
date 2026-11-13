"use client";

import React, { useId, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/lib/userContext";
import { ModalShell, useDialogAccessibility } from "@/components/ui/primitives";
import { getAvatarTextColor, DEFAULT_AVATAR_COLOR } from "@/lib/avatarColors";
import UserAvatar from "@/components/ui/UserAvatar";
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
  const joinCodeInputId = useId();
  const mobileDrawerRef = useRef<HTMLElement>(null);
  const { currentUser } = useUser();
  const [groups, setGroups] = useState<GroupDTO[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinErr, setJoinErr] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useDialogAccessibility(Boolean(isOpen), () => onClose?.(), mobileDrawerRef);

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
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm sr-interactive-transition ${
                  isActive
                    ? "bg-[var(--nav-active-bg)] text-[var(--nav-active-text)] border border-[var(--nav-active-border)] font-semibold"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-secondary)] dark:hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] font-medium border border-transparent"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-[var(--brand-primary)]" : ""}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="ml-auto rounded-full bg-[var(--bg-surface-secondary)] dark:bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-primary)] tabular-nums">
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
                type="button"
                onClick={() => setShowJoinModal(true)}
                className="flex min-h-[44px] md:min-h-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-[var(--status-positive)] hover:bg-[var(--status-positive-bg)] transition-colors"
                title="Join group with invite code"
              >
                <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Join</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCreateGroup(true)}
                className="flex min-h-[44px] md:min-h-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-[var(--status-positive)] hover:bg-[var(--status-positive-bg)] transition-colors"
                title="Create new group"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
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
                      ? "bg-[var(--nav-active-bg)] text-[var(--nav-active-text)] border-[var(--nav-active-border)] font-semibold"
                      : "border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-surface-secondary)] dark:hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <Link
                    href={`/groups/${group.id}`}
                    onClick={onClose}
                    className="flex items-center gap-2 min-w-0 flex-1"
                    title={group.name}
                  >
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[var(--bg-surface-secondary)] dark:bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="line-clamp-2 leading-tight break-words">{group.name}</span>
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
                    aria-label={`Copy invite code ${effectiveCode} for ${group.name}`}
                    className={`ml-1.5 shrink-0 min-h-[44px] md:min-h-0 rounded-md px-2 py-1 text-[10px] font-mono transition-colors flex items-center gap-1 border ${
                      isCopied
                        ? "bg-[var(--status-positive-bg)] text-[var(--status-positive)] border-[var(--status-positive-border)]"
                        : "bg-[var(--bg-surface-secondary)] dark:bg-[var(--bg-surface)] text-[var(--text-secondary)] dark:text-[var(--text-primary)] border-[var(--border-strong)] hover:text-[var(--text-primary)]"
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
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] dark:bg-[var(--bg-surface)] p-3">
            <div className="flex items-center gap-2.5">
              <UserAvatar
                name={currentUser.name}
                avatarUrl={currentUser.avatarUrl}
                avatarColor={currentUser.avatarColor}
                size="md"
                shape="square"
                isPro={currentUser.isPro}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[var(--text-primary)] break-words leading-tight">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-[var(--status-positive)] font-medium">
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
      <aside className="hidden md:block fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-[var(--border-subtle)] bg-[var(--bg-chrome)]">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-[var(--overlay-backdrop)] overscroll-contain touch-none sr-modal-backdrop"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside
            ref={mobileDrawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation drawer"
            tabIndex={-1}
            className="relative z-10 w-72 max-w-[85vw] h-full border-r border-[var(--border-subtle)] bg-[var(--bg-chrome)] shadow-[var(--shadow-popover)] flex flex-col outline-none overscroll-contain sr-drawer-panel"
          >
            <div className="flex items-center justify-between px-4 h-14 border-b border-[var(--border-subtle)]">
              <span className="font-display text-sm font-semibold text-[var(--text-primary)]">
                Navigation
              </span>
              <button
                type="button"
                onClick={onClose}
                className="grid h-11 w-11 place-items-center rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-surface-secondary)] hover:text-[var(--text-primary)]"
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">{sidebarContent}</div>
          </aside>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border-subtle)] bg-[var(--bg-chrome)] pb-[env(safe-area-inset-bottom)]"
        aria-label="Mobile bottom navigation"
      >
        <div className="flex items-center justify-around px-1 py-1">
          <Link
            href="/dashboard"
            className={`flex min-h-[44px] min-w-[52px] flex-col items-center justify-center gap-0.5 px-2.5 py-1 rounded-xl sr-interactive-transition ${
              pathname === "/dashboard"
                ? "text-[var(--nav-active-text)] dark:text-[var(--brand-primary)] bg-[var(--nav-active-bg)] font-semibold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
            <span className="text-[10px]">Dashboard</span>
          </Link>

          <Link
            href="/expenses"
            className={`flex min-h-[44px] min-w-[52px] flex-col items-center justify-center gap-0.5 px-2.5 py-1 rounded-xl sr-interactive-transition ${
              pathname === "/expenses"
                ? "text-[var(--nav-active-text)] dark:text-[var(--brand-primary)] bg-[var(--nav-active-bg)] font-semibold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Receipt className="h-4 w-4" aria-hidden="true" />
            <span className="text-[10px]">Expenses</span>
          </Link>

          <Link
            href="/groups"
            onClick={onClose ? onClose : undefined}
            className={`flex min-h-[44px] min-w-[52px] flex-col items-center justify-center gap-0.5 px-2.5 py-1 rounded-xl sr-interactive-transition ${
              pathname.startsWith("/groups")
                ? "text-[var(--nav-active-text)] dark:text-[var(--brand-primary)] bg-[var(--nav-active-bg)] font-semibold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Users className="h-4 w-4" aria-hidden="true" />
            <span className="text-[10px]">Groups</span>
          </Link>

          <Link
            href="/activity"
            className={`flex min-h-[44px] min-w-[52px] flex-col items-center justify-center gap-0.5 px-2.5 py-1 rounded-xl sr-interactive-transition ${
              pathname === "/activity"
                ? "text-[var(--nav-active-text)] dark:text-[var(--brand-primary)] bg-[var(--nav-active-bg)] font-semibold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Activity className="h-4 w-4" aria-hidden="true" />
            <span className="text-[10px]">Activity</span>
          </Link>

          <Link
            href="/itinerary"
            className={`flex min-h-[44px] min-w-[52px] flex-col items-center justify-center gap-0.5 px-2.5 py-1 rounded-xl sr-interactive-transition ${
              pathname.startsWith("/itinerary")
                ? "text-[var(--nav-active-text)] dark:text-[var(--brand-primary)] bg-[var(--nav-active-bg)] font-semibold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Plane className="h-4 w-4" aria-hidden="true" />
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
      <ModalShell
        isOpen={showJoinModal}
        onClose={() => {
          setShowJoinModal(false);
          setJoinErr("");
        }}
        title={
          <span className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-[var(--status-positive)]" aria-hidden="true" />
            <span>Join Group with Code</span>
          </span>
        }
        maxWidthClass="max-w-sm"
      >
        <form onSubmit={handleJoinByCode} className="space-y-4">
          <div>
            <label htmlFor={joinCodeInputId} className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Invite Code
            </label>
            <input
              id={joinCodeInputId}
              type="text"
              required
              autoFocus
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="e.g. SR-ABCD12"
              className="w-full h-11 sm:h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 text-sm font-mono tracking-widest text-[var(--text-primary)] uppercase placeholder:text-[var(--text-secondary)] focus:border-[var(--brand-primary)] focus:outline-none"
            />
            {joinErr && (
              <p className="mt-1.5 text-xs text-[var(--status-negative)]" role="alert">
                {joinErr}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowJoinModal(false);
                setJoinErr("");
              }}
              className="min-h-[44px] sm:min-h-[38px] rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] px-4 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={joining || !joinCode.trim()}
              className="min-h-[44px] sm:min-h-[38px] flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-4 py-2 text-xs font-semibold text-[var(--brand-ink)] disabled:opacity-50 transition-colors"
            >
              {joining && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
              Join Group
            </button>
          </div>
        </form>
      </ModalShell>
    </>
  );
}
