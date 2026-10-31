"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
import { buildLedger, type Transfer } from "@/lib/debt";
import { buildWhatsAppSummary, buildGroupLedgerCSV } from "@/lib/export";
import { exportGroupLedgerPDF } from "@/lib/pdfExport";
import { formatINR, formatPaise } from "@/lib/money";
import { getCurrency, formatCurrencyAmount } from "@/lib/currencies";
import {
  Users,
  Plus,
  ArrowRight,
  CheckCircle2,
  Trash2,
  Edit3,
  Share2,
  Check,
  Copy,
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
  FileText,
  Globe2,
  Scale,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  Crown,
  Settings,
  LogOut,
  WifiOff,
  MessageCircle,
  Repeat,
} from "lucide-react";
import AddExpenseModal from "@/components/AddExpenseModal";
import DeleteExpenseModal from "@/components/DeleteExpenseModal";
import SettleUpModal from "@/components/SettleUpModal";
import AddMemberModal from "@/components/AddMemberModal";
import ActivityLogList from "@/components/ActivityLogList";
import SplitRupeeLoader from "@/components/SplitRupeeLoader";
import ManageGroupModal from "@/components/ManageGroupModal";
import ExitGroupModal from "@/components/ExitGroupModal";
import WhatsAppReminderModal from "@/components/WhatsAppReminderModal";
import RecurringExpensesModal from "@/components/RecurringExpensesModal";
import { getCachedGroup, saveCachedGroup } from "@/lib/offlineSync";

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

