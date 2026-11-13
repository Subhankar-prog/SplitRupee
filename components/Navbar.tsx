"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/lib/userContext";
import { getShellMode } from "@/lib/routeShell";
import { getAvatarTextColor, DEFAULT_AVATAR_COLOR } from "@/lib/avatarColors";
import UserAvatar from "@/components/ui/UserAvatar";
import {
  Plus,
  Menu,
  X,
  Calculator,
  Crown,
  LayoutDashboard,
  LogOut,
  KeyRound,
  Bell,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  ChevronDown,
  ShieldCheck,
  QrCode,
  Check,
  Edit2,
  Plane,
  User,
  Trash2,
} from "lucide-react";
import AddExpenseModal from "./AddExpenseModal";
import { getCachedActivities, saveCachedActivities } from "@/lib/offlineSync";
import ChangePasswordModal from "./ChangePasswordModal";
import AddUpiModal from "./AddUpiModal";
import LogoutConfirmModal from "./LogoutConfirmModal";
import ProfileSettingsModal from "./ProfileSettingsModal";
import { useTheme } from "@/lib/themeContext";
import { useBodyScrollLock } from "@/lib/scrollLock";

export default function Navbar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const { currentUser, setCurrentUser, logout, refreshUsers } = useUser();
  const { isDarkMode, toggleTheme } = useTheme();
  const [showGlobalAddExpense, setShowGlobalAddExpense] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showAddUpiModal, setShowAddUpiModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Online / Offline & Sync Queue state for mobile status bar
  const [isOnline, setIsOnline] = useState(true);
  const [pendingQueueCount, setPendingQueueCount] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const updateSyncStatus = () => {
        try {
          const raw = localStorage.getItem("splitrupee_offline_expenses_queue");
          const q = raw ? JSON.parse(raw) : [];
          setPendingQueueCount(Array.isArray(q) ? q.length : 0);
        } catch {
          setPendingQueueCount(0);
        }
      };
      updateSyncStatus();
      const onOnline = () => {
        setIsOnline(true);
        updateSyncStatus();
      };
      const onOffline = () => {
        setIsOnline(false);
        updateSyncStatus();
      };
      window.addEventListener("online", onOnline);
      window.addEventListener("offline", onOffline);
      window.addEventListener("splitrupee_offline_queue_changed", updateSyncStatus);
      return () => {
        window.removeEventListener("online", onOnline);
        window.removeEventListener("offline", onOffline);
        window.removeEventListener("splitrupee_offline_queue_changed", updateSyncStatus);
      };
    }
  }, []);

  // Quick UPI Edit in Profile Dropdown
  const [isEditingUpi, setIsEditingUpi] = useState(false);
  const [upiInput, setUpiInput] = useState("");
  const [savingUpi, setSavingUpi] = useState(false);
  const [upiSaved, setUpiSaved] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setUpiInput(currentUser.upiId || "");
    }
  }, [currentUser]);

  async function handleSaveUpi() {
    if (!currentUser) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsEditingUpi(false);
      return;
    }
    setSavingUpi(true);
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          upiId: upiInput.trim() || null,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        if (data.user) {
          setCurrentUser(data.user);
        }
        await refreshUsers();
        setUpiSaved(true);
        setTimeout(() => {
          setUpiSaved(false);
          setIsEditingUpi(false);
        }, 1000);
      }
    } catch (err) {
      console.error("Failed to save UPI ID", err);
    } finally {
      setSavingUpi(false);
    }
  }

  async function handleDeleteUpi() {
    if (!currentUser) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsEditingUpi(false);
      return;
    }
    setSavingUpi(true);
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          upiId: null,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setUpiInput("");
        if (data.user) {
          setCurrentUser(data.user);
        }
        await refreshUsers();
        setUpiSaved(true);
        setTimeout(() => {
          setUpiSaved(false);
          setIsEditingUpi(false);
        }, 800);
      }
    } catch (err) {
      console.error("Failed to delete UPI ID", err);
    } finally {
      setSavingUpi(false);
    }
  }

  // Notification items - dynamically loaded from real user activity with persisted read state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifReadAt, setNotifReadAt] = useState<number>(0);

  useEffect(() => {
    const uid = currentUser?.id;
    if (!uid || typeof window === "undefined") {
      setNotifReadAt(0);
      return;
    }
    const stored = Number(localStorage.getItem(`splitrupee_notif_read_${uid}`) || "0");
    setNotifReadAt(Number.isFinite(stored) ? stored : 0);
  }, [currentUser?.id]);

  // Fetch real recent notifications for the logged-in user
  useEffect(() => {
    const userId = currentUser?.id;
    if (!userId) {
      setNotifications([]);
      return;
    }
    const uid: string = userId;
    let isMounted = true;
    const mapActivitiesToNotifs = (list: any[], readWatermark: number) =>
      list.slice(0, 5).map((a: any) => {
        const createdMs = new Date(a.createdAt).getTime();
        const diffMins = Math.floor((Date.now() - createdMs) / (1000 * 60));
        let timeStr = "Just now";
        if (diffMins >= 60 * 24) {
          timeStr = `${Math.floor(diffMins / (60 * 24))}d ago`;
        } else if (diffMins >= 60) {
          timeStr = `${Math.floor(diffMins / 60)}h ago`;
        } else if (diffMins > 0) {
          timeStr = `${diffMins}m ago`;
        }

        const actor = a.user?.name || "Member";
        let title = "Group Activity";
        let desc = a.details || a.entityTitle || "Activity recorded";

        if (a.action === "EXPENSE_CREATED") {
          title = "New expense added";
          desc = `${actor} added ${a.entityTitle || "an expense"}`;
        } else if (a.action === "EXPENSE_UPDATED") {
          title = "Expense updated";
          desc = `${actor} updated ${a.entityTitle || "an expense"}`;
        } else if (a.action === "EXPENSE_DELETED") {
          title = "Expense deleted";
          desc = `${actor} removed ${a.entityTitle || "an expense"}`;
        } else if (a.action === "PAYMENT_SETTLED" || a.action === "SETTLEMENT_RECORDED") {
          title = "Settlement received";
          desc = `${actor} settled ${a.details || a.entityTitle || ""}`;
        } else if (a.action === "MEMBER_ADDED") {
          title = "New member joined";
          desc = `${actor} joined ${a.group?.name || "the group"}`;
        }

        const isRecent = Number.isFinite(createdMs) && createdMs > readWatermark;
        return {
          id: a.id,
          title,
          desc,
          time: timeStr,
          unread: isRecent && a.userId !== uid,
        };
      });

    const readWatermark =
      typeof window !== "undefined"
        ? Number(localStorage.getItem(`splitrupee_notif_read_${uid}`) || "0") || 0
        : notifReadAt;

    const cachedInitial = getCachedActivities(uid);
    if (isMounted && cachedInitial.length > 0) {
      setNotifications(mapActivitiesToNotifs(cachedInitial, readWatermark));
    }

    async function fetchUserNotifications() {
      const latestWatermark =
        typeof window !== "undefined"
          ? Number(localStorage.getItem(`splitrupee_notif_read_${uid}`) || "0") || 0
          : notifReadAt;
      try {
        const res = await fetch(`/api/activity?userId=${encodeURIComponent(uid)}&limit=5`);
        const data = await res.json();
        if (isMounted && data.ok && Array.isArray(data.activities)) {
          saveCachedActivities(uid, data.activities);
          setNotifications(mapActivitiesToNotifs(getCachedActivities(uid), latestWatermark));
        } else if (isMounted) {
          setNotifications(mapActivitiesToNotifs(getCachedActivities(uid), latestWatermark));
        }
      } catch {
        if (isMounted) {
          setNotifications(mapActivitiesToNotifs(getCachedActivities(uid), latestWatermark));
        }
      }
    }
    fetchUserNotifications();
    const handleQueueOrRefresh = () => {
      if (isMounted) {
        const latestWatermark =
          typeof window !== "undefined"
            ? Number(localStorage.getItem(`splitrupee_notif_read_${uid}`) || "0") || 0
            : notifReadAt;
        setNotifications(mapActivitiesToNotifs(getCachedActivities(uid), latestWatermark));
      }
    };
    window.addEventListener("splitrupee_offline_queue_changed", handleQueueOrRefresh);
    window.addEventListener("splitrupee_refresh", fetchUserNotifications);
    return () => {
      isMounted = false;
      window.removeEventListener("splitrupee_offline_queue_changed", handleQueueOrRefresh);
      window.removeEventListener("splitrupee_refresh", fetchUserNotifications);
    };
  }, [currentUser?.id, notifReadAt]);

  function handleMarkNotificationsRead() {
    if (!currentUser?.id) return;
    const now = Date.now();
    if (typeof window !== "undefined") {
      localStorage.setItem(`splitrupee_notif_read_${currentUser.id}`, String(now));
    }
    setNotifReadAt(now);
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  }

  const profileRef = useRef<HTMLDivElement>(null);
  const mobileNotifRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const resourcesRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close dropdowns on outside click and Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileDropdownOpen(false);
      }
      if (resourcesRef.current && !resourcesRef.current.contains(target)) {
        setResourcesOpen(false);
      }
      const inDesktopNotif = notifRef.current?.contains(target);
      const inMobileNotif = mobileNotifRef.current?.contains(target);
      if (!inDesktopNotif && !inMobileNotif) {
        setNotificationsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileDropdownOpen(false);
        setNotificationsOpen(false);
        setResourcesOpen(false);
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setNotificationsOpen(false);
    setResourcesOpen(false);
    setProfileDropdownOpen(false);
  }, [pathname]);

  // Fullscreen toggle handler
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => { });
      setIsFullscreen(false);
    }
  }

  // Dynamic Time-of-Day Greeting
  function getGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    return "Good Evening";
  }

  const unreadCount = notifications.filter((n) => n.unread).length;
  const isAppRoute = getShellMode(pathname, Boolean(currentUser)) === "app";

  // Lock background scroll when public mobile menu drawer is open
  useBodyScrollLock(mobileMenuOpen && !isAppRoute);

  const desktopRightActions = (
    <div className="flex items-center gap-2 shrink-0">
      <button
        type="button"
        onClick={toggleFullscreen}
        className="hidden md:grid h-9 w-9 place-items-center rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] transition-colors"
        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
      >
        {isFullscreen ? <Minimize2 className="h-4 w-4" aria-hidden="true" /> : <Maximize2 className="h-4 w-4" aria-hidden="true" />}
      </button>

      <button
        type="button"
        onClick={toggleTheme}
        className="hidden md:grid h-9 w-9 place-items-center rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] transition-colors"
        title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        aria-label="Toggle theme"
      >
        {isDarkMode ? (
          <Sun className="h-4 w-4 text-[var(--accent-gold-ink)]" aria-hidden="true" />
        ) : (
          <Moon className="h-4 w-4 text-[var(--brand-primary)]" aria-hidden="true" />
        )}
      </button>

      {currentUser && (
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative grid h-9 w-9 place-items-center rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] transition-colors"
            title="Notifications"
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
            aria-haspopup="dialog"
          >
            <Bell className="h-4 w-4" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 grid h-[18px] min-w-[18px] px-1 place-items-center rounded-full bg-[var(--status-negative)] font-semibold text-[10px] text-white dark:text-[var(--brand-ink)]">
                {unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div
              role="dialog"
              aria-label="Notifications"
              className="absolute right-0 mt-2 w-80 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-popover)] space-y-3 z-50 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                <h4 className="font-display text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Bell className="h-3.5 w-3.5 text-[var(--status-positive)]" aria-hidden="true" /> Notifications
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleMarkNotificationsRead}
                    disabled={unreadCount === 0}
                    className="text-[11px] font-medium text-[var(--status-positive)] hover:underline disabled:opacity-50 disabled:no-underline"
                  >
                    {unreadCount > 0 ? "Mark all as read" : "All caught up"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotificationsOpen(false)}
                    aria-label="Close notifications"
                    className="grid h-7 w-7 place-items-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-surface-secondary)] hover:text-[var(--text-primary)]"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {notifications.length > 0 ? (
                <div className="space-y-2">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`rounded-xl p-2.5 text-xs border ${
                        n.unread
                          ? "bg-[var(--status-positive-bg)] border-[var(--status-positive-border)]"
                          : "bg-[var(--bg-surface-secondary)] border-[var(--border-subtle)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-[var(--text-primary)] text-[11px]">{n.title}</p>
                        <span className="text-[11px] text-[var(--text-secondary)] shrink-0">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{n.desc}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center space-y-2">
                  <div className="mx-auto w-9 h-9 rounded-full bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)]">
                    <Bell className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <p className="text-xs font-semibold text-[var(--text-primary)]">No notifications yet</p>
                  <p className="text-[11px] text-[var(--text-secondary)] max-w-[210px] mx-auto leading-relaxed">
                    When activity occurs in your groups, you will see it here.
                  </p>
                </div>
              )}

              <Link
                href="/activity"
                onClick={() => setNotificationsOpen(false)}
                className="block text-center text-[11px] font-semibold text-[var(--status-positive)] hover:underline pt-1"
              >
                View Full Activity Feed
              </Link>
            </div>
          )}
        </div>
      )}

      {currentUser && (
        <button
          type="button"
          onClick={() => setShowGlobalAddExpense(true)}
          className="hidden sm:flex items-center gap-1.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-3.5 py-2 text-xs font-semibold text-[var(--brand-ink)] transition-colors"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.25]" aria-hidden="true" />
          <span className="hidden md:inline">Add Expense</span>
          <span className="sm:inline md:hidden">Add</span>
        </button>
      )}

      {currentUser ? (
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            aria-label="Account menu"
            aria-expanded={profileDropdownOpen}
            aria-haspopup="menu"
            className="flex items-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-1.5 pr-2.5 text-left hover:bg-[var(--bg-surface-secondary)] transition-colors"
          >
            <div className="relative">
              <UserAvatar
                name={currentUser.name}
                avatarUrl={currentUser.avatarUrl}
                avatarColor={currentUser.avatarColor}
                size="sm"
                shape="square"
                isPro={currentUser.isPro}
              />
            </div>

            <div className="hidden sm:block leading-tight text-left min-w-0">
              <div className="flex items-center gap-1">
                <p className="font-semibold text-[var(--text-primary)] text-xs truncate max-w-[140px] md:max-w-none">
                  {currentUser.name.split(" ")[0]}
                </p>
                {currentUser.isPro && (
                  <span className="text-[11px] font-semibold text-[var(--accent-gold-ink)] bg-[var(--accent-gold-bg)] px-1.5 rounded border border-[var(--accent-gold-border)]">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[var(--text-secondary)]">
                {currentUser.isPro ? "Pro Member" : "Active"}
              </p>
            </div>

            <ChevronDown
              className={`hidden sm:block h-3.5 w-3.5 text-[var(--text-secondary)] transition-transform ${
                profileDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2 shadow-[var(--shadow-popover)] z-50">
              <div className="rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] p-3 space-y-2 mb-2">
                <div className="flex items-start gap-2.5">
                  <UserAvatar
                    name={currentUser.name}
                    avatarUrl={currentUser.avatarUrl}
                    avatarColor={currentUser.avatarColor}
                    size="sm"
                    shape="square"
                    isPro={currentUser.isPro}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="font-semibold text-[var(--text-primary)] text-xs break-words leading-tight">
                        {currentUser.name}
                      </p>
                      {currentUser.isPro && (
                        <span className="rounded-full bg-[var(--accent-gold-bg)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--accent-gold-ink)] border border-[var(--accent-gold-border)] inline-flex items-center gap-0.5">
                          <Crown className="h-3 w-3" aria-hidden="true" /> PRO
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[var(--text-secondary)] break-all mt-0.5 leading-tight">
                      {currentUser.email || currentUser.phone || "SplitRupee Member"}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--border-subtle)]">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-[var(--text-secondary)] flex items-center gap-1 font-medium">
                      <QrCode className="h-3 w-3 text-[var(--status-positive)]" />
                      UPI Address:
                    </span>
                    {!isEditingUpi && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setUpiInput(currentUser.upiId || "");
                          setIsEditingUpi(true);
                        }}
                        className="text-[10px] font-semibold text-[var(--status-positive)] hover:underline"
                      >
                        {currentUser.upiId ? "Edit" : "+ Add UPI"}
                      </button>
                    )}
                  </div>

                  {isEditingUpi ? (
                    <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        aria-label="Your UPI ID"
                        value={upiInput}
                        onChange={(e) => setUpiInput(e.target.value.toLowerCase().trim())}
                        placeholder="e.g. 9876543210@ybl"
                        className="w-full text-[11px] font-mono bg-[var(--bg-surface)] border border-[var(--border-strong)] focus:border-[var(--brand-primary)] rounded-lg px-2.5 py-1.5 text-[var(--text-primary)] outline-none"
                        autoFocus
                      />
                      <div className="flex flex-wrap gap-1">
                        {["@ybl", "@paytm", "@okaxis", "@okhdfcbank"].map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => {
                              const base = upiInput.includes("@")
                                ? upiInput.split("@")[0]
                                : upiInput || (currentUser.phone ? currentUser.phone.slice(-10) : currentUser.name.toLowerCase().replace(/[^a-z0-9]/g, ""));
                              setUpiInput(`${base}${h}`);
                            }}
                            className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--brand-primary)] hover:text-[var(--text-primary)]"
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <button
                          onClick={handleSaveUpi}
                          disabled={savingUpi}
                          className="flex-1 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-[var(--brand-ink)] text-[10px] font-semibold py-1 rounded-md transition flex items-center justify-center gap-1"
                        >
                          {savingUpi ? "Saving..." : upiSaved ? "Saved!" : upiInput.trim() ? "Save UPI" : "Clear UPI"}
                        </button>
                        {currentUser.upiId && (
                          <button
                            type="button"
                            onClick={handleDeleteUpi}
                            disabled={savingUpi}
                            className="text-[10px] text-[var(--status-negative)] bg-[var(--status-negative-bg)] border border-[var(--status-negative-border)] px-2 py-1 rounded-md flex items-center gap-1"
                            title="Delete UPI ID"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Delete</span>
                          </button>
                        )}
                        <button
                          onClick={() => setIsEditingUpi(false)}
                          className="text-[10px] text-[var(--text-secondary)] px-2 py-1 rounded-md hover:bg-[var(--bg-surface-hover)]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-[var(--bg-surface)] rounded-lg px-2 py-1.5 border border-[var(--border-subtle)]">
                      <span className="text-[11px] font-mono font-medium text-[var(--status-positive)] truncate">
                        {currentUser.upiId || (
                          <span className="text-[var(--text-secondary)] italic font-sans text-[10px]">
                            No UPI linked yet
                          </span>
                        )}
                      </span>
                      {currentUser.upiId ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-positive)] shrink-0 ml-1.5" />
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-0.5 text-xs">
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    setShowGlobalAddExpense(true);
                  }}
                  className="sm:hidden w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] transition-colors text-left"
                >
                  <Plus className="h-4 w-4 text-[var(--status-positive)]" />
                  <span>Add Expense</span>
                </button>

                <Link
                  href="/dashboard"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4 text-[var(--brand-primary)]" />
                  <span>My Dashboard</span>
                </Link>

                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    setShowProfileSettings(true);
                  }}
                  className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] transition-colors text-left"
                >
                  <User className="h-4 w-4 text-[var(--brand-primary)]" />
                  <span>Profile Settings</span>
                </button>

                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    setShowChangePassword(true);
                  }}
                  className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] transition-colors text-left"
                >
                  <KeyRound className="h-4 w-4 text-[var(--accent-gold-ink)]" />
                  <span>Change Password</span>
                </button>

                {!currentUser?.isPro && (
                  <Link
                    href="/pro"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-[var(--accent-gold-ink)] hover:bg-[var(--accent-gold-bg)] transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Crown className="h-4 w-4" />
                      <span>SplitRupee Pro</span>
                    </div>
                    <span className="text-[11px] bg-[var(--accent-gold-bg)] border border-[var(--accent-gold-border)] px-1.5 py-0.5 rounded font-semibold">PRO</span>
                  </Link>
                )}

                <div className="border-t border-[var(--border-subtle)] my-1" />

                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                  className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-[var(--status-negative)] hover:bg-[var(--status-negative-bg)] transition-colors text-left font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden sm:block rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-3.5 py-2 text-xs font-semibold text-[var(--brand-ink)] transition-colors shadow-sm"
          >
            Sign Up
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--bg-chrome)]">
        {/* MOBILE APP HEADER */}
        {isAppRoute && currentUser ? (
          <div className="md:hidden px-3.5 py-2.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={onToggleSidebar}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] dark:bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                  title="Open menu"
                  aria-label="Open navigation"
                >
                  <Menu className="h-4 w-4" aria-hidden="true" />
                </button>
                <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary)] font-display font-bold text-[var(--brand-ink)]">
                    <span className="text-base">₹</span>
                  </div>
                  <div className="leading-tight min-w-0">
                    <span className="font-display font-bold tracking-tight text-[var(--text-primary)] text-sm block truncate">
                      SplitRupee
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)] tracking-wider uppercase font-medium block -mt-0.5 truncate">
                      Expense Ledger
                    </span>
                  </div>
                </Link>
              </div>

              {!currentUser.isPro && (
                <Link
                  href="/pro"
                  className="shrink-0 flex items-center gap-1 rounded-full border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--status-warning)]"
                >
                  <Crown className="h-3 w-3" aria-hidden="true" />
                  <span>Upgrade Pro</span>
                </Link>
              )}
            </div>

            {/* Profile Holder Card */}
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] dark:bg-[var(--bg-surface)] p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <Link
                    href="/profile"
                    aria-label="Open Profile Settings"
                    className="relative shrink-0 transition-opacity hover:opacity-90"
                  >
                    <UserAvatar
                      name={currentUser.name}
                      avatarUrl={currentUser.avatarUrl}
                      avatarColor={currentUser.avatarColor}
                      size="md"
                      shape="rounded"
                      isPro={currentUser.isPro}
                    />
                    {currentUser.isPro && (
                      <span
                        className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--bg-surface)] border border-[var(--accent-gold-border)] text-[var(--accent-gold-ink)]"
                        title="SplitRupee Pro Member"
                      >
                        <Crown className="h-2.5 w-2.5" aria-hidden="true" />
                      </span>
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-[var(--text-secondary)] font-medium uppercase tracking-wider truncate">
                      {getGreeting()}
                    </p>
                    <p className="font-display font-semibold text-[var(--text-primary)] text-xs sm:text-sm break-words line-clamp-2 leading-tight">
                      {currentUser.name}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5 min-w-0">
                      <QrCode
                        className={`h-2.5 w-2.5 shrink-0 ${
                          currentUser.upiId ? "text-[var(--status-positive)]" : "text-[var(--text-secondary)]"
                        }`}
                        aria-hidden="true"
                      />
                      <span
                        className={`text-[10px] font-mono break-all line-clamp-1 ${
                          currentUser.upiId ? "text-[var(--status-positive)]" : "text-[var(--text-secondary)]"
                        }`}
                      >
                        {currentUser.upiId || "No UPI linked"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: 5 Compact Circular Controls */}
                <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowAddUpiModal(true)}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] dark:bg-[var(--bg-surface-secondary)] text-[var(--status-positive)] flex items-center justify-center hover:bg-[var(--bg-surface-hover)] transition-colors"
                    title="Add or Edit UPI ID"
                    aria-label="Add or Edit UPI ID"
                  >
                    <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>

                  <div className="relative shrink-0" ref={mobileNotifRef}>
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen((prev) => !prev)}
                      className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] dark:bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] flex items-center justify-center hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] transition-colors"
                      title="Notifications"
                      aria-label="Notifications"
                      aria-expanded={notificationsOpen}
                      aria-haspopup="dialog"
                    >
                      <Bell className="h-3.5 w-3.5" aria-hidden="true" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[var(--status-negative)] font-semibold text-[9px] text-white dark:text-[var(--brand-ink)]">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {notificationsOpen && (
                      <div
                        role="dialog"
                        aria-label="Notifications"
                        className="fixed inset-x-3 top-28 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-popover)] space-y-3 z-50 max-h-[70vh] overflow-y-auto"
                      >
                        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                          <h4 className="font-display text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                            <Bell className="h-3.5 w-3.5 text-[var(--status-positive)]" aria-hidden="true" /> Notifications
                          </h4>
                          <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                              <button
                                type="button"
                                onClick={handleMarkNotificationsRead}
                                className="min-h-[44px] sm:min-h-0 px-2 text-[11px] font-medium text-[var(--status-positive)] hover:underline"
                              >
                                Mark read
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setNotificationsOpen(false)}
                              aria-label="Close notifications"
                              className="grid h-11 w-11 sm:h-8 sm:w-8 place-items-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-surface-secondary)] hover:text-[var(--text-primary)]"
                            >
                              <X className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>
                        </div>

                        {notifications.length > 0 ? (
                          <div className="space-y-2">
                            {notifications.map((n) => (
                              <div
                                key={n.id}
                                className={`rounded-xl p-2.5 text-xs border ${
                                  n.unread
                                    ? "bg-[var(--status-positive-bg)] border-[var(--status-positive-border)]"
                                    : "bg-[var(--bg-surface-secondary)] border-[var(--border-subtle)]"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <p className="font-semibold text-[var(--text-primary)] text-[11px]">{n.title}</p>
                                  <span className="text-[10px] text-[var(--text-secondary)]">{n.time}</span>
                                </div>
                                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{n.desc}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-5 text-center space-y-1.5">
                            <p className="text-xs font-semibold text-[var(--text-primary)]">No notifications yet</p>
                            <p className="text-[11px] text-[var(--text-secondary)]">
                              Activity from your groups will show up here.
                            </p>
                          </div>
                        )}

                        <Link
                          href="/activity"
                          onClick={() => setNotificationsOpen(false)}
                          className="flex min-h-[44px] items-center justify-center rounded-xl text-xs font-semibold text-[var(--status-positive)] hover:bg-[var(--bg-surface-secondary)]"
                        >
                          View Full Activity Feed
                        </Link>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] dark:bg-[var(--bg-surface-secondary)] text-[var(--text-primary)] flex items-center justify-center hover:bg-[var(--bg-surface-hover)] transition-colors"
                    title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    aria-label="Toggle theme"
                  >
                    {isDarkMode ? (
                      <Sun className="h-3.5 w-3.5 text-[var(--accent-gold-ink)]" aria-hidden="true" />
                    ) : (
                      <Moon className="h-3.5 w-3.5 text-[var(--brand-primary)]" aria-hidden="true" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowChangePassword(true)}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] dark:bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] flex items-center justify-center hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] transition-colors"
                    title="Change Password"
                    aria-label="Change Password"
                  >
                    <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowLogoutConfirm(true)}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] dark:bg-[var(--bg-surface-secondary)] text-[var(--status-negative)] flex items-center justify-center hover:bg-[var(--status-negative-bg)] transition-colors"
                    title="Log Out"
                    aria-label="Log Out"
                  >
                    <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 font-medium">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isOnline ? "bg-[var(--status-positive)]" : "bg-[var(--status-warning)]"
                    }`}
                    aria-hidden="true"
                  />
                  <span className="text-[var(--text-secondary)]">
                    {isOnline
                      ? pendingQueueCount > 0
                        ? `Online • ${pendingQueueCount} pending sync`
                        : "Online • Synced"
                      : "Offline Mode • Local Storage"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Public / Logged Out Mobile Header */
          <div className="md:hidden flex min-h-[56px] w-full items-center justify-between px-3 py-1.5">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--brand-primary)] font-display font-bold text-[var(--brand-ink)]">
                <span className="text-base">₹</span>
              </div>
              <div className="leading-tight">
                <span className="font-display font-bold tracking-tight text-[var(--text-primary)] text-sm block">
                  SplitRupee
                </span>
                <span className="text-[10px] text-[var(--text-secondary)] block -mt-0.5 tracking-wider uppercase font-medium">
                  Expense Ledger
                </span>
              </div>
            </Link>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleTheme}
                className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] dark:bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                aria-label="Toggle theme"
              >
                {isDarkMode ? (
                  <Sun className="h-4 w-4 text-[var(--accent-gold-ink)]" aria-hidden="true" />
                ) : (
                  <Moon className="h-4 w-4 text-[var(--brand-primary)]" aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] dark:bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-public-menu"
              >
                {mobileMenuOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
          </div>
        )}

        {/* DESKTOP NAVBAR */}
        {isAppRoute ? (
          <div className="hidden md:flex h-16 w-full items-stretch">
            {/* Sidebar-aligned Brand Column */}
            <div className="w-64 shrink-0 px-6 border-r border-[var(--border-subtle)] flex items-center">
              <Link href={currentUser ? "/dashboard" : "/"} className="flex items-center gap-2.5 shrink-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-primary)] font-display font-bold text-[var(--brand-ink)] shadow-sm">
                  <span className="text-base">₹</span>
                </div>
                <div className="leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="font-display font-bold tracking-tight text-[var(--text-primary)] text-base">
                      SplitRupee
                    </span>
                    {currentUser?.isPro && (
                      <span className="rounded-full bg-[var(--accent-gold-bg)] border border-[var(--accent-gold-border)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--accent-gold-ink)] flex items-center gap-0.5">
                        <Crown className="h-2.5 w-2.5" />
                        PRO
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[var(--text-secondary)] block -mt-0.5 tracking-wider uppercase font-medium">
                    Expense Ledger
                  </span>
                </div>
              </Link>
            </div>

            {/* Main-grid-aligned Workspace Header */}
            <div className="flex-1 min-w-0 flex items-center">
              <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] min-w-0">
                  {currentUser && (
                    <span className="truncate">
                      {getGreeting()},{" "}
                      <span className="font-semibold text-[var(--text-primary)]">
                        {currentUser.name.split(" ")[0]}
                      </span>
                    </span>
                  )}
                </div>

                {/* RIGHT SECTION */}
                {desktopRightActions}
              </div>
            </div>
          </div>
        ) : (
          /* PUBLIC WEBSITE NAVBAR (Matches max-w-6xl px-4 sm:px-6 public container boundaries) */
          <div className="hidden md:flex mx-auto h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* LEFT SECTION */}
          <div className="flex items-center gap-3 min-w-0">
            <Link href={currentUser ? "/dashboard" : "/"} className="flex items-center gap-2.5 shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-primary)] font-display font-bold text-[var(--brand-ink)] shadow-sm">
                <span className="text-base">₹</span>
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold tracking-tight text-[var(--text-primary)] text-base">
                    SplitRupee
                  </span>
                  {currentUser?.isPro && (
                    <span className="rounded-full bg-[var(--accent-gold-bg)] border border-[var(--accent-gold-border)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--accent-gold-ink)] flex items-center gap-0.5">
                      <Crown className="h-2.5 w-2.5" />
                      PRO
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-[var(--text-secondary)] block -mt-0.5 tracking-wider uppercase font-medium">
                  Expense Ledger
                </span>
              </div>
            </Link>

            {currentUser && isAppRoute && (
              <div className="hidden lg:flex items-center gap-2 ml-2 pl-3 border-l border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
                <span>
                  {getGreeting()},{" "}
                  <span className="font-semibold text-[var(--text-primary)]">
                    {currentUser.name.split(" ")[0]}
                  </span>
                </span>
              </div>
            )}

            {!isAppRoute && (
              <nav
                aria-label="Primary public navigation"
                className="hidden md:flex items-center gap-1 ml-3 pl-3 border-l border-[var(--border-subtle)] text-xs font-medium text-[var(--text-secondary)]"
              >
                <Link
                  href="/#how-it-works"
                  className="rounded-lg px-2.5 py-2 hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] sr-interactive-transition"
                >
                  Product
                </Link>
                <Link
                  href="/#features"
                  className="rounded-lg px-2.5 py-2 hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] sr-interactive-transition"
                >
                  Features
                </Link>
                <Link
                  href="/itinerary"
                  className="rounded-lg px-2.5 py-2 hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] sr-interactive-transition inline-flex items-center gap-1"
                >
                  <Plane className="h-3.5 w-3.5 text-[var(--brand-primary)]" aria-hidden="true" />
                  <span>Trip Planner</span>
                </Link>
                {!currentUser?.isPro && (
                  <Link
                    href="/pro"
                    className="rounded-lg px-2.5 py-2 text-[var(--accent-gold-ink)] hover:bg-[var(--accent-gold-bg)] sr-interactive-transition font-semibold"
                  >
                    Pro
                  </Link>
                )}
                <div className="relative" ref={resourcesRef}>
                  <button
                    type="button"
                    onClick={() => setResourcesOpen((prev) => !prev)}
                    aria-expanded={resourcesOpen}
                    aria-haspopup="menu"
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] sr-interactive-transition"
                  >
                    <span>Resources</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${resourcesOpen ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    />
                  </button>
                  {resourcesOpen && (
                    <div
                      role="menu"
                      aria-label="Public resources"
                      className="absolute left-0 mt-2 w-52 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1.5 shadow-[var(--shadow-popover)] z-50 space-y-0.5"
                    >
                      <Link
                        href="/calculator"
                        role="menuitem"
                        onClick={() => setResourcesOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] transition-colors"
                      >
                        <Calculator className="h-3.5 w-3.5 text-[var(--brand-primary)]" aria-hidden="true" />
                        <span>Split Calculator</span>
                      </Link>
                      <Link
                        href="/blog"
                        role="menuitem"
                        onClick={() => setResourcesOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] transition-colors"
                      >
                        <span>Guides &amp; Blog</span>
                      </Link>
                      <Link
                        href="/itinerary"
                        role="menuitem"
                        onClick={() => setResourcesOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] transition-colors"
                      >
                        <Plane className="h-3.5 w-3.5 text-[var(--brand-primary)]" aria-hidden="true" />
                        <span>Trip Planner</span>
                      </Link>
                      <Link
                        href="/faq"
                        role="menuitem"
                        onClick={() => setResourcesOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] transition-colors"
                      >
                        <span>FAQ &amp; Support</span>
                      </Link>
                      <Link
                        href="/about"
                        role="menuitem"
                        onClick={() => setResourcesOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] transition-colors"
                      >
                        <span>About SplitRupee</span>
                      </Link>
                      <Link
                        href="/contact"
                        role="menuitem"
                        onClick={() => setResourcesOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] transition-colors"
                      >
                        <span>Contact Us</span>
                      </Link>
                    </div>
                  )}
                </div>
              </nav>
            )}
          </div>

          {/* RIGHT SECTION */}
          {desktopRightActions}
        </div>
        )}

        {/* Mobile Dropdown Menu - Public pages */}
        {mobileMenuOpen && !isAppRoute && (
          <div
            id="mobile-public-menu"
            className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-4 space-y-1"
          >
            <Link
              href="/#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[44px] items-center rounded-xl px-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-secondary)] hover:text-[var(--text-primary)]"
            >
              Product &amp; Workflow
            </Link>
            <Link
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[44px] items-center rounded-xl px-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-secondary)] hover:text-[var(--text-primary)]"
            >
              Features
            </Link>
            {!currentUser?.isPro && (
              <Link
                href="/pro"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[44px] items-center rounded-xl px-3 text-sm text-[var(--accent-gold-ink)] hover:bg-[var(--accent-gold-bg)] font-semibold"
              >
                SplitRupee Pro
              </Link>
            )}
            <Link
              href="/calculator"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[44px] items-center rounded-xl px-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-secondary)] hover:text-[var(--text-primary)]"
            >
              Split Calculator
            </Link>
            <Link
              href="/blog"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[44px] items-center rounded-xl px-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-secondary)] hover:text-[var(--text-primary)]"
            >
              Guides &amp; Blog
            </Link>
            <Link
              href="/itinerary"
              onClick={() => setMobileMenuOpen(false)}
              className="min-h-[44px] rounded-xl px-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-secondary)] hover:text-[var(--text-primary)] flex items-center gap-2"
            >
              <Plane className="h-4 w-4 text-[var(--brand-primary)]" aria-hidden="true" />
              <span>Trip Planner</span>
            </Link>
            <Link
              href="/faq"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[44px] items-center rounded-xl px-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-secondary)] hover:text-[var(--text-primary)]"
            >
              FAQ &amp; Support
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[44px] items-center rounded-xl px-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-secondary)] hover:text-[var(--text-primary)]"
            >
              Contact Us
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              className="w-full min-h-[44px] flex items-center justify-between rounded-xl px-3 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] text-left"
            >
              <span className="flex items-center gap-2">
                {isDarkMode ? (
                  <Sun className="h-4 w-4 text-[var(--accent-gold-ink)]" />
                ) : (
                  <Moon className="h-4 w-4 text-[var(--brand-primary)]" />
                )}
                <span>{isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}</span>
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)]">
                {isDarkMode ? "Dark" : "Light"}
              </span>
            </button>

            <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2">
              {currentUser ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowProfileSettings(true);
                    }}
                    className="w-full min-h-[44px] rounded-xl border border-[var(--status-positive-border)] bg-[var(--status-positive-bg)] text-center text-xs font-semibold text-[var(--status-positive)] flex items-center justify-center gap-2"
                  >
                    <User className="h-4 w-4" aria-hidden="true" />
                    <span>Profile Settings</span>
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setShowChangePassword(true);
                      }}
                      className="flex-1 min-h-[44px] rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] text-center text-xs font-semibold text-[var(--text-primary)]"
                    >
                      Change Password
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setShowLogoutConfirm(true);
                      }}
                      className="flex-1 min-h-[44px] rounded-xl bg-[var(--status-negative-bg)] border border-[var(--status-negative-border)] text-center text-xs font-semibold text-[var(--status-negative)]"
                    >
                      Log Out
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 min-h-[44px] flex items-center justify-center rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] text-center text-xs font-semibold text-[var(--text-primary)]"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 min-h-[44px] flex items-center justify-center rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-center text-xs font-semibold text-[var(--brand-ink)]"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Global Add Expense Modal */}
      {showGlobalAddExpense && (
        <AddExpenseModal
          onClose={() => setShowGlobalAddExpense(false)}
          onSaved={() => {
            setShowGlobalAddExpense(false);
            window.dispatchEvent(new Event("splitrupee_refresh"));
          }}
        />
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}

      {/* Profile Settings Modal */}
      {showProfileSettings && (
        <ProfileSettingsModal
          isOpen={showProfileSettings}
          onClose={() => setShowProfileSettings(false)}
          onOpenChangePassword={() => setShowChangePassword(true)}
          onLogoutConfirm={() => setShowLogoutConfirm(true)}
        />
      )}

      {/* Add / Edit UPI Modal */}
      {showAddUpiModal && (
        <AddUpiModal
          isOpen={showAddUpiModal}
          onClose={() => setShowAddUpiModal(false)}
        />
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <LogoutConfirmModal
          isOpen={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={() => {
            setShowLogoutConfirm(false);
            logout();
          }}
          userName={currentUser?.name?.split(" ")[0]}
        />
      )}
    </>
  );
}
