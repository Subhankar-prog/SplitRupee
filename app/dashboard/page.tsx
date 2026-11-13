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
  type CategoryName,
} from "@/lib/types";
import { buildCategoryDistribution } from "@/lib/categoryChart";
import { buildLedger, computeNetBalances } from "@/lib/debt";
import { formatINR, formatPaise } from "@/lib/money";
import { DEFAULT_AVATAR_COLOR, getAvatarTextColor } from "@/lib/avatarColors";
import UserAvatar from "@/components/ui/UserAvatar";
import ScrollReveal from "@/components/ui/ScrollReveal";
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
  Loader2,
  Wallet,
  UserPlus,
  AlertTriangle,
  RefreshCw,
  Utensils,
  Zap,
  ShoppingBag,
  Film,
  Shapes,
  Compass,
  ArrowRight,
} from "lucide-react";
import AddExpenseModal from "@/components/AddExpenseModal";
import CreateGroupModal from "@/components/CreateGroupModal";
import SettleUpModal from "@/components/SettleUpModal";
import ActivityLogList from "@/components/ActivityLogList";
import SplitRupeeLoader from "@/components/SplitRupeeLoader";
import DataStatusBanner from "@/components/ui/DataStatusBanner";
import { parseApiJsonResponse, type FetchIssueState } from "@/lib/apiResponse";
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

const CATEGORY_ICONS: Record<CategoryName, typeof Utensils> = {
  Food: Utensils,
  Rent: Home,
  Travel: Plane,
  Utilities: Zap,
  Shopping: ShoppingBag,
  Entertainment: Film,
  Miscellaneous: Shapes,
};