export default function GroupDetailPage({ params: routeParams }: { params?: { id?: string } }) {
  const hookParams = useParams();
  const router = useRouter();
  const rawId = routeParams?.id || hookParams?.id;
  const pathId = typeof window !== "undefined" ? window.location.pathname.split("/groups/")[1]?.split("/")[0]?.split("?")[0] : "";
  const unresolvedId = (Array.isArray(rawId) ? rawId[0] : rawId) || pathId || "";
  const groupId = unresolvedId ? decodeURIComponent(unresolvedId).trim() : "";
  const { currentUser } = useUser();

  const [group, setGroup] = useState<any | null>(() => {
    if (typeof window !== "undefined" && groupId && groupId !== "undefined") {
      return getCachedGroup(groupId);
    }
    return null;
  });
  const [activeTab, setActiveTab] = useState<"passbook" | "matrix" | "balances" | "expenses" | "settlements" | "activity" | "members">("matrix");
  const [categoryFilter, setCategoryFilter] = useState<CategoryName | "All">("All");
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== "undefined" && groupId && groupId !== "undefined") {
      const cached = getCachedGroup(groupId);
      return !cached || !cached.expenses || cached.expenses.length === 0;
    }
    return true;
  });
  const [copied, setCopied] = useState(false);
  const [copiedInviteCode, setCopiedInviteCode] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  // Modals
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseDTO | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<ExpenseDTO | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showManageGroup, setShowManageGroup] = useState(false);
  const [showExitGroup, setShowExitGroup] = useState(false);
  const [settleUpData, setSettleUpData] = useState<{
    payerId?: string;
    receiverId?: string;
    amount?: number;
  } | null>(null);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [whatsAppReminderData, setWhatsAppReminderData] = useState<{
    debtorName: string;
    debtorPhone?: string | null;
    creditorName: string;
    creditorUpiId?: string | null;
    amount: number;
  } | null>(null);

  const groupRef = useRef(group);
  groupRef.current = group;

  // Group Admin Resolution
  const isAdmin = useMemo(() => {
    if (!currentUser || !group) return false;
    const currentMember = group.members?.find((m: any) => m.id === currentUser.id);
    return (
      currentMember?.role === "ADMIN" ||
      currentUser.id === group.creatorId ||
      (group.members?.length > 0 && group.members[0].id === currentUser.id && !group.members.some((m: any) => m.role === "ADMIN"))
    );
  }, [currentUser, group]);

  const loadGroup = useCallback(async (isInitial = false) => {
    if (!groupId || groupId === "undefined") {
      return;
    }
    const cached = getCachedGroup(groupId);
    if (isInitial && cached) {
      setGroup(cached);
      if (cached.expenses && cached.expenses.length > 0) {
        setLoading(false);
      }
    } else if (isInitial && !groupRef.current) {
      setLoading(true);
    }

    try {
      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 20000) : null;
      const res = await fetch(`/api/groups/${encodeURIComponent(groupId)}?_t=${Date.now()}`, {
        signal: controller?.signal,
      });
      if (timeoutId) clearTimeout(timeoutId);
      const data = await res.json();
      if (data.ok && data.group) {
        setGroup(data.group);
        saveCachedGroup(groupId, data.group);
        if (data.group.id && data.group.id !== groupId) {
          saveCachedGroup(data.group.id, data.group);
        }
      } else if (!groupRef.current) {
        const fallback = getCachedGroup(groupId);
        if (fallback) {
          setGroup(fallback);
        }
      }
    } catch (e) {
      console.warn("Failed to load group (offline mode active):", e);
      if (!groupRef.current) {
        const fallback = getCachedGroup(groupId);
        if (fallback) {
          setGroup(fallback);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [groupId, router]);

  useEffect(() => {
    if (groupId && groupId !== "undefined") {
      loadGroup(true);
      fetch(`/api/groups/${encodeURIComponent(groupId)}/recurring`).catch(() => {});
    }
    const handleRefresh = () => loadGroup(false);
    window.addEventListener("splitrupee_refresh", handleRefresh);
    window.addEventListener("splitrupee_offline_queue_changed", handleRefresh);
    return () => {
      window.removeEventListener("splitrupee_refresh", handleRefresh);
      window.removeEventListener("splitrupee_offline_queue_changed", handleRefresh);
    };
  }, [groupId, loadGroup]);

  // If user is not admin and activeTab is passbook, automatically redirect to matrix
  useEffect(() => {
    if (!loading && !isAdmin && activeTab === "passbook") {
      setActiveTab("matrix");
    }
  }, [loading, isAdmin, activeTab]);

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

  // Cumulative settlements paid and received per member (for Passbook)
  const memberSettlementsPaid = useMemo(() => {
    const map: Record<string, number> = {};
    members.forEach((m: any) => (map[m.id] = 0));
    payments.forEach((p: any) => {
      map[p.payerId] = (map[p.payerId] || 0) + p.amount;
    });
    return map;
  }, [members, payments]);

  const memberSettlementsReceived = useMemo(() => {
    const map: Record<string, number> = {};
    members.forEach((m: any) => (map[m.id] = 0));
    payments.forEach((p: any) => {
      map[p.receiverId] = (map[p.receiverId] || 0) + p.amount;
    });
    return map;
  }, [members, payments]);

  const totalPendingSettlements = useMemo(() => {
    return ledger.transfers.reduce((sum: number, t: any) => sum + t.amountPaise / 100, 0);
  }, [ledger.transfers]);

  const summary = group
    ? buildWhatsAppSummary(group.name, names, ledger.balances, ledger.transfers)
    : "";

  async function handleShareWhatsApp() {
    await copyText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  function handleDownloadPDF() {
    if (!group) return;
    exportGroupLedgerPDF(
      group,
      members,
      expenses,
      payments,
      ledger.balances,
      ledger.transfers
    );
  }

  function handleDownloadCSV() {
    if (!group) return;
    const csvContent = buildGroupLedgerCSV(
      group.name,
      members,
      expenses,
      payments,
      ledger.balances,
      ledger.transfers
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

  if (loading && !group) {
    return (
      <SplitRupeeLoader
        fullScreen={false}
        text="Loading Group Details"
        subtext="Calculating balances, passbook and debts..."
      />
    );
  }

  if (!group) {
    return (
      <div className="grid min-h-[50vh] place-items-center text-center p-4">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-8 max-w-md backdrop-blur-xl space-y-4">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 grid place-items-center">
            <WifiOff className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Group Data Unavailable</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Could not load group details right now. Please retry or return to your dashboard.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setLoading(true);
                loadGroup(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
            >
              Retry
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const TypeIcon = TYPE_ICONS[group.type as keyof typeof TYPE_ICONS] || Tag;

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      {/* Group Header Card */}
      <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-4 sm:p-6 backdrop-blur-xl max-w-full overflow-hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3 min-w-0 max-w-full flex-1">
            <span className="grid h-10 w-10 sm:h-12 sm:w-12 shrink-0 place-items-center rounded-xl sm:rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/10 mt-0.5">
              <TypeIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight break-all">
                  {group.name}
                </h1>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                  {group.type}
                </span>

                {/* 1-Click Copy Group Invite Code Pill */}
                <button
                  type="button"
                  onClick={async () => {
                    const code = group.inviteCode || group.id.slice(0, 8);
                    await copyText(code);
                    setCopiedInviteCode(true);
                    setTimeout(() => setCopiedInviteCode(false), 2000);
                  }}
                  className="rounded-full border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-mono text-emerald-300 flex items-center gap-1.5 transition active:scale-95 shadow-sm shrink-0 cursor-pointer"
                  title={`Group Invite Code: ${group.inviteCode || group.id.slice(0, 8)} (Click to copy)`}
                >
                  <span className="text-slate-400 font-sans font-medium text-[9px] uppercase tracking-wider">Code:</span>
                  <span className="font-bold text-emerald-400">{group.inviteCode || group.id.slice(0, 8)}</span>
                  {copiedInviteCode ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3 text-emerald-400/70" />
                  )}
                </button>

                {isAdmin && (
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300 shrink-0 flex items-center gap-1">
                    <Crown className="h-3 w-3 text-amber-400" /> Admin
                  </span>
                )}
                {typeof navigator !== "undefined" && !navigator.onLine && (
                  <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-300 shrink-0 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
                    Offline (Cached)
                  </span>
                )}
              </div>

              {group.description ? (
                <div className="mt-1.5 max-w-full">
                  <p className="text-xs text-slate-300/90 italic border-l-2 border-emerald-500/40 pl-2.5 break-words break-all whitespace-pre-wrap leading-relaxed">
                    "{group.description.length > 90 && !descExpanded
                      ? `${group.description.slice(0, 90)}...`
                      : group.description}"
                    {group.description.length > 90 && (
                      <button
                        type="button"
                        onClick={() => setDescExpanded(!descExpanded)}
                        className="ml-2 font-semibold text-emerald-400 hover:text-emerald-300 hover:underline not-italic inline-flex items-center gap-0.5 cursor-pointer"
                      >
                        {descExpanded ? "Show less" : "View more"}
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setShowManageGroup(true)}
                        className="ml-2 font-normal text-slate-400 hover:text-emerald-300 not-italic inline-flex items-center gap-1 cursor-pointer"
                        title="Edit description"
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                    )}
                  </p>
                </div>
              ) : isAdmin ? (
                <div className="mt-1.5">
                  <button
                    type="button"
                    onClick={() => setShowManageGroup(true)}
                    className="text-[11px] text-emerald-400/90 hover:text-emerald-300 flex items-center gap-1 hover:underline cursor-pointer font-medium"
                  >
                    <span>+ Add group description</span>
                  </button>
                </div>
              ) : null}

              <p className="text-xs text-slate-400 mt-1">
                {members.length} members · {expenses.length} expenses · <span className="font-semibold text-slate-200">{formatINR(totalSpend)}</span>
              </p>
            </div>
          </div>

          {/* Quick Add Expense & Add Member on larger screens */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowAddMember(true)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 active:scale-95 transition"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Member</span>
            </button>
            <button
              onClick={() => setShowAddExpense(true)}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 active:scale-95 transition"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {/* Action Buttons Toolbar: flex-wrap so buttons NEVER overflow the card or screen */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 pt-3 mt-3 border-t border-white/5 w-full">
          {/* Mobile Add Member & Add Expense Buttons */}
          <button
            onClick={() => setShowAddMember(true)}
            className="sm:hidden flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 active:scale-95 transition"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Member</span>
          </button>
          <button
            onClick={() => setShowAddExpense(true)}
            className="sm:hidden flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 active:scale-95 transition"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Add Expense</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab("passbook")}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition"
            >
              <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
              <span>Passbook</span>
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setShowManageGroup(true)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition"
            >
              <Settings className="h-3.5 w-3.5 text-amber-400" />
              <span>Manage</span>
            </button>
          )}
          <button
            onClick={() => setShowExitGroup(true)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
          >
            <LogOut className="h-3.5 w-3.5 text-rose-400" />
            <span>Exit</span>
          </button>
          <button
            onClick={() => setSettleUpData({})}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Settle Up</span>
          </button>
          {currentUser?.isPro && (
            <button
              onClick={() => setShowRecurringModal(true)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition"
              title="Automated Recurring Expenses (Rent, Maid, Cook, Wi-Fi)"
            >
              <Repeat className="h-3.5 w-3.5 text-purple-400" />
              <span>Recurring</span>
              <span className="rounded bg-purple-500/30 px-1 py-0.2 text-[9px] font-extrabold text-purple-200 uppercase tracking-wider">PRO</span>
            </button>
          )}
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
            <span>{copied ? "Copied!" : "WhatsApp"}</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
            title="Download Theme-Based Financial Statement PDF"
          >
            <FileText className="h-3.5 w-3.5 text-emerald-400" />
            <span>PDF</span>
          </button>
          <button
            onClick={handleDownloadCSV}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
            title="Download Standard Excel / CSV Ledger"
          >
            <Download className="h-3.5 w-3.5 text-sky-400" />
            <span>Excel/CSV</span>
          </button>
        </div>

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 border-t border-white/10 pt-4 text-xs">
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

      {/* Responsive Segmented Tabs Navigation — Grid on mobile, wrap on desktop */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:flex md:flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
        {[
          ...(isAdmin
            ? [{ key: "passbook", icon: BookOpen, label: "Passbook", fullLabel: "Admin Passbook" }]
            : []),
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
            className={`flex items-center justify-center gap-1.5 rounded-xl px-2 sm:px-4 py-2 text-xs font-semibold transition ${
              activeTab === key
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold"
                : "bg-white/[0.02] text-slate-400 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="sm:hidden truncate">{label}</span>
            <span className="hidden sm:inline whitespace-nowrap">{fullLabel}</span>
          </button>
        ))}
      </div>

      {/* TAB 0: ADMIN PASSBOOK & MASTER FINANCIAL RECONCILIATION */}
      {isAdmin && activeTab === "passbook" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-slate-900/90 overflow-hidden shadow-2xl p-4 sm:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-emerald-400" />
                    Admin Passbook & Master Financial Reconciliation
                  </h3>
                  <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5">
                    Live Ledger
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Aggregated member contribution totals, live debt status, and bilateral settlement matrix.
                </p>
              </div>
              <button
                onClick={handleDownloadCSV}
                className="self-start sm:self-auto flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
              >
                <Download className="h-3.5 w-3.5 text-emerald-400" />
                <span>Export Passbook</span>
              </button>
            </div>

            {/* Top 4 Summary Metrics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 sm:p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Group Spend</p>
                <p className="mt-1 text-lg sm:text-xl font-extrabold text-white tabular-nums">{formatINR(totalSpend)}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">{expenses.length} total expenses recorded</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 sm:p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">Total Settled Volume</p>
                <p className="mt-1 text-lg sm:text-xl font-extrabold text-emerald-400 tabular-nums">{formatINR(totalReconciled)}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">{payments.length} payments completed</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 sm:p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">Pending Obligations</p>
                <p className="mt-1 text-lg sm:text-xl font-extrabold text-amber-400 tabular-nums">{formatINR(totalPendingSettlements)}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">{ledger.transfers.length} transfers needed</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 sm:p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">Ledger Health</p>
                <p className="mt-1 text-lg sm:text-xl font-extrabold text-indigo-300">Balanced</p>
                <p className="mt-0.5 text-[10px] text-slate-400">Zero variance in pool</p>
              </div>
            </div>

            {/* Cumulative Member Contributions Table ("Kabir paid how much till now") */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Cumulative Member Contribution Ledger
              </h4>
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/50">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.03] text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                      <th className="p-3 pl-4 align-middle">Member</th>
                      <th className="p-3 align-middle">Total Paid In All (₹)</th>
                      <th className="p-3 align-middle">Fair Share (₹)</th>
                      <th className="p-3 align-middle">Settlements Paid (₹)</th>
                      <th className="p-3 align-middle">Settlements Received (₹)</th>
                      <th className="p-3 align-middle">Net Balance (₹)</th>
                      <th className="p-3 pr-4 align-middle text-right">Status / Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {members.map((m: any) => {
                      const paid = memberPaid[m.id] || 0;
                      const share = memberShare[m.id] || 0;
                      const setPaid = memberSettlementsPaid[m.id] || 0;
                      const setRecv = memberSettlementsReceived[m.id] || 0;
                      const netPaise = ledger.balances[m.id] || 0;
                      const netINR = netPaise / 100;
                      const isCreditor = netINR > 0;
                      const isDebtor = netINR < 0;
                      const isCreator = group?.creatorId === m.id;

                      return (
                        <tr key={m.id} className="hover:bg-white/[0.02] transition">
                          <td className="p-3 pl-4 align-middle font-semibold text-white whitespace-nowrap">
                            <div className="flex items-center gap-2 min-w-max">
                              <span
                                className="h-6 w-6 rounded-lg grid place-items-center font-bold text-slate-950 text-[10px] shrink-0"
                                style={{ background: m.avatarColor || "#10b981" }}
                              >
                                {m.name.charAt(0)}
                              </span>
                              <span className="truncate max-w-[130px]">{m.name}</span>
                              {currentUser?.id === m.id && (
                                <span className="rounded bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 text-[9px] font-bold">
                                  You
                                </span>
                              )}
                              {isCreator && (
                                <span className="rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-bold">
                                  Admin
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 align-middle font-bold text-white tabular-nums">
                            {formatINR(paid)}
                          </td>
                          <td className="p-3 align-middle tabular-nums text-slate-300">
                            {formatINR(share)}
                          </td>
                          <td className="p-3 align-middle tabular-nums text-slate-300">
                            {formatINR(setPaid)}
                          </td>
                          <td className="p-3 align-middle tabular-nums text-slate-300">
                            {formatINR(setRecv)}
                          </td>
                          <td className="p-3 align-middle tabular-nums font-bold">
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
                          <td className="p-3 pr-4 align-middle text-right">
                            {isDebtor ? (
                              <button
                                onClick={() => {
                                  const transfer = ledger.transfers.find((t) => t.from === m.id);
                                  const targetReceiver = transfer
                                    ? transfer.to
                                    : members.find((other: any) => other.id !== m.id && (ledger.balances[other.id] || 0) > 0)?.id;
                                  const transferAmount = transfer ? transfer.amountPaise / 100 : Math.abs(netINR);
                                  setSettleUpData({
                                    payerId: m.id,
                                    receiverId: targetReceiver,
                                    amount: transferAmount,
                                  });
                                }}
                                className="rounded-xl bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-slate-950 hover:bg-emerald-400 transition"
                              >
                                Settle Up
                              </button>
                            ) : isCreditor ? (
                              <span className="text-[11px] font-semibold text-emerald-400">
                                Receiving
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-500 font-medium">All Square</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Live Bilateral Obligations */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Live Bilateral Transfer Obligations (Updated with Every Payment)
              </h4>
              {ledger.transfers.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center text-xs text-slate-400">
                  <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-400 mb-1.5" />
                  <p className="font-bold text-white">Everyone is 100% settled up!</p>
                  <p className="text-[11px] mt-0.5">All pending debts have been reconciled and cleared.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ledger.transfers.map((t, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-white/[0.02]"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          {names[t.from]} owes {names[t.to]}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                          Settlement Pending
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-sm font-extrabold text-emerald-400 tabular-nums">
                          {formatPaise(t.amountPaise)}
                        </span>
                        <button
                          onClick={() =>
                            setSettleUpData({
                              payerId: t.from,
                              receiverId: t.to,
                              amount: t.amountPaise / 100,
                            })
                          }
                          className="rounded-xl bg-emerald-500 px-2.5 py-1 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
                        >
                          1-Tap Settle
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Settlements Feed */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Completed Settlement Records ({payments.length})
              </h4>
              {payments.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No settlement payments recorded yet in this group.</p>
              ) : (
                <div className="space-y-2">
                  {payments.map((p: any) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-2xl border border-white/5 bg-white/[0.02] text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <div>
                          <p className="font-semibold text-white">
                            {p.payer?.name} paid {p.receiver?.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {new Date(p.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {p.notes ? ` · "${p.notes}"` : ""}
                          </p>
                        </div>
                      </div>
                      <span className="font-extrabold text-emerald-400 tabular-nums">
                        {formatINR(p.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                    <th className="p-3.5 pl-5 align-middle">Traveler / Member</th>
                    <th className="p-3.5 align-middle">Total Paid (INR)</th>
                    <th className="p-3.5 align-middle">Fair Share (INR)</th>
                    <th className="p-3.5 align-middle">Net Balance (INR)</th>
                    <th className="p-3.5 align-middle">Status</th>
                    <th className="p-3.5 pr-5 align-middle text-right">Settlement Action</th>
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
                        <td className="p-3.5 pl-5 align-middle font-semibold text-white whitespace-nowrap">
                          <div className="flex items-center gap-2.5 min-w-max">
                            <span
                              className="h-6 w-6 rounded-lg grid place-items-center font-bold text-slate-950 text-[10px] shrink-0"
                              style={{ background: m.avatarColor || "#10b981" }}
                            >
                              {m.name.charAt(0)}
                            </span>
                            <span className="truncate max-w-[140px]">{m.name}</span>
                            {currentUser?.id === m.id && (
                              <span className="rounded bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 text-[9px] font-bold">
                                You
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 align-middle tabular-nums font-semibold text-white">
                          {formatINR(paid)}
                        </td>
                        <td className="p-3.5 align-middle tabular-nums text-slate-300">
                          {formatINR(share)}
                        </td>
                        <td className="p-3.5 align-middle tabular-nums font-bold">
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
                        <td className="p-3.5 align-middle">
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
                        <td className="p-3.5 pr-5 align-middle text-right">
                          {isDebtor ? (
                            <div className="flex items-center justify-end gap-1.5">
                              {currentUser?.isPro && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const transfer = ledger.transfers.find((t) => t.from === m.id);
                                    const targetReceiverId = transfer
                                      ? transfer.to
                                      : members.find((other: any) => other.id !== m.id && (ledger.balances[other.id] || 0) > 0)?.id;
                                    const targetReceiver = members.find((other: any) => other.id === targetReceiverId);
                                    setWhatsAppReminderData({
                                      debtorName: m.name,
                                      debtorPhone: m.phone,
                                      creditorName: targetReceiver?.name || "Creditor",
                                      creditorUpiId: targetReceiver?.upiId,
                                      amount: transfer ? transfer.amountPaise / 100 : Math.abs(netINR),
                                    });
                                  }}
                                  className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2 py-1.5 text-[11px] font-semibold text-emerald-400 hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition flex items-center gap-1"
                                  title="Send WhatsApp payment reminder"
                                >
                                  <MessageCircle className="h-3 w-3" />
                                  <span className="hidden sm:inline">Remind</span>
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  const transfer = ledger.transfers.find((t) => t.from === m.id);
                                  const targetReceiver = transfer
                                    ? transfer.to
                                    : members.find((other: any) => other.id !== m.id && (ledger.balances[other.id] || 0) > 0)?.id;
                                  const transferAmount = transfer ? transfer.amountPaise / 100 : Math.abs(netINR);
                                  setSettleUpData({
                                    payerId: m.id,
                                    receiverId: targetReceiver,
                                    amount: transferAmount,
                                  });
                                }}
                                className="rounded-xl bg-emerald-500 px-3 py-1.5 text-[11px] font-bold text-slate-950 hover:bg-emerald-400 transition"
                              >
                                Settle Up
                              </button>
                            </div>
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

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-extrabold text-emerald-400 tabular-nums">
                      {formatPaise(t.amountPaise)}
                    </span>
                    {currentUser?.isPro && (
                      <button
                        type="button"
                        onClick={() =>
                          setWhatsAppReminderData({
                            debtorName: names[t.from] || "Friend",
                            debtorPhone: members.find((m: any) => m.id === t.from)?.phone,
                            creditorName: names[t.to] || "Creditor",
                            creditorUpiId: members.find((m: any) => m.id === t.to)?.upiId,
                            amount: t.amountPaise / 100,
                          })
                        }
                        className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition flex items-center gap-1"
                        title="Send WhatsApp payment reminder"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </button>
                    )}
                    <button
                      onClick={() =>
                        setSettleUpData({
                          payerId: t.from,
                          receiverId: t.to,
                          amount: t.amountPaise / 100,
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

            <div className="flex items-center gap-2">
              {currentUser?.isPro && (
                <button
                  onClick={() => setShowRecurringModal(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition"
                  title="Automated Recurring Expenses"
                >
                  <Repeat className="h-3.5 w-3.5 text-purple-400" />
                  <span className="hidden sm:inline">Recurring Rules</span>
                  <span className="sm:hidden">Recurring</span>
                </button>
              )}
              <button
                onClick={() => setShowAddExpense(true)}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
              >
                <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>Add Expense</span>
              </button>
            </div>
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
                          <p className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-1">
                            <span className="font-semibold text-slate-300">{exp.paidBy.name}</span> paid{" "}
                            <span className="font-semibold text-white">{formatINR(exp.totalAmount)}</span>
                            {exp.currency && exp.currency !== "INR" && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 text-[10px] font-bold text-amber-300">
                                <span>{getCurrency(exp.currency).flag}</span>
                                <span>
                                  {exp.originalAmount
                                    ? formatCurrencyAmount(exp.originalAmount, exp.currency)
                                    : exp.currency}
                                </span>
                              </span>
                            )}
                            <span className="text-slate-500">·</span>
                            <span>
                              {new Date(exp.date || exp.createdAt).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
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
                        {exp.currency && exp.currency !== "INR" && (
                          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-300 font-medium">
                            <div className="flex items-center gap-1.5">
                              <span className="text-base">{getCurrency(exp.currency).flag}</span>
                              <span>Foreign Expense: <strong>{exp.originalAmount ? formatCurrencyAmount(exp.originalAmount, exp.currency) : exp.currency}</strong></span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              1 {exp.currency} = ₹{exp.exchangeRate?.toFixed(4) || "—"} INR · Group balance: {formatINR(exp.totalAmount)}
                            </span>
                          </div>
                        )}

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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-white">Group Members ({members.length})</h3>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  onClick={() => setShowManageGroup(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span>Manage Roles</span>
                </button>
              )}
              <button
                onClick={() => setShowAddMember(true)}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Add / Invite Friends</span>
              </button>
            </div>
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
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-white truncate">{m.name}</p>
                    {m.role === "ADMIN" && (
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5 shrink-0">
                        <Crown className="h-2.5 w-2.5 text-amber-400" /> Admin
                      </span>
                    )}
                  </div>
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
          groupCreatorId={group?.creatorId}
          transfers={ledger.transfers}
          balances={ledger.balances}
          defaultPayerId={settleUpData.payerId}
          defaultReceiverId={settleUpData.receiverId}
          defaultAmount={settleUpData.amount}
          onClose={() => setSettleUpData(null)}
          onSettled={() => {
            setSettleUpData(null);
            loadGroup();
          }}
        />
      )}

      {showAddMember && (
        <AddMemberModal
          groupId={group?.id || groupId}
          groupName={group?.name || ""}
          inviteCode={group?.inviteCode}
          existingMembers={members}
          onClose={() => setShowAddMember(false)}
          onAdded={(newMember) => {
            setShowAddMember(false);
            if (newMember) {
              setGroup((prev: any) => {
                if (!prev) return prev;
                const prevMembers = prev.members || [];
                const alreadyExists = prevMembers.some((m: any) => m.id === newMember.id);
                if (alreadyExists) return prev;
                const formattedMember = {
                  id: newMember.id,
                  name: newMember.name,
                  email: newMember.email || null,
                  phone: newMember.phone || null,
                  avatarColor: newMember.avatarColor || "#10b981",
                  upiId: newMember.upiId || null,
                  role: "MEMBER" as const,
                };
                const updatedGroup = {
                  ...prev,
                  members: [...prevMembers, formattedMember],
                };
                saveCachedGroup(prev.id || groupId, updatedGroup);
                return updatedGroup;
              });
            }
            loadGroup(false);
          }}
        />
      )}

      {showManageGroup && group && currentUser && (
        <ManageGroupModal
          isOpen={showManageGroup}
          onClose={() => setShowManageGroup(false)}
          group={group}
          currentUser={currentUser}
          members={members}
          balances={ledger.balances}
          onGroupUpdated={(updatedGroup) => {
            if (updatedGroup) {
              setGroup((prev: any) => ({
                ...prev,
                name: updatedGroup.name,
                description: updatedGroup.description,
                type: updatedGroup.type,
                currency: updatedGroup.currency,
              }));
              if (group?.id) {
                saveCachedGroup(group.id, {
                  ...group,
                  name: updatedGroup.name,
                  description: updatedGroup.description,
                  type: updatedGroup.type,
                  currency: updatedGroup.currency,
                });
              }
            }
            loadGroup();
          }}
          onGroupDeleted={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("splitrupee_refresh", { detail: { groupId: group.id } }));
            }
            router.push("/dashboard");
          }}
          onExitedGroup={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("splitrupee_refresh", { detail: { groupId: group.id } }));
            }
            router.push("/dashboard");
          }}
        />
      )}

      {showExitGroup && group && currentUser && (
        <ExitGroupModal
          isOpen={showExitGroup}
          onClose={() => setShowExitGroup(false)}
          groupId={group.id}
          groupName={group.name}
          currentUserId={currentUser.id}
          isAdmin={isAdmin}
          memberCount={members.length}
          userBalance={myNet}
          onExited={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("splitrupee_refresh", { detail: { groupId: group.id } }));
            }
            router.push("/dashboard");
          }}
        />
      )}

      {whatsAppReminderData && currentUser?.isPro && (
        <WhatsAppReminderModal
          isOpen={!!whatsAppReminderData}
          onClose={() => setWhatsAppReminderData(null)}
          debtorName={whatsAppReminderData.debtorName}
          debtorPhone={whatsAppReminderData.debtorPhone}
          creditorName={whatsAppReminderData.creditorName}
          creditorUpiId={whatsAppReminderData.creditorUpiId}
          amount={whatsAppReminderData.amount}
          groupName={group?.name || "Group"}
        />
      )}

      {showRecurringModal && group && currentUser?.isPro && (
        <RecurringExpensesModal
          isOpen={showRecurringModal}
          onClose={() => setShowRecurringModal(false)}
          groupId={group.id}
          groupName={group.name}
          members={members}
          onExpenseCreated={() => loadGroup(false)}
        />
      )}
    </div>
  );
}
