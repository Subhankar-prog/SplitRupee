"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/lib/userContext";
import {
  type GroupDTO,
  type ExpenseDTO,
  type PaymentDTO,
  type ActivityLogDTO,
  CATEGORIES,
  type CategoryName,
} from "@/lib/types";
import { buildLedger } from "@/lib/debt";
import { buildWhatsAppSummary, buildGroupLedgerCSV } from "@/lib/export";
import { formatINR, formatPaise } from "@/lib/money";
import {
  Users,
  Plus,
  ArrowRight,
  CheckCircle2,
  Trash2,
  Edit3,
  Share2,
  Check,
  Plane,
  Home,
  Heart,
  Tag,
  Utensils,
  Zap,
  ShoppingBag,
  Film,
  Shapes,
  Receipt,
  Activity,
  UserPlus,
  Loader2,
  ChevronDown,
  ChevronUp,
  Download,
  Globe2,
  Scale,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import AddExpenseModal from "@/components/AddExpenseModal";
import DeleteExpenseModal from "@/components/DeleteExpenseModal";
import SettleUpModal from "@/components/SettleUpModal";
import AddMemberModal from "@/components/AddMemberModal";
import ActivityLogList from "@/components/ActivityLogList";

const CATEGORY_STYLE: Record<CategoryName, { icon: typeof Utensils; color: string; bg: string }> = {
  Food: { icon: Utensils, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  Rent: { icon: Home, color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20" },
  Travel: { icon: Plane, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  Utilities: { icon: Zap, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
  Shopping: { icon: ShoppingBag, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20" },
  Entertainment: { icon: Film, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
  Miscellaneous: { icon: Shapes, color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/20" },
};

const TYPE_ICONS = {
  TRIP: Plane,
  HOME: Home,
  COUPLE: Heart,
  OTHER: Tag,
};

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  const { currentUser } = useUser();

  const [group, setGroup] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"matrix" | "balances" | "expenses" | "settlements" | "activity" | "members">("matrix");
  const [categoryFilter, setCategoryFilter] = useState<CategoryName | "All">("All");
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [fxRateNPR, setFxRateNPR] = useState<number>(1.60);

  // Modals
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseDTO | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<ExpenseDTO | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [settleUpData, setSettleUpData] = useState<{
    payerId?: string;
    receiverId?: string;
    amount?: number;
  } | null>(null);

  const loadGroup = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/groups/${groupId}`);
      const data = await res.json();
      if (data.ok) {
        setGroup(data.group);
      } else {
        router.push("/dashboard");
      }
    } catch (e) {
      console.error("Failed to load group", e);
    } finally {
      setLoading(false);
    }
  }, [groupId, router]);

  useEffect(() => {
    loadGroup();
    const handleRefresh = () => loadGroup();
    window.addEventListener("splitrupee_refresh", handleRefresh);
    return () => window.removeEventListener("splitrupee_refresh", handleRefresh);
  }, [loadGroup]);

  // Debt & Ledger Calculation
  const members = group?.members ?? [];
  const expenses = group?.expenses ?? [];
  const payments = group?.payments ?? [];
  const activities = group?.activityLogs ?? [];

  const ledger = useMemo(() => {
    if (!group) return { balances: {}, transfers: [] };
    return buildLedger(
      expenses.map((e: any) => ({ paidById: e.paidById, splits: e.splits })),
      members.map((m: any) => m.id),
      payments.map((p: any) => ({ payerId: p.payerId, receiverId: p.receiverId, amount: p.amount }))
    );
  }, [group, expenses, members, payments]);

  const names = useMemo(() => Object.fromEntries(members.map((m: any) => [m.id, m.name])), [members]);
  const colors = useMemo(() => Object.fromEntries(members.map((m: any) => [m.id, m.avatarColor])), [members]);

  const myNet = currentUser ? ledger.balances[currentUser.id] ?? 0 : 0;
  const totalSpend = expenses.reduce((sum: number, e: any) => sum + e.totalAmount, 0);
  const totalReconciled = payments.reduce((sum: number, p: any) => sum + p.amount, 0);

  // Compute total paid and fair share per member
  const memberPaid = useMemo(() => {
    const paid: Record<string, number> = {};
    members.forEach((m: any) => (paid[m.id] = 0));
    expenses.forEach((e: any) => {
      paid[e.paidById] = (paid[e.paidById] || 0) + e.totalAmount;
    });
    return paid;
  }, [members, expenses]);

  const memberShare = useMemo(() => {
    const share: Record<string, number> = {};
    members.forEach((m: any) => (share[m.id] = 0));
    expenses.forEach((e: any) => {
      e.splits.forEach((s: any) => {
        share[s.userId] = (share[s.userId] || 0) + s.amount;
      });
    });
    return share;
  }, [members, expenses]);

  const summary = group
    ? buildWhatsAppSummary(group.name, names, ledger.balances, ledger.transfers)
    : "";

  async function handleShareWhatsApp() {
    await copyText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  function handleDownloadCSV() {
    if (!group) return;
    const csvContent = buildGroupLedgerCSV(
      group.name,
      members,
      expenses,
      payments,
      ledger.balances,
      ledger.transfers,
      fxRateNPR
    );
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${group.name.toLowerCase().replace(/\s+/g, "_")}_ledger.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const filteredExpenses = categoryFilter === "All"
    ? expenses
    : expenses.filter((e: any) => e.category === categoryFilter);

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          <p className="text-xs text-slate-400">Loading group details...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="grid min-h-[50vh] place-items-center text-center">
        <p className="text-sm text-slate-400">Group not found.</p>
      </div>
    );
  }

  const TypeIcon = TYPE_ICONS[group.type as keyof typeof TYPE_ICONS] || Tag;

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      {/* Group Header Card */}
      <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-4 sm:p-6 backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 sm:h-12 sm:w-12 shrink-0 place-items-center rounded-xl sm:rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
              <TypeIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight truncate">
                  {group.name}
                </h1>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                  {group.type}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {members.length} members · {expenses.length} expenses · <span className="font-semibold text-slate-200">{formatINR(totalSpend)}</span>
              </p>
            </div>
          </div>

          {/* Action Buttons — 2-column grid on mobile, flex row on sm+ */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:shrink-0">
            <button
              onClick={() => setShowAddExpense(true)}
              className="col-span-2 sm:col-auto flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 sm:py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 active:scale-95 transition"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Add Expense</span>
            </button>
            <button
              onClick={() => setSettleUpData({})}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 sm:py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Settle Up</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 sm:py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied!" : "WhatsApp"}</span>
            </button>
            <button
              onClick={handleDownloadCSV}
              className="hidden sm:flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
            >
              <Download className="h-3.5 w-3.5 text-sky-400" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 border-t border-white/10 pt-4 text-xs">
          <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-2.5 sm:p-3 space-y-1">
            <span className="text-[11px] text-slate-400 block">Total Spend</span>
            <span className="text-sm sm:text-base font-extrabold text-white block tabular-nums">
              {formatINR(totalSpend)}
            </span>
          </div>

          <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-2.5 sm:p-3 space-y-1">
            <span className="text-[11px] text-slate-400 block">Reconciled</span>
            <span className="text-sm sm:text-base font-extrabold text-emerald-400 block tabular-nums">
              {formatINR(totalReconciled)}
            </span>
          </div>

          <div className="rounded-xl sm:rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 sm:p-3 space-y-1">
            <span className="text-[11px] text-emerald-400 font-semibold block">Balance</span>
            <span className="text-xs font-bold text-white flex items-center gap-1">
              <Scale className="h-3.5 w-3.5 text-emerald-400" /> Balanced
            </span>
          </div>

          <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-2.5 sm:p-3 space-y-1">
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <Globe2 className="h-3 w-3 text-sky-400" /> FX (NPR)
            </div>
            <div className="flex items-baseline gap-1">
              <input
                type="number"
                step="0.01"
                min="0.1"
                value={fxRateNPR}
                onChange={(e) => setFxRateNPR(parseFloat(e.target.value) || 1.6)}
                className="w-14 rounded-lg bg-slate-900 px-1.5 py-0.5 text-xs font-bold text-white border border-white/15 outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-400">/INR</span>
            </div>
          </div>
        </div>

        {/* Current User Standing Banner */}
        {currentUser && (
          <div className="mt-3 sm:mt-4 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-white/5">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Your standing:</span>
              <span className="font-semibold text-white">{currentUser.name.split(" ")[0]}</span>
            </div>
            <p
              className={`text-xs sm:text-sm font-bold tabular-nums ${
                myNet > 0 ? "text-emerald-400" : myNet < 0 ? "text-rose-400" : "text-slate-400"
              }`}
            >
              {myNet > 0
                ? `Get back ${formatPaise(myNet)}`
                : myNet < 0
                ? `Owe ${formatPaise(-myNet)}`
                : "All settled up ✓"}
            </p>
          </div>
        )}
      </div>

      {/* Tabs Navigation — horizontal scroll on mobile */}
      <div className="flex rounded-2xl bg-white/5 p-1 border border-white/10 overflow-x-auto scrollbar-none gap-0.5">
        {[
          { key: "matrix", icon: Scale, label: "Ledger", fullLabel: "Traveler Ledger" },
          { key: "balances", icon: CheckCircle2, label: `Transfers (${ledger.transfers.length})`, fullLabel: `Optimized Transfers (${ledger.transfers.length})` },
          { key: "expenses", icon: Receipt, label: `Expenses (${expenses.length})`, fullLabel: `Expenses (${expenses.length})` },
          { key: "settlements", icon: DollarSign, label: `Settled (${payments.length})`, fullLabel: `Settlements (${payments.length})` },
          { key: "activity", icon: Activity, label: `Log (${activities.length})`, fullLabel: `Activity (${activities.length})` },
          { key: "members", icon: Users, label: `Members (${members.length})`, fullLabel: `Members (${members.length})` },
        ].map(({ key, icon: Icon, label, fullLabel }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`flex items-center gap-1.5 rounded-xl px-2.5 sm:px-4 py-2 text-xs font-semibold whitespace-nowrap transition ${
              activeTab === key
                ? "bg-emerald-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="sm:hidden">{label}</span>
            <span className="hidden sm:inline">{fullLabel}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: TRAVELER RECONCILIATION TABLE (MATCHING SPREADSHEET MODEL) */}
      {activeTab === "matrix" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-slate-900/90 overflow-hidden shadow-2xl">
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Traveler / Member Reconciliation Matrix</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete breakdown of total paid, fair share, net balances, and settlement actions.
                </p>
              </div>
              <button
                onClick={handleDownloadCSV}
                className="hidden sm:flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
              >
                <Download className="h-3.5 w-3.5 text-emerald-400" />
                <span>Export to CSV / Excel</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03] text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    <th className="p-3.5 pl-5">Traveler / Member</th>
                    <th className="p-3.5">Total Paid (INR)</th>
                    <th className="p-3.5">Fair Share (INR)</th>
                    <th className="p-3.5">Net Balance (INR)</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 pr-5 text-right">Settlement Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {members.map((m: any) => {
                    const paid = memberPaid[m.id] || 0;
                    const share = memberShare[m.id] || 0;
                    const netPaise = ledger.balances[m.id] || 0;
                    const netINR = netPaise / 100;
                    const isCreditor = netINR > 0;
                    const isDebtor = netINR < 0;

                    return (
                      <tr key={m.id} className="hover:bg-white/[0.02] transition">
                        <td className="p-3.5 pl-5 font-semibold text-white flex items-center gap-2.5">
                          <span
                            className="h-6 w-6 rounded-lg grid place-items-center font-bold text-slate-950 text-[10px] shrink-0"
                            style={{ background: m.avatarColor || "#10b981" }}
                          >
                            {m.name.charAt(0)}
                          </span>
                          <span className="truncate max-w-[140px]">{m.name}</span>
                          {currentUser?.id === m.id && (
                            <span className="rounded bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 text-[9px] font-bold">
                              You
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 tabular-nums font-semibold text-white">
                          {formatINR(paid)}
                        </td>
                        <td className="p-3.5 tabular-nums text-slate-300">
                          {formatINR(share)}
                        </td>
                        <td className="p-3.5 tabular-nums font-bold">
                          <span
                            className={
                              isCreditor
                                ? "text-emerald-400"
                                : isDebtor
                                ? "text-rose-400"
                                : "text-slate-400"
                            }
                          >
                            {isCreditor ? `+${formatINR(netINR)}` : formatINR(netINR)}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                              isCreditor
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : isDebtor
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                : "bg-white/5 text-slate-400 border-white/10"
                            }`}
                          >
                            {isCreditor
                              ? "Gets Back"
                              : isDebtor
                              ? "Owes Group"
                              : "Settled / All Square"}
                          </span>
                        </td>
                        <td className="p-3.5 pr-5 text-right">
                          {isDebtor ? (
                            <button
                              onClick={() => setSettleUpData({ payerId: m.id, amount: Math.abs(netPaise) })}
                              className="rounded-xl bg-emerald-500 px-3 py-1.5 text-[11px] font-bold text-slate-950 hover:bg-emerald-400 transition"
                            >
                              Settle Up
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-medium">All Square</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/10 bg-white/[0.04] font-bold text-white text-xs">
                    <td className="p-3.5 pl-5">Total Group Pool</td>
                    <td className="p-3.5 tabular-nums text-emerald-400">{formatINR(totalSpend)}</td>
                    <td className="p-3.5 tabular-nums text-emerald-400">{formatINR(totalSpend)}</td>
                    <td className="p-3.5 tabular-nums text-slate-300">₹ 0.00</td>
                    <td className="p-3.5 text-emerald-400">Net Balanced</td>
                    <td className="p-3.5 pr-5 text-right text-[11px] text-slate-400">Variance: ₹ 0.00</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OPTIMIZED TRANSFERS */}
      {activeTab === "balances" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Optimized Minimal Cash-Flow Transfers (Graph Minimization)
            </h3>
            <span className="text-xs text-slate-400">
              {ledger.transfers.length} transfer{ledger.transfers.length === 1 ? "" : "s"} needed to balance entire group
            </span>
          </div>

          {ledger.transfers.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400 mb-2" />
              <p className="text-sm font-semibold text-white">Everyone is settled up!</p>
              <p className="text-xs text-slate-400 mt-1">
                No pending debts remaining in this group.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ledger.transfers.map((t: any, idx: number) => (
                <div
                  key={`${t.from}-${t.to}-${idx}`}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl hover:border-emerald-500/30 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-left">
                      <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                        Debtor (Pays)
                      </span>
                      <p className="text-xs font-bold text-white truncate max-w-[100px]">
                        {names[t.from]}
                      </p>
                    </div>

                    <div className="flex flex-col items-center px-1">
                      <ArrowRight className="h-4 w-4 text-emerald-400" />
                      <span className="text-[9px] text-slate-500 uppercase">UPI / Cash</span>
                    </div>

                    <div className="text-left">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                        Creditor (Receives)
                      </span>
                      <p className="text-xs font-bold text-white truncate max-w-[100px]">
                        {names[t.to]}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-extrabold text-emerald-400 tabular-nums">
                      {formatPaise(t.amountPaise)}
                    </span>
                    <button
                      onClick={() =>
                        setSettleUpData({
                          payerId: t.from,
                          receiverId: t.to,
                          amount: t.amountPaise,
                        })
                      }
                      className="rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
                    >
                      1-Tap Settle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CIRCUIT EXPENSES LIST & MATRIX */}
      {activeTab === "expenses" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {(["All", ...CATEGORIES] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    categoryFilter === cat
                      ? "border-emerald-500 bg-emerald-500/15 text-emerald-300"
                      : "border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAddExpense(true)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Add Expense</span>
            </button>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center">
              <Receipt className="mx-auto h-8 w-8 text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-white">No expenses recorded yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Click "+ Add Expense" to record travel tickets, meals, or rent.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredExpenses.map((exp: any) => {
                const isExpanded = expandedExpenseId === exp.id;
                const style = CATEGORY_STYLE[exp.category as CategoryName] || CATEGORY_STYLE.Miscellaneous;
                const Icon = style.icon;

                const mySplit = exp.splits.find((s: any) => s.userId === currentUser?.id);
                const isPayer = exp.paidById === currentUser?.id;
                let userImpact = "not involved";
                let userImpactAmount = 0;
                if (isPayer) {
                  userImpactAmount = exp.totalAmount - (mySplit?.amount ?? 0);
                  userImpact = `you lent ${formatINR(userImpactAmount)}`;
                } else if (mySplit) {
                  userImpactAmount = mySplit.amount;
                  userImpact = `you borrowed ${formatINR(userImpactAmount)}`;
                }

                return (
                  <div
                    key={exp.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden hover:border-white/20 transition"
                  >
                    <div
                      onClick={() => setExpandedExpenseId(isExpanded ? null : exp.id)}
                      className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${style.bg} ${style.color}`}>
                          <Icon className="h-5 w-5" />
                        </span>

                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-white truncate">
                            {exp.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            <span className="font-semibold text-slate-300">{exp.paidBy.name}</span> paid{" "}
                            <span className="font-semibold text-white">{formatINR(exp.totalAmount)}</span> ·{" "}
                            {new Date(exp.date || exp.createdAt).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <p
                            className={`text-xs font-bold tabular-nums ${
                              isPayer
                                ? "text-emerald-400"
                                : mySplit
                                ? "text-rose-400"
                                : "text-slate-500"
                            }`}
                          >
                            {userImpact}
                          </p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                            {exp.splitType}
                          </p>
                        </div>
                        <button className="text-slate-500 hover:text-slate-300">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-white/5 bg-white/[0.02] p-4 space-y-3 text-xs animate-in fade-in duration-150">
                        {exp.notes && (
                          <p className="text-slate-300 bg-white/5 p-2.5 rounded-xl text-xs italic">
                            "{exp.notes}"
                          </p>
                        )}

                        <div>
                          <p className="font-semibold text-slate-400 mb-2">Split Breakdown & Participation:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {exp.splits.map((s: any) => (
                              <div
                                key={s.id}
                                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-2"
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{ background: s.user.avatarColor || "#10b981" }}
                                  />
                                  <span className="font-medium text-slate-200">{s.user.name}</span>
                                </div>
                                <span className="font-semibold text-white tabular-nums">
                                  {formatINR(s.amount)}
                                  {s.percentage !== null && (
                                    <span className="text-[10px] text-slate-400 ml-1">
                                      ({s.percentage.toFixed(0)}%)
                                    </span>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                          <button
                            onClick={() => setEditingExpense(exp)}
                            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>Edit Expense</span>
                          </button>
                          <button
                            onClick={() => setDeletingExpense(exp)}
                            className="flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: DIRECT SETTLEMENTS LEDGER */}
      {activeTab === "settlements" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              Direct Person-to-Person Settlements Log (UPI / Cash)
            </h3>
            <span className="text-xs text-emerald-400 font-semibold">
              Total Reconciled: {formatINR(totalReconciled)}
            </span>
          </div>

          {payments.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-white">No direct settlements recorded yet</p>
              <p className="text-xs text-slate-400 mt-1">
                When members settle up via Google Pay or Cash, recorded payments will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {payments.map((p: any) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Check className="h-4 w-4 stroke-[3]" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-white">
                        <span className="text-emerald-400">{names[p.payerId]}</span> paid{" "}
                        <span className="text-white">{names[p.receiverId]}</span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {p.notes || "Direct UPI Settle"} · {new Date(p.createdAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-400 tabular-nums">
                    {formatINR(p.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: ACTIVITY LOG */}
      {activeTab === "activity" && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
          <ActivityLogList activities={activities} />
        </div>
      )}

      {/* TAB 6: MEMBERS & INVITES */}
      {activeTab === "members" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Group Members ({members.length})</h3>
            <button
              onClick={() => setShowAddMember(true)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Add / Invite Friends</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {members.map((m: any) => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 backdrop-blur-xl"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-slate-950 text-sm shadow"
                  style={{ background: m.avatarColor || "#10b981" }}
                >
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{m.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{m.email || m.phone || "Member"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddExpense && (
        <AddExpenseModal
          group={group}
          onClose={() => setShowAddExpense(false)}
          onSaved={() => {
            setShowAddExpense(false);
            loadGroup();
          }}
        />
      )}

      {editingExpense && (
        <AddExpenseModal
          group={group}
          initialExpense={editingExpense}
          onClose={() => setEditingExpense(null)}
          onSaved={() => {
            setEditingExpense(null);
            loadGroup();
          }}
        />
      )}

      {deletingExpense && (
        <DeleteExpenseModal
          expense={deletingExpense}
          onClose={() => setDeletingExpense(null)}
          onDeleted={() => {
            setDeletingExpense(null);
            loadGroup();
          }}
        />
      )}

      {settleUpData && (
        <SettleUpModal
          groupId={groupId}
          members={members}
          defaultPayerId={settleUpData.payerId}
          defaultReceiverId={settleUpData.receiverId}
          defaultAmount={settleUpData.amount ? settleUpData.amount / 100 : undefined}
          onClose={() => setSettleUpData(null)}
          onSettled={() => {
            setSettleUpData(null);
            loadGroup();
          }}
        />
      )}

      {showAddMember && (
        <AddMemberModal
          groupId={groupId}
          groupName={group.name}
          inviteCode={group.inviteCode}
          existingMembers={members}
          onClose={() => setShowAddMember(false)}
          onAdded={() => {
            setShowAddMember(false);
            loadGroup();
          }}
        />
      )}
    </div>
  );
}
