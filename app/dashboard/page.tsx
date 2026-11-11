"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/userContext";
import {
  type GroupDTO,
  type ExpenseDTO,
  type PaymentDTO,
  type ActivityLogDTO,
  CATEGORIES,
} from "@/lib/types";
import { buildLedger, computeNetBalances } from "@/lib/debt";
import { formatINR, formatPaise } from "@/lib/money";
import {
  Users,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Activity,
  Plane,
  Home,
  Heart,
  Tag,
  ChevronRight,
  TrendingUp,
  Receipt,
  Sparkles,
  Loader2,
  Wallet,
  UserPlus,
} from "lucide-react";
import AddExpenseModal from "@/components/AddExpenseModal";
import CreateGroupModal from "@/components/CreateGroupModal";
import SettleUpModal from "@/components/SettleUpModal";
import ActivityLogList from "@/components/ActivityLogList";
import SplitRupeeLoader from "@/components/SplitRupeeLoader";
import {
  getCachedGroupsList,
  saveCachedGroupsList,
  getCachedGroup,
  saveCachedGroup,
  getCachedAllExpenses,
  saveCachedAllExpenses,
  getCachedActivities,
  saveCachedActivities,
} from "@/lib/offlineSync";

const TYPE_ICONS = {
  TRIP: Plane,
  HOME: Home,
  COUPLE: Heart,
  OTHER: Tag,
};

