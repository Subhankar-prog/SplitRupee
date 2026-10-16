"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useUser } from "@/lib/userContext";
import {
  type GroupDTO,
  type ExpenseDTO,
  type PaymentDTO,
  type ActivityLogDTO,
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
} from "@/lib/offlineSync";

const TYPE_ICONS = {
  TRIP: Plane,
  HOME: Home,
  COUPLE: Heart,
  OTHER: Tag,
};

export default function DashboardPage() {
  const { currentUser, users, isLoading: usersLoading } = useUser();
  const [groups, setGroups] = useState<GroupDTO[]>(() => getCachedGroupsList());
  const [expenses, setExpenses] = useState<ExpenseDTO[]>(() => getCachedAllExpenses());
  const [activities, setActivities] = useState<ActivityLogDTO[]>([]);
  const [groupDetails, setGroupDetails] = useState<Record<string, any>>(() => {
    if (typeof window !== "undefined") {
      const list = getCachedGroupsList();
      const map: Record<string, any> = {};
      list.forEach((g: any) => {
        const detail = getCachedGroup(g.id);
        if (detail) map[g.id] = detail;
      });
      return map;
    }
    return {};
  });
  const [initialLoaded, setInitialLoaded] = useState(() => getCachedGroupsList().length > 0);

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
      } else {
        setJoinError(data.error || "Invalid invite code");
      }
    } catch {
      setJoinError("Network error. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  const loadDashboardData = useCallback(async () => {
    if (!currentUser) return;
    try {
      // 1. Fetch groups
      const gRes = await fetch(`/api/groups?userId=${encodeURIComponent(currentUser.id)}&_t=${Date.now()}`);
      const gData = await gRes.json();
      const userGroups: GroupDTO[] = gData.ok ? gData.groups : [];
      if (userGroups.length > 0) {
        setGroups(userGroups);
        saveCachedGroupsList(userGroups);
      }

      // 2. Fetch full details for each group to compute overall balances
      const detailsMap: Record<string, any> = {};
      await Promise.all(
        userGroups.map(async (g) => {
          try {
            const detailRes = await fetch(`/api/groups/${g.id}?_t=${Date.now()}`);
            const detailData = await detailRes.json();
            if (detailData.ok && detailData.group) {
              detailsMap[g.id] = detailData.group;
              saveCachedGroup(g.id, detailData.group);
            }
          } catch {}
        })
      );
      if (Object.keys(detailsMap).length > 0) {
        setGroupDetails(detailsMap);
      }

      // 3. Fetch all expenses for user
      const eRes = await fetch(`/api/expenses?userId=${encodeURIComponent(currentUser.id)}&_t=${Date.now()}`);
      const eData = await eRes.json();
      if (eData.ok && Array.isArray(eData.expenses)) {
        setExpenses(eData.expenses);
        saveCachedAllExpenses(eData.expenses);
      }

      // 4. Fetch recent activities
      const aRes = await fetch(`/api/activity?userId=${encodeURIComponent(currentUser.id)}&limit=10&_t=${Date.now()}`);
      const aData = await aRes.json();
      if (aData.ok) setActivities(aData.activities);
    } catch (e) {
      console.warn("Failed to load live dashboard data (offline fallback active):", e);
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
      const cachedExp = getCachedAllExpenses();
      if (cachedExp.length > 0) setExpenses(cachedExp);
    } finally {
      setInitialLoaded(true);
    }
  }, [currentUser?.id]);

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
    return () => window.removeEventListener("splitrupee_refresh", handleRefresh as EventListener);
  }, [loadDashboardData]);

  // Overall Balances Calculation across all groups
  const overallStats = useMemo(() => {
    if (!currentUser) return { net: 0, youOwe: 0, youAreOwed: 0, groupBalances: {}, friendsBalances: {} };

    let totalNet = 0;
    let totalOwe = 0;
    let totalOwed = 0;
    const groupBalances: Record<string, number> = {};
    const friendsBalances: Record<string, { user: any; net: number; groupId: string; groupName: string }> = {};

    Object.entries(groupDetails).forEach(([groupId, g]) => {
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

    return { net: totalNet, youOwe: totalOwe, youAreOwed: totalOwed, groupBalances, friendsBalances };
  }, [currentUser, groupDetails]);

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
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 max-w-md">
          <Wallet className="mx-auto h-12 w-12 text-emerald-400 mb-3" />
          <h2 className="text-xl font-bold text-white">Welcome to SplitRupee</h2>
          <p className="text-xs text-slate-400 mt-2">
            Please select an active user or register to access your groups and expenses.
          </p>
          <div className="mt-4 flex gap-3 justify-center">
            <Link
              href="/login"
              className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      {/* Top Welcome & Summary Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Hi, {currentUser.name.split(" ")[0]} 👋
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Your overall financial standing across all groups
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/itinerary"
            className="flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition shadow-sm"
          >
            <Plane className="h-3.5 w-3.5 text-cyan-400" />
            <span>Itinerary</span>
          </Link>
          <button
            onClick={() => setShowCreateGroup(true)}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Group</span>
          </button>
          <button
            onClick={() => setShowAddExpense(true)}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 active:scale-95 transition"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Splitwise Total Balance Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Total Net Balance */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Net Balance</span>
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/5 text-slate-400">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <p
            className={`mt-3 text-2xl font-extrabold tracking-tight tabular-nums ${
              overallStats.net > 0
                ? "text-emerald-400"
                : overallStats.net < 0
                ? "text-rose-400"
                : "text-slate-300"
            }`}
          >
            {overallStats.net > 0
              ? `+ ${formatPaise(overallStats.net)}`
              : overallStats.net < 0
              ? `- ${formatPaise(Math.abs(overallStats.net))}`
              : "₹0.00"}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            {overallStats.net > 0
              ? "You are owed money overall"
              : overallStats.net < 0
              ? "You owe money overall"
              : "You are all settled up!"}
          </p>
        </div>

        {/* You Owe */}
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/[0.04] p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-300/80">You Owe</span>
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-rose-500/10 text-rose-400">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-extrabold tracking-tight text-rose-400 tabular-nums">
            {formatPaise(overallStats.youOwe)}
          </p>
          <p className="mt-1 text-[11px] text-rose-300/60">
            Debts across all your groups
          </p>
        </div>

        {/* You are Owed */}
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-300/80">You are Owed</span>
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <ArrowDownLeft className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-extrabold tracking-tight text-emerald-400 tabular-nums">
            {formatPaise(overallStats.youAreOwed)}
          </p>
          <p className="mt-1 text-[11px] text-emerald-300/60">
            Receivables to collect
          </p>
        </div>
      </div>

      {/* Main Grid: Groups & Friends Standings */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Groups List (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Join Group with Invite Code Bar */}
          <div className="rounded-2xl bg-slate-900/40 p-3 sm:p-4 border border-white/5 backdrop-blur-md">
            <form onSubmit={handleJoinGroup} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex items-center gap-2 text-slate-300 text-xs sm:text-sm font-medium shrink-0">
                <UserPlus className="h-4 w-4 text-emerald-400" />
                <span>Have an Invite Code?</span>
              </div>
              <div className="flex-1 w-full flex items-center gap-2">
                <input
                  type="text"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="Enter 8-digit invite code (e.g. TRIP2026)"
                  className="w-full rounded-xl bg-slate-950 border border-white/10 px-3.5 py-2 text-xs sm:text-sm font-mono uppercase text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={joining || !joinCodeInput.trim()}
                  className="rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 px-4 py-2 text-xs sm:text-sm font-semibold text-emerald-400 transition disabled:opacity-50 shrink-0"
                >
                  {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join"}
                </button>
              </div>
            </form>
            {joinError && <p className="text-rose-400 text-xs mt-2 pl-1">{joinError}</p>}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Your Groups</h2>
            </div>
            <button
              onClick={() => setShowCreateGroup(true)}
              className="text-xs font-semibold text-emerald-400 hover:underline"
            >
              + New Group
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                  className="group rounded-3xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl hover:border-emerald-500/40 hover:bg-white/[0.06] transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/5 text-slate-200 group-hover:scale-105 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 transition">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition truncate max-w-[160px]">
                            {g.name}
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            {g.members.length} members
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition" />
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs border-t border-white/5 pt-3">
                      <span className="text-slate-400">Total spent</span>
                      <span className="font-semibold text-slate-200 tabular-nums">
                        {formatINR(totalSpent)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 rounded-2xl bg-white/5 p-2.5 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">Your standing</span>
                    <span
                      className={`font-bold tabular-nums ${
                        net > 0
                          ? "text-emerald-400"
                          : net < 0
                          ? "text-rose-400"
                          : "text-slate-400"
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
              <div className="col-span-2 rounded-3xl border border-dashed border-white/10 p-8 text-center">
                <Users className="mx-auto h-8 w-8 text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-white">No groups yet</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Create your first group to start splitting bills and tracking expenses with friends.
                </p>
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                >
                  <Plus className="h-4 w-4" /> Create Group
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Direct Friends Balances & Settlements */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Friends Balances</h2>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl space-y-3">
            {Object.keys(overallStats.friendsBalances).length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                You're completely settled up with all friends across all groups!
              </p>
            ) : (
              <div className="space-y-2.5">
                {Object.values(overallStats.friendsBalances).map(({ user, net, groupId }) => {
                  const isOwed = net > 0;
                  const groupObj = groupDetails[groupId];
                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-bold text-slate-950 text-xs shadow"
                          style={{ background: user.avatarColor || "#10b981" }}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{user.name}</p>
                          <p
                            className={`text-[11px] font-semibold tabular-nums ${
                              isOwed ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {isOwed ? `owes you ${formatPaise(net)}` : `you owe ${formatPaise(-net)}`}
                          </p>
                        </div>
                      </div>

                      <button
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
                        className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition"
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
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Recent Activity & Audit Trail</h2>
          </div>
          <Link
            href="/activity"
            className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
          >
            View Full Log <ChevronRight className="h-3 w-3" />
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