export default function DashboardPage() {
  const router = useRouter();
  const { currentUser, users, isLoading: usersLoading } = useUser();
  const [groups, setGroups] = useState<GroupDTO[]>([]);
  const [expenses, setExpenses] = useState<ExpenseDTO[]>([]);
  const [activities, setActivities] = useState<ActivityLogDTO[]>([]);
  const [groupDetails, setGroupDetails] = useState<Record<string, any>>({});
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [fetchIssue, setFetchIssue] = useState<FetchIssueState | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

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
      let nextIssue: FetchIssueState | null = null;
      const recordIssue = (issue: FetchIssueState) => {
        if (!nextIssue || (nextIssue.kind === "offline" && issue.kind === "error")) {
          nextIssue = issue;
        }
      };

      // 1. Fetch groups
      const gRes = await fetch(`/api/groups?userId=${encodeURIComponent(currentUser.id)}&_t=${Date.now()}`);
      const gOutcome = await parseApiJsonResponse<{ ok?: boolean; groups?: GroupDTO[] }>(
        gRes,
        "Could not load your groups."
      );
      if (gOutcome.kind === "ok" && Array.isArray(gOutcome.data.groups)) {
        const userGroups: GroupDTO[] = gOutcome.data.groups;
        setGroups(userGroups);
        saveCachedGroupsList(userGroups);

        // 2. Fetch full details for each group to compute overall balances
        const detailsMap: Record<string, any> = {};
        await Promise.all(
          userGroups.map(async (g) => {
            try {
              const detailRes = await fetch(`/api/groups/${g.id}?_t=${Date.now()}`);
              const detailOutcome = await parseApiJsonResponse<{ ok?: boolean; group?: any }>(
                detailRes,
                `Could not load ${g.name}.`
              );
              if (detailOutcome.kind === "ok" && detailOutcome.data.group) {
                saveCachedGroup(g.id, detailOutcome.data.group);
                detailsMap[g.id] = getCachedGroup(g.id) || detailOutcome.data.group;
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
        recordIssue(
          gOutcome.kind === "offline"
            ? { kind: "offline", message: gOutcome.message }
            : { kind: "error", message: gOutcome.kind === "error" ? gOutcome.message : "Could not load your groups." }
        );
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
      const eOutcome = await parseApiJsonResponse<{ ok?: boolean; expenses?: ExpenseDTO[] }>(
        eRes,
        "Could not load your expenses."
      );
      if (eOutcome.kind === "ok" && Array.isArray(eOutcome.data.expenses)) {
        saveCachedAllExpenses(eOutcome.data.expenses);
        setExpenses(getCachedAllExpenses());
      } else {
        recordIssue(
          eOutcome.kind === "offline"
            ? { kind: "offline", message: eOutcome.message }
            : { kind: "error", message: eOutcome.kind === "error" ? eOutcome.message : "Could not load your expenses." }
        );
        setExpenses(getCachedAllExpenses());
      }

      // 4. Fetch recent activities
      const aRes = await fetch(`/api/activity?userId=${encodeURIComponent(currentUser.id)}&limit=10&_t=${Date.now()}`);
      const aOutcome = await parseApiJsonResponse<{ ok?: boolean; activities?: ActivityLogDTO[] }>(
        aRes,
        "Could not load recent activity."
      );
      if (aOutcome.kind === "ok" && Array.isArray(aOutcome.data.activities)) {
        saveCachedActivities(currentUser.id, aOutcome.data.activities);
        setActivities(getCachedActivities(currentUser.id));
      } else {
        recordIssue(
          aOutcome.kind === "offline"
            ? { kind: "offline", message: aOutcome.message }
            : { kind: "error", message: aOutcome.kind === "error" ? aOutcome.message : "Could not load recent activity." }
        );
        setActivities(getCachedActivities(currentUser.id));
      }

      setFetchIssue(nextIssue);
    } catch {
      applyOfflineCacheFallback();
      const offlineNow = typeof navigator !== "undefined" && !navigator.onLine;
      setFetchIssue({
        kind: offlineNow ? "offline" : "error",
        message: offlineNow
          ? "You are currently offline. Showing cached dashboard data if available."
          : "Network error while loading dashboard data.",
      });
    } finally {
      setInitialLoaded(true);
      setIsRetrying(false);
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

  const categoryBreakdown = useMemo(
    () => buildCategoryDistribution(expenses),
    [expenses]
  );

  const handleRetryDashboard = () => {
    setIsRetrying(true);
    loadDashboardData();
  };

  if (usersLoading || (currentUser && !initialLoaded)) {
    return (
      <SplitRupeeLoader
        variant="page"
        text="SplitRupee"
        subtext="Getting your groups and balances ready..."
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
              className="h-9 inline-flex items-center rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-4 text-xs font-semibold text-[var(--brand-ink)] transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="h-9 inline-flex items-center rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] px-4 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const hasAnyDashboardData = groups.length > 0 || expenses.length > 0 || activities.length > 0;

  if (!hasAnyDashboardData && fetchIssue) {
    return (
      <div className="grid min-h-[50vh] place-items-center p-4">
        <div role="alert" className="rounded-2xl border border-[var(--status-negative-border)] bg-[var(--bg-surface)] p-8 max-w-md text-center shadow-[var(--shadow-card)] space-y-3">
          <AlertTriangle className="mx-auto h-9 w-9 text-[var(--status-negative)]" aria-hidden="true" />
          <h1 className="font-display text-lg font-semibold text-[var(--text-primary)]">Could not load dashboard</h1>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{fetchIssue.message}</p>
          <button
            type="button"
            onClick={handleRetryDashboard}
            disabled={isRetrying}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-5 text-xs font-semibold text-[var(--brand-ink)] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRetrying ? "animate-spin" : ""}`} aria-hidden="true" />
            <span>{isRetrying ? "Retrying..." : "Retry"}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {fetchIssue && hasAnyDashboardData && (
        <DataStatusBanner
          issue={fetchIssue}
          onRetry={handleRetryDashboard}
          isRetrying={isRetrying}
          cachedLabel="Showing cached dashboard figures until live connection restores."
        />
      )}
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
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] dark:bg-[var(--bg-surface-secondary)] px-3 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] dark:hover:bg-[var(--bg-surface-hover)] transition-colors"
          >
            <Plane className="h-3.5 w-3.5 text-[var(--status-info)]" aria-hidden="true" />
            <span>Trip Planner</span>
          </Link>
          <button
            type="button"
            onClick={() => setShowCreateGroup(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] dark:bg-[var(--bg-surface-secondary)] px-3 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] dark:hover:bg-[var(--bg-surface-hover)] transition-colors"
          >
            <Plus className="h-3.5 w-3.5 text-[var(--brand-dark)] dark:text-[var(--brand-primary)]" aria-hidden="true" />
            <span>New Group</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddExpense(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-4 text-xs font-semibold text-[var(--brand-ink)] transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Focal Financial Standing Overview */}
      <ScrollReveal
        as="section"
        aria-label="Financial standing summary"
        className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)] overflow-hidden"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[var(--border-subtle)]">
          {/* Primary Focal Metric: Net Balance */}
          <div className="lg:col-span-5 p-5 sm:p-6 flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Total Net Balance
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                  overallStats.net > 0
                    ? "bg-[var(--status-positive-bg)] text-[var(--status-positive)] border-[var(--status-positive-border)]"
                    : overallStats.net < 0
                    ? "bg-[var(--status-negative-bg)] text-[var(--status-negative)] border-[var(--status-negative-border)]"
                    : "bg-[var(--status-info-bg)] text-[var(--status-info)] border-[var(--status-info-border)]"
                }`}
              >
                <TrendingUp className="h-3 w-3" aria-hidden="true" />
                <span>
                  {overallStats.net > 0
                    ? "Receivable"
                    : overallStats.net < 0
                    ? "Payable"
                    : "Settled"}
                </span>
              </span>
            </div>
            <div>
              <p
                className={`font-display text-3xl sm:text-[32px] font-semibold tracking-tight tabular-nums ${
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
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                {overallStats.net > 0
                  ? "Net receivable across all groups"
                  : overallStats.net < 0
                  ? "Net payable to group members"
                  : "All balances settled across groups"}
              </p>
            </div>
          </div>

          {/* Supporting Metrics via Hairline Dividers */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border-subtle)]">
            <div className="p-4 sm:p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-[var(--text-secondary)]">Amount Owed</span>
                <ArrowUpRight className="h-4 w-4 text-[var(--status-negative)] shrink-0" aria-hidden="true" />
              </div>
              <div className="mt-2.5">
                <p className="font-display text-xl font-semibold tracking-tight text-[var(--status-negative)] tabular-nums">
                  {formatPaise(overallStats.youOwe)}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">To group members</p>
              </div>
            </div>

            <div className="p-4 sm:p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-[var(--text-secondary)]">Amount to Receive</span>
                <ArrowDownLeft className="h-4 w-4 text-[var(--status-positive)] shrink-0" aria-hidden="true" />
              </div>
              <div className="mt-2.5">
                <p className="font-display text-xl font-semibold tracking-tight text-[var(--status-positive)] tabular-nums">
                  {formatPaise(overallStats.youAreOwed)}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">Collectible from friends</p>
              </div>
            </div>

            <div className="p-4 sm:p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-[var(--text-secondary)]">Tracked Spend</span>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[var(--status-info-bg)] border border-[var(--status-info-border)] text-[var(--status-info)]">
                  <Receipt className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                </span>
              </div>
              <div className="mt-2.5">
                <p className="font-display text-xl font-semibold tracking-tight text-[var(--text-primary)] tabular-nums">
                  {formatINR(overallStats.totalSpend)}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                  Across {expenses.length} {expenses.length === 1 ? "expense" : "expenses"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Primary Workspace: Groups & Friends Standings Above the Fold */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Groups List (2 Cols) */}
        <div className="lg:col-span-2 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[var(--brand-dark)] dark:text-[var(--brand-primary)]" aria-hidden="true" />
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
                  className="group rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] dark:hover:bg-[var(--bg-surface-secondary)] p-4 shadow-[var(--shadow-card)] hover:border-[var(--brand-primary)] sr-card-interactive flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--brand-tint-bg)] border border-[var(--brand-tint-border)] text-[var(--brand-dark)] dark:text-[var(--brand-primary)]">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <h3 className="font-display text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--brand-dark)] dark:group-hover:text-[var(--brand-primary)] transition-colors break-words line-clamp-2 leading-snug">
                            {g.name}
                          </h3>
                          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                            {g.members.length} members
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-secondary)] group-hover:text-[var(--brand-dark)] dark:group-hover:text-[var(--brand-primary)] group-hover:translate-x-0.5 transition-all" />
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs border-t border-[var(--border-subtle)] pt-3">
                      <span className="text-[var(--text-secondary)]">Total spent</span>
                      <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                        {formatINR(totalSpent)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] p-2.5 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[var(--text-secondary)]">Your standing</span>
                    <span
                      className={`font-semibold tabular-nums ${
                        net > 0
                          ? "text-[var(--status-positive)]"
                          : net < 0
                          ? "text-[var(--status-negative)]"
                          : "text-[var(--status-info)]"
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
              <div className="sm:col-span-2 rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 sm:p-8 text-center">
                <Users className="mx-auto h-8 w-8 text-[var(--text-secondary)] mb-2" />
                <p className="font-display text-sm font-semibold text-[var(--text-primary)]">No groups yet</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
                  Create your first group to start splitting bills and tracking expenses with friends.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCreateGroup(true)}
                  className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-4 text-xs font-semibold text-[var(--brand-ink)] transition-colors"
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
              <CheckCircle2 className="h-4 w-4 text-[var(--status-positive)]" aria-hidden="true" />
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
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <UserAvatar
                          name={user.name}
                          avatarUrl={user.avatarUrl}
                          avatarColor={user.avatarColor}
                          size="md"
                          shape="square"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[var(--text-primary)] break-words leading-tight">{user.name}</p>
                          <p
                            className={`text-[11px] font-semibold tabular-nums mt-0.5 ${
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
                        className="min-h-[44px] sm:min-h-0 rounded-lg border border-[var(--brand-tint-border)] bg-[var(--bg-surface)] px-3 py-1.5 text-[11px] font-semibold text-[var(--brand-dark)] dark:text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-[var(--brand-ink)] hover:border-[var(--brand-primary)] transition-colors shrink-0"
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

      {/* Expense Distribution Chart + Quick Join via Code */}
      <ScrollReveal className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
              className="text-xs font-semibold text-[var(--brand-dark)] dark:text-[var(--brand-primary)] hover:underline flex items-center gap-1"
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
            <div className="space-y-4">
              {/* Exact Proportional Stacked Overview Bar with Card-Surface Hairline Dividers */}
              <div
                className="flex h-3.5 w-full overflow-hidden rounded-full bg-[var(--bg-surface-secondary)] dark:bg-[var(--bg-canvas)] border border-[var(--border-subtle)] divide-x-2 divide-[var(--bg-surface)]"
                role="img"
                aria-label={categoryBreakdown.ariaSummary}
              >
                {categoryBreakdown.rows.map((row) => (
                  <div
                    key={row.category}
                    style={{ width: `${row.pct}%`, backgroundColor: row.color }}
                    title={`${row.category}: ${formatINR(row.amount)} (${row.pctLabel})`}
                  />
                ))}
              </div>

              {/* Category Share Legend Rows with Icons, Exact Percentage Bars & Accessible Contrast */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-3 pt-1">
                {categoryBreakdown.rows.map((row) => {
                  const CatIcon = CATEGORY_ICONS[row.category] || Shapes;
                  return (
                    <div key={row.category} className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="h-3 w-3 rounded-sm shrink-0 border border-[var(--border-subtle)]"
                            style={{ backgroundColor: row.color }}
                            aria-hidden="true"
                          />
                          <CatIcon
                            className="h-3.5 w-3.5 shrink-0 text-[var(--text-secondary)]"
                            aria-hidden="true"
                          />
                          <span className="font-medium text-[var(--text-primary)] whitespace-nowrap">
                            {row.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 tabular-nums">
                          <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                            {row.pctLabel}
                          </span>
                          <span className="font-semibold text-[var(--text-primary)]">
                            {formatINR(row.amount)}
                          </span>
                        </div>
                      </div>
                      <div
                        className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-surface-secondary)] dark:bg-[var(--bg-canvas)]"
                        aria-hidden="true"
                      >
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${row.pct}%`, backgroundColor: row.color }}
                        />
                      </div>
                    </div>
                  );
                })}
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
              aria-label="Group invite code"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              placeholder="Enter code (e.g. TRIP2026)"
              className="h-10 w-full rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-strong)] px-3.5 text-xs sm:text-sm font-mono uppercase text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--brand-primary)] focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={joining || !joinCodeInput.trim()}
              className="min-h-[44px] sm:min-h-[40px] w-full rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-xs font-semibold text-[var(--brand-ink)] transition-colors disabled:bg-[var(--bg-surface-secondary)] disabled:text-[var(--text-secondary)] disabled:border disabled:border-[var(--border-subtle)] flex items-center justify-center gap-1.5"
            >
              {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join Group"}
            </button>
            {joinError && <p className="text-[var(--status-negative)] text-xs">{joinError}</p>}
          </form>
        </div>
      </ScrollReveal>

      {/* Featured Tool: AI Travel & Trip Itinerary Planner Spotlight */}
      <ScrollReveal
        as="section"
        aria-label="Trip Planner Spotlight"
        className="rounded-2xl border border-[var(--border-subtle)] bg-[#29251F] dark:bg-[#24221D] text-[#F8F0E4] p-5 sm:p-6 shadow-[var(--shadow-card)] flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#51483D] bg-[#362E25] text-[#E28A63] mt-0.5">
            <Compass className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#F0BD70]">
                Flagship Travel Tool
              </span>
              <span className="text-[#8E8070]" aria-hidden="true">·</span>
              <span className="text-[11px] text-[#C8BBAA]">
                Rail, Bus, Flight &amp; Stay Caps
              </span>
            </div>
            <h2 className="font-display text-base sm:text-lg font-semibold text-[#F8F0E4]">
              Plan a multi-day group trip before splitting expenses
            </h2>
            <p className="text-xs sm:text-sm text-[#C8BBAA] leading-relaxed max-w-2xl">
              Generate day-wise transit legs and per-person INR budgets, edit schedules with the Travel Guide Copilot, and link saved itineraries directly to any SplitRupee group.
            </p>
          </div>
        </div>

        <Link
          href="/itinerary"
          className="inline-flex min-h-[44px] sm:min-h-[40px] shrink-0 items-center justify-center gap-2 rounded-xl bg-[#E28A63] hover:bg-[#F09A72] px-4 py-2 text-xs sm:text-sm font-semibold text-[#171613] transition-colors"
        >
          <span>Open Trip Planner</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </ScrollReveal>

      {/* Bottom Section: Recent Audit Log / Activity Feed */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[var(--status-info)]" aria-hidden="true" />
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