export default function DashboardPage() {
  const router = useRouter();
  const { currentUser, users, isLoading: usersLoading } = useUser();
  const [groups, setGroups] = useState<GroupDTO[]>([]);
  const [expenses, setExpenses] = useState<ExpenseDTO[]>([]);
  const [activities, setActivities] = useState<ActivityLogDTO[]>([]);
  const [groupDetails, setGroupDetails] = useState<Record<string, any>>({});
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Modals
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [settleUpData, setSettleUpData] = useState<{
    groupId: string;
    members: any[];
    groupCreatorId?: string | null;
    transfers?: any[];
    balances?: Record<string, number>;
    payerId?: string;
    receiverId?: string;
    amount?: number;
  } | null>(null);

  // Join group with invite code
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joining, setJoining] = useState(false);

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
          userId: currentUser.id,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setJoinCodeInput("");
        loadDashboardData();
        window.dispatchEvent(new Event("splitrupee_refresh"));
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
    } catch {
      setJoinError("Network error. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  const applyOfflineCacheFallback = useCallback(() => {
    const cachedList = getCachedGroupsList();
    if (cachedList.length > 0) {
      setGroups(cachedList);
      const map: Record<string, any> = {};
      cachedList.forEach((g: any) => {
        const detail = getCachedGroup(g.id);
        if (detail) map[g.id] = detail;
      });
      if (Object.keys(map).length > 0) {
        setGroupDetails(map);
      }
    }
    const cachedExp = getCachedAllExpenses();
    if (cachedExp.length > 0) {
      setExpenses(cachedExp);
    }
    const cachedActs = getCachedActivities(currentUser?.id);
    if (cachedActs.length > 0) {
      setActivities(cachedActs);
    }
    if (cachedList.length > 0 || cachedExp.length > 0 || cachedActs.length > 0) {
      setInitialLoaded(true);
    }
  }, [currentUser?.id]);

  const loadDashboardData = useCallback(async () => {
    if (!currentUser) return;
    applyOfflineCacheFallback();

    try {
      // 1. Fetch groups
      const gRes = await fetch(`/api/groups?userId=${encodeURIComponent(currentUser.id)}&_t=${Date.now()}`);
      const gData = await gRes.json();
      if (gData.ok && Array.isArray(gData.groups)) {
        const userGroups: GroupDTO[] = gData.groups;
        setGroups(userGroups);
        saveCachedGroupsList(userGroups);

        // 2. Fetch full details for each group to compute overall balances
        const detailsMap: Record<string, any> = {};
        await Promise.all(
          userGroups.map(async (g) => {
            try {
              const detailRes = await fetch(`/api/groups/${g.id}?_t=${Date.now()}`);
              const detailData = await detailRes.json();
              if (detailData.ok && detailData.group) {
                saveCachedGroup(g.id, detailData.group);
                detailsMap[g.id] = getCachedGroup(g.id) || detailData.group;
              } else {
                const cachedDetail = getCachedGroup(g.id);
                if (cachedDetail) detailsMap[g.id] = cachedDetail;
              }
            } catch {
              const cachedDetail = getCachedGroup(g.id);
              if (cachedDetail) detailsMap[g.id] = cachedDetail;
            }
          })
        );
        if (Object.keys(detailsMap).length > 0) {
          setGroupDetails(detailsMap);
        }
      } else {
        const cachedList = getCachedGroupsList();
        if (cachedList.length > 0) {
          setGroups(cachedList);
          const map: Record<string, any> = {};
          cachedList.forEach((g: any) => {
            const detail = getCachedGroup(g.id);
            if (detail) map[g.id] = detail;
          });
          setGroupDetails(map);
        }
      }

      // 3. Fetch all expenses for user
      const eRes = await fetch(`/api/expenses?userId=${encodeURIComponent(currentUser.id)}&_t=${Date.now()}`);
      const eData = await eRes.json();
      if (eData.ok && Array.isArray(eData.expenses)) {
        saveCachedAllExpenses(eData.expenses);
        setExpenses(getCachedAllExpenses());
      } else {
        setExpenses(getCachedAllExpenses());
      }

      // 4. Fetch recent activities
      const aRes = await fetch(`/api/activity?userId=${encodeURIComponent(currentUser.id)}&limit=10&_t=${Date.now()}`);
      const aData = await aRes.json();
      if (aData.ok && Array.isArray(aData.activities)) {
        saveCachedActivities(currentUser.id, aData.activities);
        setActivities(getCachedActivities(currentUser.id));
      } else {
        setActivities(getCachedActivities(currentUser.id));
      }
    } catch (e) {
      console.warn("Failed to load live dashboard data (offline fallback active):", e);
      applyOfflineCacheFallback();
    } finally {
      setInitialLoaded(true);
    }
  }, [currentUser?.id, applyOfflineCacheFallback]);

  useEffect(() => {
    loadDashboardData();
    const handleRefresh = (e?: any) => {
      const exitedId = e?.detail?.groupId;
      if (exitedId) {
        setGroups((prev) => prev.filter((g) => g.id !== exitedId));
        setGroupDetails((prev) => {
          const next = { ...prev };
          delete next[exitedId];
          return next;
        });
      }
      loadDashboardData();
    };
    window.addEventListener("splitrupee_refresh", handleRefresh as EventListener);
    window.addEventListener("splitrupee_offline_queue_changed", applyOfflineCacheFallback as EventListener);
    return () => {
      window.removeEventListener("splitrupee_refresh", handleRefresh as EventListener);
      window.removeEventListener("splitrupee_offline_queue_changed", applyOfflineCacheFallback as EventListener);
    };
  }, [loadDashboardData]);

  // Overall Balances Calculation across all groups
  const overallStats = useMemo(() => {
    if (!currentUser) {
      return {
        net: 0,
        youOwe: 0,
        youAreOwed: 0,
        totalSpend: 0,
        groupBalances: {} as Record<string, number>,
        friendsBalances: {} as Record<string, { user: any; net: number; groupId: string; groupName: string }>,
      };
    }

    let totalNet = 0;
    let totalOwe = 0;
    let totalOwed = 0;
    let totalSpend = 0;
    const groupBalances: Record<string, number> = {};
    const friendsBalances: Record<string, { user: any; net: number; groupId: string; groupName: string }> = {};

    Object.entries(groupDetails).forEach(([groupId, g]) => {
      totalSpend += g.expenses.reduce((acc: number, e: any) => acc + (e.totalAmount || 0), 0);
      const ledger = buildLedger(
        g.expenses.map((e: any) => ({ paidById: e.paidById, splits: e.splits })),
        g.members.map((m: any) => m.id),
        g.payments.map((p: any) => ({ payerId: p.payerId, receiverId: p.receiverId, amount: p.amount }))
      );

      const myBal = ledger.balances[currentUser.id] ?? 0;
      groupBalances[groupId] = myBal;
      totalNet += myBal;

      // Check transfers involving current user
      ledger.transfers.forEach((t) => {
        if (t.from === currentUser.id) {
          totalOwe += t.amountPaise;
          const toUser = g.members.find((m: any) => m.id === t.to);
          if (toUser) {
            friendsBalances[toUser.id] = {
              user: toUser,
              net: (friendsBalances[toUser.id]?.net ?? 0) - t.amountPaise,
              groupId,
              groupName: g.name,
            };
          }
        } else if (t.to === currentUser.id) {
          totalOwed += t.amountPaise;
          const fromUser = g.members.find((m: any) => m.id === t.from);
          if (fromUser) {
            friendsBalances[fromUser.id] = {
              user: fromUser,
              net: (friendsBalances[fromUser.id]?.net ?? 0) + t.amountPaise,
              groupId,
              groupName: g.name,
            };
          }
        }
      });
    });

    return { net: totalNet, youOwe: totalOwe, youAreOwed: totalOwed, totalSpend, groupBalances, friendsBalances };
  }, [currentUser, groupDetails]);

  const categoryBreakdown = useMemo(() => {
    const totals: Record<string, number> = {};
    let sum = 0;
    expenses.forEach((exp) => {
      const cat = exp.category || "Miscellaneous";
      const amt = exp.totalAmount || 0;
      totals[cat] = (totals[cat] || 0) + amt;
      sum += amt;
    });
    const palette = ["#263A32", "#739B83", "#D9A86C", "#5E7B6D", "#A5B2A9", "#8E7A5B", "#758078"];
    const ordered = [...CATEGORIES]
      .map((cat, idx) => ({
        category: cat,
        amount: totals[cat] || 0,
        pct: sum > 0 ? ((totals[cat] || 0) / sum) * 100 : 0,
        color: palette[idx % palette.length],
      }))
      .filter((row) => row.amount > 0)
      .sort((a, b) => b.amount - a.amount);
    return { rows: ordered, grandTotal: sum };
  }, [expenses]);

  if (usersLoading || (!initialLoaded && !currentUser)) {
    return (
      <SplitRupeeLoader
        fullScreen={false}
        text="SplitRupee Dashboard"
        subtext="Loading your groups, expenses and balances..."
      />
    );
  }

  if (!currentUser) {
    return (
      <div className="grid min-h-[50vh] place-items-center text-center">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 max-w-md shadow-[var(--shadow-card)]">
          <Wallet className="mx-auto h-10 w-10 text-[var(--brand-primary)] mb-3" />
          <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">Welcome to SplitRupee</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-2">
            Please select an active user or register to access your groups and expenses.
          </p>
          <div className="mt-5 flex gap-3 justify-center">
            <Link
              href="/login"
              className="h-9 inline-flex items-center rounded-xl bg-[var(--brand-dark)] dark:bg-[var(--brand-primary)] px-4 text-xs font-semibold text-white dark:text-[#171F1D] hover:opacity-95 transition-opacity"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="h-9 inline-flex items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] px-4 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Welcome & Summary Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            Welcome back, {currentUser.name.split(" ")[0]}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
            Your overall financial standing across {groups.length} active {groups.length === 1 ? "group" : "groups"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/itinerary"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] transition-colors"
          >
            <Plane className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
            <span>Trip Planner</span>
          </Link>
          <button
            type="button"
            onClick={() => setShowCreateGroup(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Group</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddExpense(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[var(--brand-dark)] dark:bg-[var(--brand-primary)] px-4 text-xs font-semibold text-white dark:text-[#171F1D] hover:opacity-95 transition-opacity"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Net Balance */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Total Net Balance</span>
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)]">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <p
            className={`font-display mt-3 text-2xl font-semibold tracking-tight tabular-nums ${
              overallStats.net > 0
                ? "text-[var(--status-positive)]"
                : overallStats.net < 0
                ? "text-[var(--status-negative)]"
                : "text-[var(--text-primary)]"
            }`}
          >
            {overallStats.net > 0
              ? `+ ${formatPaise(overallStats.net)}`
              : overallStats.net < 0
              ? `- ${formatPaise(Math.abs(overallStats.net))}`
              : "₹0.00"}
          </p>
          <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
            {overallStats.net > 0
              ? "Net receivable across groups"
              : overallStats.net < 0
              ? "Net payable across groups"
              : "All balances settled"}
          </p>
        </div>

        {/* You Owe */}
        <div className="rounded-2xl border border-[var(--status-negative-border)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Amount Owed</span>
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--status-negative-bg)] text-[var(--status-negative)]">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
          <p className="font-display mt-3 text-2xl font-semibold tracking-tight text-[var(--status-negative)] tabular-nums">
            {formatPaise(overallStats.youOwe)}
          </p>
          <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
            Outstanding to group members
          </p>
        </div>

        {/* You are Owed */}
        <div className="rounded-2xl border border-[var(--status-positive-border)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Amount to Receive</span>
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--status-positive-bg)] text-[var(--status-positive)]">
              <ArrowDownLeft className="h-4 w-4" />
            </span>
          </div>
          <p className="font-display mt-3 text-2xl font-semibold tracking-tight text-[var(--status-positive)] tabular-nums">
            {formatPaise(overallStats.youAreOwed)}
          </p>
          <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
            Collectible from friends
          </p>
        </div>

        {/* Total Group Volume */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Total Tracked Spend</span>
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--status-warning-bg)] text-[var(--status-warning)]">
              <Receipt className="h-4 w-4" />
            </span>
          </div>
          <p className="font-display mt-3 text-2xl font-semibold tracking-tight text-[var(--text-primary)] tabular-nums">
            {formatINR(overallStats.totalSpend)}
          </p>
          <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
            Across {expenses.length} recorded {expenses.length === 1 ? "expense" : "expenses"}
          </p>
        </div>
      </div>

      {/* Expense Distribution Chart + Invite Code Bar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Expense Distribution by Category */}
        <div className="lg:col-span-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-sm sm:text-base font-semibold text-[var(--text-primary)]">
                Expense Distribution
              </h2>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Breakdown by spending category across all expenses
              </p>
            </div>
            <Link
              href="/expenses"
              className="text-xs font-medium text-[var(--brand-dark)] dark:text-[var(--brand-primary)] hover:underline flex items-center gap-1"
            >
              <span>All Expenses</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {categoryBreakdown.rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border-subtle)] p-6 text-center text-xs text-[var(--text-secondary)]">
              No category expenses recorded yet. Add your first expense to view distribution.
            </div>
          ) : (
            <div className="space-y-3">
              {/* Restrained Stacked Proportion Bar */}
              <div
                className="flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--bg-surface-secondary)]"
                role="img"
                aria-label="Category expense distribution bar"
              >
                {categoryBreakdown.rows.map((row) => (
                  <div
                    key={row.category}
                    style={{ width: `${Math.max(row.pct, 2)}%`, backgroundColor: row.color }}
                    title={`${row.category}: ${formatINR(row.amount)} (${row.pct.toFixed(0)}%)`}
                  />
                ))}
              </div>

              {/* Clean Legend & Share List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 pt-1">
                {categoryBreakdown.rows.map((row) => (
                  <div key={row.category} className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2.5 w-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: row.color }}
                      />
                      <span className="font-medium text-[var(--text-primary)] truncate">
                        {row.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0 tabular-nums">
                      <span className="text-[11px] text-[var(--text-secondary)]">
                        {row.pct.toFixed(0)}%
                      </span>
                      <span className="font-semibold text-[var(--text-primary)]">
                        {formatINR(row.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Join via Code Card */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)] flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
              <UserPlus className="h-4 w-4 text-[var(--brand-primary)]" />
              <span>Join a Group by Code</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
              Have an invite code from a friend? Enter it below to jump straight into the group ledger.
            </p>
          </div>
          <form onSubmit={handleJoinGroup} className="space-y-2.5">
            <input
              type="text"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              placeholder="Enter code (e.g. TRIP2026)"
              className="h-10 w-full rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] px-3.5 text-xs sm:text-sm font-mono uppercase text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/70 focus:border-[var(--brand-primary)] focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={joining || !joinCodeInput.trim()}
              className="h-10 w-full rounded-xl bg-[var(--brand-dark)] dark:bg-[var(--brand-primary)] text-xs font-semibold text-white dark:text-[#171F1D] hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join Group"}
            </button>
            {joinError && <p className="text-[var(--status-negative)] text-xs">{joinError}</p>}
          </form>
        </div>
      </div>

      {/* Main Grid: Groups & Friends Standings */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Groups List (2 Cols) */}
        <div className="lg:col-span-2 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[var(--brand-primary)]" />
              <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">Your Groups</h2>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateGroup(true)}
              className="text-xs font-semibold text-[var(--brand-dark)] dark:text-[var(--brand-primary)] hover:underline"
            >
              + New Group
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {groups.map((g) => {
              const Icon = TYPE_ICONS[g.type] || Tag;
              const net = overallStats.groupBalances[g.id] ?? 0;
              const detail = groupDetails[g.id];
              const totalSpent = detail?.expenses?.reduce((sum: number, e: any) => sum + e.totalAmount, 0) || 0;

              return (
                <Link
                  key={g.id}
                  href={`/groups/${g.id}`}
                  prefetch={false}
                  className="group rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-card)] hover:border-[var(--brand-primary)] transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--status-positive-bg)] border border-[var(--status-positive-border)] text-[var(--brand-dark)] dark:text-[var(--brand-primary)]">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <h3 className="font-display text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--brand-dark)] dark:group-hover:text-[var(--brand-primary)] transition-colors truncate">
                            {g.name}
                          </h3>
                          <p className="text-[11px] text-[var(--text-secondary)]">
                            {g.members.length} members
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-secondary)] group-hover:text-[var(--brand-primary)] group-hover:translate-x-0.5 transition-all" />
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs border-t border-[var(--border-subtle)] pt-3">
                      <span className="text-[var(--text-secondary)]">Total spent</span>
                      <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                        {formatINR(totalSpent)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl bg-[var(--bg-surface-secondary)] p-2.5 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[var(--text-secondary)]">Your standing</span>
                    <span
                      className={`font-semibold tabular-nums ${
                        net > 0
                          ? "text-[var(--status-positive)]"
                          : net < 0
                          ? "text-[var(--status-negative)]"
                          : "text-[var(--text-secondary)]"
                      }`}
                    >
                      {net > 0
                        ? `Gets back ${formatPaise(net)}`
                        : net < 0
                        ? `Owes ${formatPaise(-net)}`
                        : "Settled up"}
                    </span>
                  </div>
                </Link>
              );
            })}

            {groups.length === 0 && (
              <div className="col-span-2 rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] p-8 text-center">
                <Users className="mx-auto h-8 w-8 text-[var(--text-secondary)] mb-2" />
                <p className="font-display text-sm font-semibold text-[var(--text-primary)]">No groups yet</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
                  Create your first group to start splitting bills and tracking expenses with friends.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCreateGroup(true)}
                  className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-xl bg-[var(--brand-dark)] dark:bg-[var(--brand-primary)] px-4 text-xs font-semibold text-white dark:text-[#171F1D] hover:opacity-95"
                >
                  <Plus className="h-4 w-4" /> Create Group
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Direct Friends Balances & Settlements */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[var(--brand-primary)]" />
              <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">Friends Balances</h2>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-card)] space-y-2.5">
            {Object.keys(overallStats.friendsBalances).length === 0 ? (
              <p className="py-6 text-center text-xs text-[var(--text-secondary)]">
                You&apos;re completely settled up with all friends across all groups.
              </p>
            ) : (
              <div className="space-y-2">
                {Object.values(overallStats.friendsBalances).map(({ user, net, groupId }) => {
                  const isOwed = net > 0;
                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-semibold text-white keep-white text-xs"
                          style={{ background: user.avatarColor || "#739B83" }}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{user.name}</p>
                          <p
                            className={`text-[11px] font-semibold tabular-nums ${
                              isOwed ? "text-[var(--status-positive)]" : "text-[var(--status-negative)]"
                            }`}
                          >
                            {isOwed ? `owes you ${formatPaise(net)}` : `you owe ${formatPaise(-net)}`}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const gDetail = groupDetails[groupId];
                          const gLedger = gDetail
                            ? buildLedger(
                                gDetail.expenses.map((e: any) => ({ paidById: e.paidById, splits: e.splits })),
                                gDetail.members.map((m: any) => m.id),
                                gDetail.payments.map((p: any) => ({ payerId: p.payerId, receiverId: p.receiverId, amount: p.amount }))
                              )
                            : { transfers: [], balances: {} };

                          setSettleUpData({
                            groupId,
                            members: gDetail?.members || [currentUser, user],
                            groupCreatorId: gDetail?.creatorId,
                            transfers: gLedger.transfers,
                            balances: gLedger.balances,
                            payerId: isOwed ? user.id : currentUser.id,
                            receiverId: isOwed ? currentUser.id : user.id,
                            amount: Math.abs(net) / 100,
                          });
                        }}
                        className="rounded-lg border border-[var(--status-positive-border)] bg-[var(--status-positive-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--status-positive)] hover:bg-[var(--brand-dark)] hover:text-white dark:hover:bg-[var(--brand-primary)] dark:hover:text-[#171F1D] transition-colors shrink-0"
                      >
                        Settle Up
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Audit Log / Activity Feed */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[var(--brand-primary)]" />
            <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">Recent Activity & Audit Trail</h2>
          </div>
          <Link
            href="/activity"
            className="text-xs font-medium text-[var(--brand-dark)] dark:text-[var(--brand-primary)] hover:underline flex items-center gap-1"
          >
            View Full Log <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <ActivityLogList activities={activities} showGroupName={true} />
      </div>

      {/* Modals */}
      {showAddExpense && (
        <AddExpenseModal
          onClose={() => setShowAddExpense(false)}
          onSaved={() => {
            setShowAddExpense(false);
            loadDashboardData();
          }}
        />
      )}

      {showCreateGroup && (
        <CreateGroupModal
          onClose={() => setShowCreateGroup(false)}
          onCreated={() => {
            setShowCreateGroup(false);
            loadDashboardData();
          }}
        />
      )}

      {settleUpData && (
        <SettleUpModal
          groupId={settleUpData.groupId}
          members={settleUpData.members}
          groupCreatorId={settleUpData.groupCreatorId}
          transfers={settleUpData.transfers}
          balances={settleUpData.balances}
          defaultPayerId={settleUpData.payerId}
          defaultReceiverId={settleUpData.receiverId}
          defaultAmount={settleUpData.amount}
          onClose={() => setSettleUpData(null)}
          onSettled={() => {
            setSettleUpData(null);
            loadDashboardData();
          }}
        />
      )}
    </div>
  );
}
