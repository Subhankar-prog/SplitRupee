"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
import { DEFAULT_AVATAR_COLOR, getAvatarTextColor } from "@/lib/avatarColors";
import UserAvatar from "@/components/ui/UserAvatar";
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
  Train,
  Hotel,
  Ticket,
  ShieldAlert,
  ShieldCheck,
  FileCheck,
  MapPin,
  Calendar,
  ExternalLink,
  Phone,
  Navigation,
  Sparkles,
  RefreshCw,
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
import DataStatusBanner from "@/components/ui/DataStatusBanner";
import { getCachedGroup, saveCachedGroup } from "@/lib/offlineSync";
import { parseApiJsonResponse, type FetchIssueState } from "@/lib/apiResponse";

const CATEGORY_STYLE: Record<CategoryName, { icon: typeof Utensils; color: string; bg: string }> = {
  Food: { icon: Utensils, color: "text-[var(--status-warning)]", bg: "bg-[var(--status-warning-bg)] border-[var(--status-warning-border)]" },
  Rent: { icon: Home, color: "text-[var(--brand-dark)] dark:text-[var(--brand-primary)]", bg: "bg-[var(--brand-tint-bg)] border-[var(--brand-tint-border)]" },
  Travel: { icon: Plane, color: "text-[var(--status-positive)]", bg: "bg-[var(--status-positive-bg)] border-[var(--status-positive-border)]" },
  Utilities: { icon: Zap, color: "text-[var(--status-warning)]", bg: "bg-[var(--status-warning-bg)] border-[var(--status-warning-border)]" },
  Shopping: { icon: ShoppingBag, color: "text-[var(--text-primary)]", bg: "bg-[var(--bg-surface-secondary)] border-[var(--border-subtle)]" },
  Entertainment: { icon: Film, color: "text-[var(--status-negative)]", bg: "bg-[var(--status-negative-bg)] border-[var(--status-negative-border)]" },
  Miscellaneous: { icon: Shapes, color: "text-[var(--text-secondary)]", bg: "bg-[var(--bg-surface-secondary)] border-[var(--border-subtle)]" },
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

  const [group, setGroup] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"passbook" | "matrix" | "balances" | "expenses" | "settlements" | "activity" | "members" | "itinerary">("matrix");
  const [categoryFilter, setCategoryFilter] = useState<CategoryName | "All">("All");
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [fetchIssue, setFetchIssue] = useState<FetchIssueState | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedInviteCode, setCopiedInviteCode] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setShowExportMenu(false);
    }
    if (showExportMenu) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showExportMenu]);

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
      setLoading(false);
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
      const outcome = await parseApiJsonResponse<{ ok?: boolean; group?: any }>(
        res,
        "Could not load group details right now."
      );
      if (outcome.kind === "ok" && outcome.data.group) {
        saveCachedGroup(groupId, outcome.data.group);
        if (outcome.data.group.id && outcome.data.group.id !== groupId) {
          saveCachedGroup(outcome.data.group.id, outcome.data.group);
        }
        setGroup(getCachedGroup(groupId) || outcome.data.group);
        setFetchIssue(null);
      } else {
        const fallback = getCachedGroup(groupId);
        if (fallback) {
          setGroup(fallback);
        }
        setFetchIssue(
          outcome.kind === "offline"
            ? { kind: "offline", message: outcome.message }
            : { kind: "error", message: outcome.kind === "error" ? outcome.message : "Could not load group details right now." }
        );
      }
    } catch {
      const fallback = getCachedGroup(groupId);
      if (fallback) {
        setGroup(fallback);
      }
      const offlineNow = typeof navigator !== "undefined" && !navigator.onLine;
      setFetchIssue({
        kind: offlineNow ? "offline" : "error",
        message: offlineNow
          ? "You are currently offline. Showing cached group data if available."
          : "Network error while loading group details.",
      });
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  }, [groupId]);

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
  const expenses = useMemo(
    () => (group?.expenses ?? []).filter((e: any) => !e?.isDeleted),
    [group?.expenses]
  );
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

  function openMemberSettleUp(memberId: string, absNetINR: number) {
    const transfer = ledger.transfers.find((t: any) => t.from === memberId);
    const targetReceiver = transfer
      ? transfer.to
      : members.find((other: any) => other.id !== memberId && (ledger.balances[other.id] || 0) > 0)?.id;
    const transferAmount = transfer ? transfer.amountPaise / 100 : absNetINR;
    setSettleUpData({
      payerId: memberId,
      receiverId: targetReceiver,
      amount: transferAmount,
    });
  }

  function openMemberWhatsAppReminder(member: any, absNetINR: number) {
    const transfer = ledger.transfers.find((t: any) => t.from === member.id);
    const targetReceiverId = transfer
      ? transfer.to
      : members.find((other: any) => other.id !== member.id && (ledger.balances[other.id] || 0) > 0)?.id;
    const targetReceiver = members.find((other: any) => other.id === targetReceiverId);
    setWhatsAppReminderData({
      debtorName: member.name,
      debtorPhone: member.phone,
      creditorName: targetReceiver?.name || "Creditor",
      creditorUpiId: targetReceiver?.upiId,
      amount: transfer ? transfer.amountPaise / 100 : absNetINR,
    });
  }

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
      group,
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
        variant="page"
        text="Loading Group"
        subtext="Updating your balances and group ledger..."
      />
    );
  }

  const handleRetryGroup = () => {
    setIsRetrying(true);
    loadGroup(false);
  };

  if (!group) {
    return (
      <div className="grid min-h-[50vh] place-items-center text-center p-4">
        <div role="alert" className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 max-w-md shadow-[var(--shadow-card)] space-y-4">
          <div className="mx-auto h-11 w-11 rounded-xl bg-[var(--status-warning-bg)] border border-[var(--status-warning-border)] text-[var(--status-warning)] grid place-items-center">
            <WifiOff className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">Group Data Unavailable</h2>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {fetchIssue?.message || "Could not load group details right now. Please retry or return to your dashboard."}
          </p>
          <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={isRetrying}
                onClick={() => {
                  setLoading(true);
                  handleRetryGroup();
                }}
                className="inline-flex min-h-[44px] sm:min-h-[38px] items-center gap-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-4 text-xs font-semibold text-[var(--brand-ink)] transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin" : ""}`} aria-hidden="true" />
                <span>{isRetrying ? "Retrying..." : "Retry"}</span>
              </button>
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="inline-flex min-h-[44px] sm:min-h-[38px] items-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] px-4 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
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
    <div className="space-y-5">
      {fetchIssue && (
        <DataStatusBanner
          issue={fetchIssue}
          onRetry={handleRetryGroup}
          isRetrying={isRetrying}
          cachedLabel="Showing cached group ledger until live sync restores."
        />
      )}
      {/* Group Header Card */}
      <div className="relative z-20 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-6 shadow-[var(--shadow-card)] max-w-full overflow-visible">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3 min-w-0 max-w-full flex-1">
            <span className="grid h-10 w-10 sm:h-11 sm:w-11 shrink-0 place-items-center rounded-xl bg-[var(--status-positive-bg)] text-[var(--brand-dark)] dark:text-[var(--brand-primary)] border border-[var(--status-positive-border)] mt-0.5">
              <TypeIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-lg sm:text-2xl font-semibold text-[var(--text-primary)] tracking-tight break-words">
                  {group.name}
                </h1>
                <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider shrink-0">
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
                  className="rounded-full border border-[var(--status-positive-border)] bg-[var(--status-positive-bg)] hover:opacity-90 px-2.5 py-0.5 text-[11px] font-mono text-[var(--status-positive)] flex items-center gap-1.5 transition-opacity shrink-0 cursor-pointer"
                  title={`Group Invite Code: ${group.inviteCode || group.id.slice(0, 8)} (Click to copy)`}
                >
                  <span className="text-[var(--text-secondary)] font-sans font-medium text-[9px] uppercase tracking-wider">Code:</span>
                  <span className="font-semibold">{group.inviteCode || group.id.slice(0, 8)}</span>
                  {copiedInviteCode ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3 opacity-75" />
                  )}
                </button>

                {isAdmin && (
                  <span className="rounded-full border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--status-warning)] shrink-0 flex items-center gap-1">
                    <Crown className="h-3 w-3" /> Admin
                  </span>
                )}
                {typeof navigator !== "undefined" && !navigator.onLine && (
                  <span className="rounded-full border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--status-warning)] shrink-0 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-warning)]" />
                    Offline (Cached)
                  </span>
                )}
              </div>

              {group.description ? (
                <div className="mt-1.5 max-w-full">
                  <p className="text-xs text-[var(--text-secondary)] border-l-2 border-[var(--brand-primary)] pl-2.5 break-words whitespace-pre-wrap leading-relaxed">
                    &ldquo;{group.description.length > 90 && !descExpanded
                      ? `${group.description.slice(0, 90)}...`
                      : group.description}&rdquo;
                    {group.description.length > 90 && (
                      <button
                        type="button"
                        onClick={() => setDescExpanded(!descExpanded)}
                        className="ml-2 font-semibold text-[var(--brand-dark)] dark:text-[var(--brand-primary)] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                      >
                        {descExpanded ? "Show less" : "View more"}
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setShowManageGroup(true)}
                        className="ml-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] inline-flex items-center gap-1 cursor-pointer"
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
                    className="text-[11px] text-[var(--brand-dark)] dark:text-[var(--brand-primary)] flex items-center gap-1 hover:underline cursor-pointer font-medium"
                  >
                    <span>+ Add group description</span>
                  </button>
                </div>
              ) : null}

              <p className="text-xs text-[var(--text-secondary)] mt-1.5">
                {members.length} members · {expenses.length} expenses · <span className="font-semibold text-[var(--text-primary)] tabular-nums">{formatINR(totalSpend)}</span>
              </p>
            </div>
          </div>

          {/* Quick Add Expense & Add Member on larger screens */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowAddMember(true)}
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] px-3.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
            >
              <UserPlus className="h-4 w-4 text-[var(--brand-primary)]" />
              <span>Add Member</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddExpense(true)}
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-4 text-xs font-semibold text-[var(--brand-ink)] transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 pt-3.5 mt-3.5 border-t border-[var(--border-subtle)] w-full">
          {/* Mobile Add Member & Add Expense Buttons */}
          <button
            type="button"
            onClick={() => setShowAddMember(true)}
            className="lg:hidden flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] px-3 text-xs font-semibold text-[var(--text-primary)]"
          >
            <UserPlus className="h-3.5 w-3.5 text-[var(--brand-primary)] shrink-0" />
            <span>Add Member</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddExpense(true)}
            className="lg:hidden flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-3 text-xs font-semibold text-[var(--brand-ink)] transition-colors"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" />
            <span>Add Expense</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab("passbook")}
              className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] px-3 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
            >
              <BookOpen className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
              <span>Passbook</span>
            </button>
          )}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowManageGroup(true)}
              className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] px-3 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
            >
              <Settings className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
              <span>Manage</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowExitGroup(true)}
            className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[var(--status-negative-border)] bg-[var(--status-negative-bg)] px-3 text-xs font-medium text-[var(--status-negative)] hover:opacity-90 transition-opacity"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Exit</span>
          </button>
          <button
            type="button"
            onClick={() => setSettleUpData({})}
            className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[var(--status-positive-border)] bg-[var(--status-positive-bg)] px-3 text-xs font-semibold text-[var(--status-positive)] hover:opacity-90 transition-opacity"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Settle Up</span>
          </button>
          {currentUser?.isPro && (
            <button
              type="button"
              onClick={() => setShowRecurringModal(true)}
              className="flex h-9 items-center justify-center gap-1 sm:gap-1.5 rounded-xl border border-[var(--accent-gold-border)] bg-[var(--accent-gold-bg)] px-2 sm:px-3 text-xs font-medium text-[var(--accent-gold-ink)] hover:opacity-90 transition-opacity"
              title="Automated Recurring Expenses (Rent, Maid, Cook, Wi-Fi)"
            >
              <Repeat className="h-3.5 w-3.5 shrink-0" />
              <span>Recurring</span>
              <span className="rounded bg-[var(--accent-gold)] px-1 py-0.5 text-[9px] font-semibold text-[#171613] uppercase tracking-wider shrink-0">PRO</span>
            </button>
          )}
          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setShowExportMenu((prev) => !prev)}
              className="w-full sm:w-auto flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] transition-colors cursor-pointer"
              aria-expanded={showExportMenu}
              aria-haspopup="menu"
              title="Export financial statement or share summary"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-[var(--status-positive)]" />
              ) : (
                <Download className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
              )}
              <span>{copied ? "Copied!" : "Export"}</span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-[var(--text-secondary)] transition-transform duration-150 ${
                  showExportMenu ? "rotate-180" : ""
                }`}
              />
            </button>

            {showExportMenu && (
              <div
                role="menu"
                className="absolute right-0 sm:left-0 mt-2 w-56 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-popover)] p-1.5 z-50 space-y-1"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    handleShareWhatsApp();
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] transition-colors cursor-pointer"
                >
                  <Share2 className="h-3.5 w-3.5 text-[var(--status-positive)] shrink-0" />
                  <div>
                    <div>WhatsApp</div>
                    <div className="text-[10px] font-normal text-[var(--text-secondary)]">
                      Copy balances &amp; transfer summary
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    handleDownloadPDF();
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] transition-colors cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5 text-[var(--status-negative)] shrink-0" />
                  <div>
                    <div>PDF Statement</div>
                    <div className="text-[10px] font-normal text-[var(--text-secondary)]">
                      Print-ready 4-section ledger
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    handleDownloadCSV();
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] transition-colors cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 text-[var(--brand-primary)] shrink-0" />
                  <div>
                    <div>Excel / CSV</div>
                    <div className="text-[10px] font-normal text-[var(--text-secondary)]">
                      Matching spreadsheet ledger
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Consolidated Standing & Group Totals Strip */}
        <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] divide-y sm:divide-y-0 sm:divide-x divide-[var(--border-subtle)] grid grid-cols-1 sm:grid-cols-4 text-xs">
          {currentUser && (
            <div className="p-3 sm:col-span-1 flex sm:flex-col items-center sm:items-start justify-between gap-1">
              <span className="text-[11px] text-[var(--text-secondary)]">Your Standing</span>
              <span
                className={`font-display text-sm font-semibold tabular-nums ${
                  myNet > 0 ? "text-[var(--status-positive)]" : myNet < 0 ? "text-[var(--status-negative)]" : "text-[var(--text-secondary)]"
                }`}
              >
                {myNet > 0
                  ? `Get back ${formatPaise(myNet)}`
                  : myNet < 0
                  ? `Owe ${formatPaise(-myNet)}`
                  : "All settled up"}
              </span>
            </div>
          )}

          <div className="p-3 flex sm:flex-col items-center sm:items-start justify-between gap-1">
            <span className="text-[11px] text-[var(--text-secondary)]">Total Spend</span>
            <span className="font-display text-sm font-semibold text-[var(--text-primary)] tabular-nums">
              {formatINR(totalSpend)}
            </span>
          </div>

          <div className="p-3 flex sm:flex-col items-center sm:items-start justify-between gap-1">
            <span className="text-[11px] text-[var(--text-secondary)]">Reconciled</span>
            <span className="font-display text-sm font-semibold text-[var(--status-positive)] tabular-nums">
              {formatINR(totalReconciled)}
            </span>
          </div>

          <div className={`p-3 flex sm:flex-col items-center sm:items-start justify-between gap-1 ${!currentUser ? "sm:col-span-2" : ""}`}>
            <span className="text-[11px] text-[var(--text-secondary)]">Pending Transfers</span>
            <span
              className={`font-display text-sm font-semibold tabular-nums ${
                ledger.transfers.length > 0 ? "text-[var(--status-warning)]" : "text-[var(--status-positive)]"
              }`}
            >
              {ledger.transfers.length > 0 ? `${ledger.transfers.length} pending` : "Settled"}
            </span>
          </div>
        </div>
      </div>

      {/* Compact Linked Itinerary Strip (Full Breakdown Lives Inside Itinerary Tab) */}
      {group?.itineraries && group.itineraries.length > 0 && (
        <div className="rounded-xl border border-[var(--status-positive-border)] bg-[var(--bg-surface)] px-4 py-3 shadow-[var(--shadow-card)] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-[var(--status-positive-bg)] border border-[var(--status-positive-border)] text-[var(--status-positive)] shrink-0">
              <Plane className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-sm font-semibold text-[var(--text-primary)] break-words line-clamp-2 leading-snug">
                  {group.itineraries[0].title || `Trip: ${group.itineraries[0].origin} -> ${group.itineraries[0].destination}`}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--status-positive-bg)] text-[var(--status-positive)] border border-[var(--status-positive-border)] shrink-0">
                  Linked Itinerary
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 tabular-nums break-words leading-relaxed">
                {group.itineraries[0].origin} &rarr; {group.itineraries[0].destination} · {group.itineraries[0].days}D / {Math.max(1, group.itineraries[0].days - 1)}N · {group.itineraries[0].groupSize || group.members.length} travellers · Budget ₹{Number(group.itineraries[0].totalBudget || 120000).toLocaleString()} (~₹{Math.round(Number(group.itineraries[0].totalBudget || 120000) / (group.itineraries[0].groupSize || group.members.length || 1)).toLocaleString()}/p)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("itinerary")}
              className={`min-h-[44px] sm:min-h-[36px] flex items-center gap-1.5 px-3.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === "itinerary"
                  ? "bg-[var(--brand-primary)] text-[var(--brand-ink)]"
                  : "bg-[var(--status-positive-bg)] text-[var(--status-positive)] border border-[var(--status-positive-border)] hover:opacity-90"
              }`}
            >
              <Plane className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{activeTab === "itinerary" ? "Viewing Itinerary" : "View Itinerary"}</span>
            </button>

            <Link
              href={`/itinerary?id=${group.itineraries[0].id}`}
              className="min-h-[44px] sm:min-h-[36px] flex items-center gap-1.5 bg-[var(--bg-surface-secondary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-[var(--text-primary)] px-3 rounded-xl text-xs font-medium transition-colors"
              title="Open full itinerary studio to view routes, maps, and export PDF"
            >
              <span>Open Studio</span>
              <ExternalLink className="h-3.5 w-3.5 text-[var(--brand-primary)]" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}

      {/* Responsive Segmented Tabs Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:flex md:flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)]">
        {[
          ...(isAdmin
            ? [{ key: "passbook", icon: BookOpen, label: "Passbook", fullLabel: "Admin Passbook" }]
            : []),
          ...(group?.itineraries && group.itineraries.length > 0
            ? [{ key: "itinerary", icon: Plane, label: `Itinerary (${group.itineraries.length})`, fullLabel: `Trip Itinerary (${group.itineraries.length})` }]
            : []),
          { key: "matrix", icon: Scale, label: "Ledger", fullLabel: "Traveler Ledger" },
          { key: "balances", icon: CheckCircle2, label: `Transfers (${ledger.transfers.length})`, fullLabel: `Optimized Transfers (${ledger.transfers.length})` },
          { key: "expenses", icon: Receipt, label: `Expenses (${expenses.length})`, fullLabel: `Expenses (${expenses.length})` },
          { key: "settlements", icon: DollarSign, label: `Settled (${payments.length})`, fullLabel: `Settlements (${payments.length})` },
          { key: "activity", icon: Activity, label: `Log (${activities.length})`, fullLabel: `Activity (${activities.length})` },
          { key: "members", icon: Users, label: `Members (${members.length})`, fullLabel: `Members (${members.length})` },
        ].map(({ key, icon: Icon, label, fullLabel }) => (
          <button
            type="button"
            key={key}
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`min-h-[44px] sm:min-h-[38px] flex items-center justify-center gap-1.5 rounded-xl px-2.5 sm:px-3.5 py-2 text-xs font-medium sr-interactive-transition sr-button-press ${
              activeTab === key
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)] font-semibold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Icon className={`h-3.5 w-3.5 shrink-0 ${activeTab === key ? "text-[var(--brand-primary)]" : ""}`} />
            <span className="sm:hidden truncate">{label}</span>
            <span className="hidden sm:inline whitespace-nowrap">{fullLabel}</span>
          </button>
        ))}
      </div>

      {/* TAB 0: ADMIN PASSBOOK & MASTER FINANCIAL RECONCILIATION */}
      {isAdmin && activeTab === "passbook" && (
        <div className="sr-tab-panel space-y-6">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden shadow-[var(--shadow-card)] p-4 sm:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base sm:text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-[var(--brand-primary)]" />
                    Group Ledger &amp; Balance Summary
                  </h3>
                  <span className="rounded-full bg-[var(--status-positive-bg)] text-[var(--status-positive)] border border-[var(--status-positive-border)] text-[10px] font-semibold px-2 py-0.5">
                    Live Ledger
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Summary of total group spend, individual contributions, and balances to settle.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadCSV}
                className="self-start sm:self-auto flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] px-3 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                <Download className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                <span>Export Passbook</span>
              </button>
            </div>

            {/* Consolidated Passbook Summary Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] divide-y sm:divide-y-0 sm:divide-x divide-[var(--border-subtle)]">
              <div className="p-3.5 sm:p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Total Group Spend</p>
                <p className="font-display mt-1 text-lg sm:text-xl font-semibold text-[var(--text-primary)] tabular-nums">{formatINR(totalSpend)}</p>
                <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">{expenses.length} recorded {expenses.length === 1 ? "expense" : "expenses"}</p>
              </div>
              <div className="p-3.5 sm:p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--status-positive)]">Settled Volume</p>
                <p className="font-display mt-1 text-lg sm:text-xl font-semibold text-[var(--status-positive)] tabular-nums">{formatINR(totalReconciled)}</p>
                <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">{payments.length} completed {payments.length === 1 ? "payment" : "payments"}</p>
              </div>
              <div className="p-3.5 sm:p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--status-warning)]">Pending Obligations</p>
                <p className="font-display mt-1 text-lg sm:text-xl font-semibold text-[var(--status-warning)] tabular-nums">{formatINR(totalPendingSettlements)}</p>
                <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">{ledger.transfers.length} transfer{ledger.transfers.length === 1 ? "" : "s"} needed to settle</p>
              </div>
            </div>

            {/* Cumulative Member Contributions: Mobile Cards + Desktop Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Cumulative Member Contribution Ledger
              </h4>

              {/* Mobile Stacked Cards */}
              <div className="md:hidden space-y-2.5">
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
                    <div
                      key={m.id}
                      className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-3.5 space-y-3 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <UserAvatar
                            name={m.name}
                            avatarUrl={m.avatarUrl}
                            avatarColor={m.avatarColor}
                            size="sm"
                            shape="square"
                          />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-semibold text-[var(--text-primary)] break-words leading-tight">{m.name}</span>
                              {currentUser?.id === m.id && (
                                <span className="rounded bg-[var(--status-positive-bg)] text-[var(--status-positive)] px-1.5 py-0.5 text-[9px] font-semibold">
                                  You
                                </span>
                              )}
                              {isCreator && (
                                <span className="rounded bg-[var(--status-warning-bg)] text-[var(--status-warning)] border border-[var(--status-warning-border)] px-1.5 py-0.5 text-[9px] font-semibold">
                                  Admin
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`font-display text-sm font-semibold tabular-nums shrink-0 ${
                            isCreditor
                              ? "text-[var(--status-positive)]"
                              : isDebtor
                              ? "text-[var(--status-negative)]"
                              : "text-[var(--text-secondary)]"
                          }`}
                        >
                          {isCreditor ? `+${formatINR(netINR)}` : formatINR(netINR)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 border-t border-[var(--border-subtle)] pt-2.5 text-[11px]">
                        <div>
                          <span className="text-[var(--text-secondary)] block">Paid In All</span>
                          <span className="font-semibold text-[var(--text-primary)] tabular-nums">{formatINR(paid)}</span>
                        </div>
                        <div>
                          <span className="text-[var(--text-secondary)] block">Fair Share</span>
                          <span className="font-medium text-[var(--text-primary)] tabular-nums">{formatINR(share)}</span>
                        </div>
                        <div>
                          <span className="text-[var(--text-secondary)] block">Settled Paid</span>
                          <span className="font-medium text-[var(--text-primary)] tabular-nums">{formatINR(setPaid)}</span>
                        </div>
                        <div>
                          <span className="text-[var(--text-secondary)] block">Settled Received</span>
                          <span className="font-medium text-[var(--text-primary)] tabular-nums">{formatINR(setRecv)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--border-subtle)]">
                        <span
                          className={`text-[11px] font-semibold ${
                            isCreditor
                              ? "text-[var(--status-positive)]"
                              : isDebtor
                              ? "text-[var(--status-negative)]"
                              : "text-[var(--text-secondary)]"
                          }`}
                        >
                          {isCreditor ? "Receiving" : isDebtor ? "Owes Pool" : "All Square"}
                        </span>
                        {isDebtor && (
                          <button
                            type="button"
                            onClick={() => openMemberSettleUp(m.id, Math.abs(netINR))}
                            className="min-h-[44px] rounded-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-3.5 py-2 text-xs font-semibold text-[var(--brand-ink)] transition-colors"
                          >
                            Settle Up
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden md:block overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] uppercase text-[10px] font-semibold tracking-wider">
                      <th className="p-3 pl-4 align-middle">Member</th>
                      <th className="p-3 align-middle">Total Paid In All (₹)</th>
                      <th className="p-3 align-middle">Fair Share (₹)</th>
                      <th className="p-3 align-middle">Settlements Paid (₹)</th>
                      <th className="p-3 align-middle">Settlements Received (₹)</th>
                      <th className="p-3 align-middle">Net Balance (₹)</th>
                      <th className="p-3 pr-4 align-middle text-right">Status / Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-secondary)]">
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
                        <tr key={m.id} className="hover:bg-[var(--bg-surface-secondary)] transition-colors">
                          <td className="p-3 pl-4 align-middle font-semibold text-[var(--text-primary)] whitespace-nowrap">
                            <div className="flex items-center gap-2 min-w-max">
                              <UserAvatar
                                name={m.name}
                                avatarUrl={m.avatarUrl}
                                avatarColor={m.avatarColor}
                                size="xs"
                                shape="square"
                              />
                              <span className="font-semibold text-[var(--text-primary)] break-words">{m.name}</span>
                              {currentUser?.id === m.id && (
                                <span className="rounded bg-[var(--status-positive-bg)] text-[var(--status-positive)] px-1.5 py-0.5 text-[9px] font-semibold">
                                  You
                                </span>
                              )}
                              {isCreator && (
                                <span className="rounded bg-[var(--status-warning-bg)] text-[var(--status-warning)] border border-[var(--status-warning-border)] px-1.5 py-0.5 text-[9px] font-semibold">
                                  Admin
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 align-middle font-semibold text-[var(--text-primary)] tabular-nums">
                            {formatINR(paid)}
                          </td>
                          <td className="p-3 align-middle tabular-nums">
                            {formatINR(share)}
                          </td>
                          <td className="p-3 align-middle tabular-nums">
                            {formatINR(setPaid)}
                          </td>
                          <td className="p-3 align-middle tabular-nums">
                            {formatINR(setRecv)}
                          </td>
                          <td className="p-3 align-middle tabular-nums font-semibold">
                            <span
                              className={
                                isCreditor
                                  ? "text-[var(--status-positive)]"
                                  : isDebtor
                                  ? "text-[var(--status-negative)]"
                                  : "text-[var(--text-secondary)]"
                              }
                            >
                              {isCreditor ? `+${formatINR(netINR)}` : formatINR(netINR)}
                            </span>
                          </td>
                          <td className="p-3 pr-4 align-middle text-right">
                            {isDebtor ? (
                              <button
                                type="button"
                                onClick={() => openMemberSettleUp(m.id, Math.abs(netINR))}
                                className="rounded-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-2.5 py-1 text-[11px] font-semibold text-[var(--brand-ink)] transition-colors"
                              >
                                Settle Up
                              </button>
                            ) : isCreditor ? (
                              <span className="text-[11px] font-semibold text-[var(--status-positive)]">
                                Receiving
                              </span>
                            ) : (
                              <span className="text-[11px] text-[var(--text-secondary)] font-medium">All Square</span>
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
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Live Bilateral Transfer Obligations (Updated with Every Payment)
              </h4>
              {ledger.transfers.length === 0 ? (
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-6 text-center text-xs text-[var(--text-secondary)]">
                  <CheckCircle2 className="mx-auto h-7 w-7 text-[var(--status-positive)] mb-1.5" />
                  <p className="font-semibold text-[var(--text-primary)]">Everyone is 100% settled up</p>
                  <p className="text-[11px] mt-0.5">All pending debts have been reconciled and cleared.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ledger.transfers.map((t, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)]"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                          {names[t.from]} owes {names[t.to]}
                        </p>
                        <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-warning)]" />
                          Settlement Pending
                        </p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                        <span className="font-display text-sm font-semibold text-[var(--status-positive)] tabular-nums">
                          {formatPaise(t.amountPaise)}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setSettleUpData({
                              payerId: t.from,
                              receiverId: t.to,
                              amount: t.amountPaise / 100,
                            })
                          }
                          className="min-h-[44px] sm:min-h-0 rounded-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-3 py-1.5 text-xs font-semibold text-[var(--brand-ink)] transition-colors"
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
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Completed Settlement Records ({payments.length})
              </h4>
              {payments.length === 0 ? (
                <p className="text-xs text-[var(--text-secondary)]">No settlement payments recorded yet in this group.</p>
              ) : (
                <div className="space-y-2">
                  {payments.map((p: any) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-[var(--status-positive)] shrink-0" />
                        <div>
                          <p className="font-semibold text-[var(--text-primary)]">
                            {p.payer?.name} paid {p.receiver?.name}
                          </p>
                          <p className="text-[10px] text-[var(--text-secondary)]">
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
                      <span className="font-display font-semibold text-[var(--status-positive)] tabular-nums">
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

      {/* TAB 1: TRAVELER RECONCILIATION TABLE / MOBILE LEDGER CARDS */}
      {activeTab === "matrix" && (
        <div className="sr-tab-panel space-y-6">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden shadow-[var(--shadow-card)]">
            <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">Member Balances &amp; Settlements</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Breakdown of who paid, each member&apos;s share, and direct settlements.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadCSV}
                className="self-start sm:self-auto flex min-h-[44px] sm:min-h-[36px] items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] px-3 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors shrink-0"
              >
                <Download className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                <span>Export CSV</span>
              </button>
            </div>

            {/* Mobile Stacked Reconciliation Cards */}
            <div className="md:hidden divide-y divide-[var(--border-subtle)]">
              {members.map((m: any) => {
                const paid = memberPaid[m.id] || 0;
                const share = memberShare[m.id] || 0;
                const netPaise = ledger.balances[m.id] || 0;
                const netINR = netPaise / 100;
                const isCreditor = netINR > 0;
                const isDebtor = netINR < 0;

                return (
                  <div key={m.id} className="p-4 space-y-3 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar
                          name={m.name}
                          avatarUrl={m.avatarUrl}
                          avatarColor={m.avatarColor}
                          size="md"
                          shape="square"
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-semibold text-[var(--text-primary)] break-words leading-tight">{m.name}</span>
                            {currentUser?.id === m.id && (
                              <span className="rounded bg-[var(--status-positive-bg)] text-[var(--status-positive)] px-1.5 py-0.5 text-[9px] font-semibold">
                                You
                              </span>
                            )}
                          </div>
                          <span
                            className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                              isCreditor
                                ? "bg-[var(--status-positive-bg)] text-[var(--status-positive)] border-[var(--status-positive-border)]"
                                : isDebtor
                                ? "bg-[var(--status-negative-bg)] text-[var(--status-negative)] border-[var(--status-negative-border)]"
                                : "bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] border-[var(--border-subtle)]"
                            }`}
                          >
                            {isCreditor
                              ? "Gets Back"
                              : isDebtor
                              ? "Owes Group"
                              : "Settled / All Square"}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="block text-[10px] text-[var(--text-secondary)]">Net Balance</span>
                        <span
                          className={`font-display text-sm font-semibold tabular-nums ${
                            isCreditor
                              ? "text-[var(--status-positive)]"
                              : isDebtor
                              ? "text-[var(--status-negative)]"
                              : "text-[var(--text-secondary)]"
                          }`}
                        >
                          {isCreditor ? `+${formatINR(netINR)}` : formatINR(netINR)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-xl bg-[var(--bg-surface-secondary)] px-3 py-2 text-[11px]">
                      <div>
                        <span className="text-[var(--text-secondary)] block">Total Paid</span>
                        <span className="font-semibold text-[var(--text-primary)] tabular-nums">{formatINR(paid)}</span>
                      </div>
                      <div>
                        <span className="text-[var(--text-secondary)] block">Fair Share</span>
                        <span className="font-medium text-[var(--text-primary)] tabular-nums">{formatINR(share)}</span>
                      </div>
                    </div>

                    {isDebtor && (
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {currentUser?.isPro && (
                          <button
                            type="button"
                            onClick={() => openMemberWhatsAppReminder(m, Math.abs(netINR))}
                            className="min-h-[44px] flex-1 sm:flex-initial justify-center rounded-lg border border-[var(--status-positive-border)] bg-[var(--status-positive-bg)] px-3 py-2 text-xs font-semibold text-[var(--status-positive)] hover:opacity-90 transition-opacity flex items-center gap-1.5"
                            title="Send WhatsApp payment reminder"
                          >
                            <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Remind</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openMemberSettleUp(m.id, Math.abs(netINR))}
                          className="min-h-[44px] flex-1 sm:flex-initial rounded-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-4 py-2 text-xs font-semibold text-[var(--brand-ink)] transition-colors"
                        >
                          Settle Up
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="p-4 bg-[var(--bg-surface-secondary)] flex items-center justify-between gap-2 text-xs font-semibold text-[var(--text-primary)]">
                <div>
                  <span>Total Group Pool</span>
                  <span className="block text-[11px] font-normal text-[var(--status-positive)]">Net Balanced (Variance: ₹0.00)</span>
                </div>
                <span className="font-display text-sm tabular-nums text-[var(--status-positive)]">{formatINR(totalSpend)}</span>
              </div>
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] uppercase text-[10px] font-semibold tracking-wider">
                    <th className="p-3.5 pl-5 align-middle">Traveler / Member</th>
                    <th className="p-3.5 align-middle">Total Paid (INR)</th>
                    <th className="p-3.5 align-middle">Fair Share (INR)</th>
                    <th className="p-3.5 align-middle">Net Balance (INR)</th>
                    <th className="p-3.5 align-middle">Status</th>
                    <th className="p-3.5 pr-5 align-middle text-right">Settlement Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-secondary)]">
                  {members.map((m: any) => {
                    const paid = memberPaid[m.id] || 0;
                    const share = memberShare[m.id] || 0;
                    const netPaise = ledger.balances[m.id] || 0;
                    const netINR = netPaise / 100;
                    const isCreditor = netINR > 0;
                    const isDebtor = netINR < 0;

                    return (
                      <tr key={m.id} className="hover:bg-[var(--bg-surface-secondary)] transition-colors">
                        <td className="p-3.5 pl-5 align-middle font-semibold text-[var(--text-primary)] whitespace-nowrap">
                          <div className="flex items-center gap-2.5 min-w-max">
                            <UserAvatar
                              name={m.name}
                              avatarUrl={m.avatarUrl}
                              avatarColor={m.avatarColor}
                              size="xs"
                              shape="square"
                            />
                            <span className="font-semibold text-[var(--text-primary)] break-words">{m.name}</span>
                            {currentUser?.id === m.id && (
                              <span className="rounded bg-[var(--status-positive-bg)] text-[var(--status-positive)] px-1.5 py-0.5 text-[9px] font-semibold">
                                You
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 align-middle tabular-nums font-semibold text-[var(--text-primary)]">
                          {formatINR(paid)}
                        </td>
                        <td className="p-3.5 align-middle tabular-nums">
                          {formatINR(share)}
                        </td>
                        <td className="p-3.5 align-middle tabular-nums font-semibold">
                          <span
                            className={
                              isCreditor
                                ? "text-[var(--status-positive)]"
                                : isDebtor
                                ? "text-[var(--status-negative)]"
                                : "text-[var(--text-secondary)]"
                            }
                          >
                            {isCreditor ? `+${formatINR(netINR)}` : formatINR(netINR)}
                          </span>
                        </td>
                        <td className="p-3.5 align-middle">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                              isCreditor
                                ? "bg-[var(--status-positive-bg)] text-[var(--status-positive)] border-[var(--status-positive-border)]"
                                : isDebtor
                                ? "bg-[var(--status-negative-bg)] text-[var(--status-negative)] border-[var(--status-negative-border)]"
                                : "bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] border-[var(--border-subtle)]"
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
                                  onClick={() => openMemberWhatsAppReminder(m, Math.abs(netINR))}
                                  className="rounded-lg border border-[var(--status-positive-border)] bg-[var(--status-positive-bg)] px-2 py-1.5 text-[11px] font-semibold text-[var(--status-positive)] hover:opacity-90 transition-opacity flex items-center gap-1"
                                  title="Send WhatsApp payment reminder"
                                >
                                  <MessageCircle className="h-3 w-3" />
                                  <span className="hidden sm:inline">Remind</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => openMemberSettleUp(m.id, Math.abs(netINR))}
                                className="rounded-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-3 py-1.5 text-[11px] font-semibold text-[var(--brand-ink)] transition-colors"
                              >
                                Settle Up
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[var(--text-secondary)] font-medium">All Square</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] font-semibold text-[var(--text-primary)] text-xs">
                    <td className="p-3.5 pl-5">Total Group Pool</td>
                    <td className="p-3.5 tabular-nums text-[var(--status-positive)]">{formatINR(totalSpend)}</td>
                    <td className="p-3.5 tabular-nums text-[var(--status-positive)]">{formatINR(totalSpend)}</td>
                    <td className="p-3.5 tabular-nums text-[var(--text-secondary)]">₹ 0.00</td>
                    <td className="p-3.5 text-[var(--status-positive)]">Net Balanced</td>
                    <td className="p-3.5 pr-5 text-right text-[11px] text-[var(--text-secondary)]">Variance: ₹ 0.00</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OPTIMIZED TRANSFERS */}
      {activeTab === "balances" && (
        <div className="sr-tab-panel space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[var(--brand-primary)]" />
              Optimized Minimal Cash-Flow Transfers
            </h3>
            <span className="text-xs text-[var(--text-secondary)]">
              {ledger.transfers.length} transfer{ledger.transfers.length === 1 ? "" : "s"} needed to balance entire group
            </span>
          </div>

          {ledger.transfers.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-[var(--status-positive)] mb-2" />
              <p className="font-display text-sm font-semibold text-[var(--text-primary)]">Everyone is settled up</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                No pending debts remaining in this group.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ledger.transfers.map((t: any, idx: number) => (
                <div
                  key={`${t.from}-${t.to}-${idx}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-card)] hover:border-[var(--brand-primary)] transition-colors"
                >
                  <div className="flex items-center justify-between sm:justify-start gap-3 min-w-0 flex-1">
                    <div className="text-left min-w-0 flex-1">
                      <span className="text-[10px] font-semibold text-[var(--status-negative)] uppercase tracking-wider block">
                        Debtor (Pays)
                      </span>
                      <p className="text-xs font-semibold text-[var(--text-primary)] break-words leading-tight">
                        {names[t.from]}
                      </p>
                    </div>

                    <div className="flex flex-col items-center px-1 shrink-0">
                      <ArrowRight className="h-4 w-4 text-[var(--brand-primary)]" aria-hidden="true" />
                      <span className="text-[9px] text-[var(--text-secondary)] uppercase">UPI / Cash</span>
                    </div>

                    <div className="text-right sm:text-left min-w-0 flex-1">
                      <span className="text-[10px] font-semibold text-[var(--status-positive)] uppercase tracking-wider block">
                        Creditor (Receives)
                      </span>
                      <p className="text-xs font-semibold text-[var(--text-primary)] break-words leading-tight">
                        {names[t.to]}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border-subtle)]">
                    <span className="font-display text-sm font-semibold text-[var(--status-positive)] tabular-nums">
                      {formatPaise(t.amountPaise)}
                    </span>
                    <div className="flex items-center gap-2">
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
                          aria-label={`Send WhatsApp payment reminder to ${names[t.from] || "member"}`}
                          className="min-h-[44px] sm:min-h-0 rounded-lg border border-[var(--status-positive-border)] bg-[var(--status-positive-bg)] px-2.5 py-1.5 text-xs font-semibold text-[var(--status-positive)] hover:opacity-90 transition-opacity flex items-center gap-1"
                          title="Send WhatsApp payment reminder"
                        >
                          <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Remind</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setSettleUpData({
                            payerId: t.from,
                            receiverId: t.to,
                            amount: t.amountPaise / 100,
                          })
                        }
                        className="min-h-[44px] sm:min-h-0 rounded-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-3 py-1.5 text-xs font-semibold text-[var(--brand-ink)] transition-colors"
                      >
                        1-Tap Settle
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CIRCUIT EXPENSES LIST & MATRIX */}
      {activeTab === "expenses" && (
        <div className="sr-tab-panel space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {(["All", ...CATEGORIES] as const).map((cat) => (
                <button
                  type="button"
                  key={cat}
                  aria-pressed={categoryFilter === cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`min-h-[44px] sm:min-h-[32px] rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    categoryFilter === cat
                      ? "border-[var(--brand-primary)] bg-[var(--status-positive-bg)] text-[var(--brand-dark)] dark:text-[var(--brand-primary)]"
                      : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {currentUser?.isPro && (
                <button
                  type="button"
                  onClick={() => setShowRecurringModal(true)}
                  className="flex h-9 items-center gap-1.5 rounded-xl border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-3 text-xs font-medium text-[var(--status-warning)] hover:opacity-90 transition-opacity"
                  title="Automated Recurring Expenses"
                >
                  <Repeat className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Recurring Rules</span>
                  <span className="sm:hidden">Recurring</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowAddExpense(true)}
                className="flex h-9 items-center gap-1.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-3.5 text-xs font-semibold text-[var(--brand-ink)] transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Expense</span>
              </button>
            </div>
          </div>

          {filteredExpenses.length === 0 ? (
            expenses.length > 0 && categoryFilter !== "All" ? (
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center space-y-3">
                <Receipt className="mx-auto h-8 w-8 text-[var(--text-secondary)]" aria-hidden="true" />
                <div>
                  <p className="font-display text-sm font-semibold text-[var(--text-primary)]">
                    No {categoryFilter} expenses
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    None of the {expenses.length} recorded expenses in this group match {categoryFilter}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("All")}
                  className="inline-flex min-h-[44px] sm:min-h-[36px] items-center rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] px-4 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  Show All Categories
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] p-8 text-center space-y-3">
                <Receipt className="mx-auto h-8 w-8 text-[var(--text-secondary)]" aria-hidden="true" />
                <div>
                  <p className="font-display text-sm font-semibold text-[var(--text-primary)]">No expenses recorded yet</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Add your first bill to record travel tickets, meals, or shared group costs.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddExpense(true)}
                  className="inline-flex min-h-[44px] sm:min-h-[38px] items-center gap-1.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-4 text-xs font-semibold text-[var(--brand-ink)] transition-colors"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>Add Expense</span>
                </button>
              </div>
            )
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
                    className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)] overflow-hidden hover:border-[var(--border-strong)] transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedExpenseId(isExpanded ? null : exp.id)}
                      aria-expanded={isExpanded}
                      aria-controls={`group-expense-split-${exp.id}`}
                      className="w-full p-4 flex items-center justify-between gap-3 cursor-pointer text-left hover:bg-[var(--bg-surface-secondary)]/40 transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${style.bg} ${style.color}`}>
                          <Icon className="h-5 w-5" />
                        </span>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 min-w-0">
                            <h4 className="text-sm font-semibold text-[var(--text-primary)] break-words line-clamp-2 leading-snug">
                              {exp.title}
                            </h4>
                            {exp.isOfflinePending && (
                              <span className="shrink-0 rounded-full border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--status-warning)]">
                                Waiting to sync
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 font-semibold text-[var(--text-primary)]">
                              <UserAvatar
                                name={exp.paidBy.name}
                                avatarUrl={exp.paidBy.avatarUrl}
                                avatarColor={exp.paidBy.avatarColor}
                                size="xs"
                                shape="circle"
                              />
                              <span>{exp.paidBy.name}</span>
                            </span> paid{" "}
                            <span className="font-semibold text-[var(--text-primary)] tabular-nums">{formatINR(exp.totalAmount)}</span>
                            {exp.currency && exp.currency !== "INR" && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--status-warning-bg)] border border-[var(--status-warning-border)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--status-warning)]">
                                <span>{getCurrency(exp.currency).flag}</span>
                                <span>
                                  {exp.originalAmount
                                    ? formatCurrencyAmount(exp.originalAmount, exp.currency)
                                    : exp.currency}
                                </span>
                              </span>
                            )}
                            <span>·</span>
                            <span>
                              {new Date(exp.date || exp.createdAt).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p
                            className={`text-xs font-semibold tabular-nums ${
                              isPayer
                                ? "text-[var(--status-positive)]"
                                : mySplit
                                ? "text-[var(--status-negative)]"
                                : "text-[var(--text-secondary)]"
                            }`}
                          >
                            {userImpact}
                          </p>
                          <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">
                            {exp.splitType}
                          </p>
                        </div>
                        <span className="text-[var(--text-secondary)] p-1" aria-hidden="true">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div id={`group-expense-split-${exp.id}`} className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-4 space-y-3 text-xs">
                        {exp.currency && exp.currency !== "INR" && (
                          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--status-warning-bg)] border border-[var(--status-warning-border)] px-3 py-2 text-xs text-[var(--status-warning)] font-medium">
                            <div className="flex items-center gap-1.5">
                              <span className="text-base">{getCurrency(exp.currency).flag}</span>
                              <span>Foreign Expense: <strong>{exp.originalAmount ? formatCurrencyAmount(exp.originalAmount, exp.currency) : exp.currency}</strong></span>
                            </div>
                            <span className="text-[11px] text-[var(--text-secondary)] tabular-nums">
                              1 {exp.currency} = ₹{exp.exchangeRate?.toFixed(4) || "—"} INR · Group balance: {formatINR(exp.totalAmount)}
                            </span>
                          </div>
                        )}

                        {exp.notes && (
                          <p className="text-[var(--text-secondary)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-2.5 rounded-xl text-xs">
                            &ldquo;{exp.notes}&rdquo;
                          </p>
                        )}

                        <div>
                          <p className="font-semibold text-[var(--text-secondary)] mb-2">Split Breakdown &amp; Participation:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {exp.splits.map((s: any) => (
                              <div
                                key={s.id}
                                className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2.5"
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{ background: s.user.avatarColor || DEFAULT_AVATAR_COLOR }}
                                  />
                                  <span className="font-medium text-[var(--text-primary)]">{s.user.name}</span>
                                </div>
                                <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                                  {formatINR(s.amount)}
                                  {s.percentage !== null && (
                                    <span className="text-[10px] text-[var(--text-secondary)] ml-1">
                                      ({s.percentage.toFixed(0)}%)
                                    </span>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
                          <button
                            type="button"
                            onClick={() => setEditingExpense(exp)}
                            className="flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>Edit Expense</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingExpense(exp)}
                            className="flex items-center gap-1.5 rounded-lg border border-[var(--status-negative-border)] bg-[var(--status-negative-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--status-negative)] hover:opacity-90 transition-opacity"
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
        <div className="sr-tab-panel space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-[var(--brand-primary)]" />
              Direct Person-to-Person Settlements Log (UPI / Cash)
            </h3>
            <span className="text-xs text-[var(--status-positive)] font-semibold tabular-nums">
              Total Reconciled: {formatINR(totalReconciled)}
            </span>
          </div>

          {payments.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-[var(--text-secondary)] mb-2" />
              <p className="font-display text-sm font-semibold text-[var(--text-primary)]">No direct settlements recorded yet</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                When members settle up via Google Pay or Cash, recorded payments will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {payments.map((p: any) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-card)]"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--status-positive-bg)] text-[var(--status-positive)] border border-[var(--status-positive-border)]">
                      <Check className="h-4 w-4 stroke-[2.5]" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-primary)] flex flex-wrap items-center gap-1.5">
                        <span>
                          <span className="text-[var(--status-positive)]">{names[p.payerId]}</span> paid{" "}
                          <span>{names[p.receiverId]}</span>
                        </span>
                        {p.isOfflinePending && (
                          <span className="rounded-full border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--status-warning)]">
                            Waiting to sync
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                        {p.notes || "Direct UPI Settle"} · {new Date(p.createdAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  </div>
                  <span className="font-display text-sm font-semibold text-[var(--status-positive)] tabular-nums">
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
        <div className="sr-tab-panel rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-4 sm:p-5">
          <ActivityLogList activities={activities} />
        </div>
      )}

      {/* TAB 6: MEMBERS & INVITES */}
      {activeTab === "members" && (
        <div className="sr-tab-panel space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-sm font-semibold text-[var(--text-primary)]">Group Members ({members.length})</h3>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowManageGroup(true)}
                  className="flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  <Settings className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                  <span>Manage Roles</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowAddMember(true)}
                className="flex h-9 items-center gap-1.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-3.5 text-xs font-semibold text-[var(--brand-ink)] transition-colors"
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
                className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 shadow-[var(--shadow-card)] sr-card-interactive"
              >
                <UserAvatar
                  name={m.name}
                  avatarUrl={m.avatarUrl}
                  avatarColor={m.avatarColor}
                  size="lg"
                  shape="rounded"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-xs font-semibold text-[var(--text-primary)] break-words leading-tight">{m.name}</p>
                    {m.role === "ADMIN" && (
                      <span className="text-[9px] bg-[var(--status-warning-bg)] text-[var(--status-warning)] border border-[var(--status-warning-border)] px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5 shrink-0">
                        <Crown className="h-2.5 w-2.5" /> Admin
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] break-all mt-0.5 leading-tight">{m.email || m.phone || "Member"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: FORWARDED ITINERARY */}
      {activeTab === "itinerary" && group?.itineraries && group.itineraries.length > 0 && (
        <div className="sr-tab-panel space-y-6">
          {group.itineraries.map((it: any, itIdx: number) => {
            const plan = it.planData || {};
            const budgetBreakdown = plan.budgetBreakdown;
            const daysList = Array.isArray(plan.days) ? plan.days : [];

            return (
              <div key={it.id || itIdx} className="space-y-6">
                {/* Itinerary Header Card */}
                <div className="rounded-2xl border border-[var(--status-positive-border)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-card)]">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--status-positive-bg)] text-[var(--status-positive)] border border-[var(--status-positive-border)]">
                          Linked Itinerary
                        </span>
                        <span className="text-xs text-[var(--text-secondary)]">
                          Updated: {new Date(it.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                      <h2 className="font-display text-xl sm:text-2xl font-semibold text-[var(--text-primary)] mt-1">
                        {it.title || `Trip: ${it.origin} -> ${it.destination}`}
                      </h2>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        Complete verified day-by-day itinerary with rail berths, dedicated mountain cabs, and budget backpacker hostels &amp; homestays.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/itinerary?id=${it.id}`}
                        className="flex h-10 items-center gap-1.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-[var(--brand-ink)] font-semibold px-4 rounded-xl text-xs transition-colors"
                      >
                        <span>Open in Itinerary Studio</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* 6-Category Comprehensive Budget Breakdown */}
                  {budgetBreakdown && Array.isArray(budgetBreakdown.categories) && (
                    <div className="mt-5 pt-4 border-t border-[var(--border-subtle)]">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <Receipt className="h-4 w-4 text-[var(--brand-primary)]" />
                          <h4 className="font-display text-sm font-semibold text-[var(--text-primary)]">Comprehensive Entire-Trip Group Budget</h4>
                        </div>
                        <div className="text-xs tabular-nums font-semibold text-[var(--status-positive)]">
                          Total: ₹{Number(budgetBreakdown.totalGroupCost || it.totalBudget).toLocaleString()} (~₹{Number(budgetBreakdown.costPerPerson || 15000).toLocaleString()} / person)
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
                        {budgetBreakdown.categories.map((c: any) => (
                          <div key={c.id} className="p-3 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)]">
                            <span className="text-[var(--text-secondary)] text-[10px] block leading-snug">{c.name.split("(")[0].trim()}</span>
                            <span className="font-display text-sm font-semibold text-[var(--text-primary)] tabular-nums block mt-0.5">
                              ₹{Number(c.groupTotal || 0).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-[var(--status-positive)] tabular-nums block mt-0.5">
                              ₹{Number(c.perPerson || 0).toLocaleString()}/p
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Day-by-Day Cards */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                    <h3 className="font-display text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[var(--brand-primary)]" />
                      <span>Day-by-Day Schedule ({daysList.length} Days)</span>
                    </h3>
                    <span className="text-xs text-[var(--text-secondary)]">All timings verified with realistic mountain road speeds</span>
                  </div>

                  {daysList.map((day: any) => (
                    <div
                      key={day.day || day.dayNumber}
                      className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-4 shadow-[var(--shadow-card)]"
                    >
                      {/* Day Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--border-subtle)]">
                        <div className="flex items-center gap-3">
                          <span className="h-8 w-8 rounded-lg bg-[var(--status-positive-bg)] border border-[var(--status-positive-border)] text-[var(--status-positive)] font-display font-semibold text-xs grid place-items-center tabular-nums">
                            D{day.day || day.dayNumber}
                          </span>
                          <div>
                            <h4 className="font-display text-base font-semibold text-[var(--text-primary)]">{day.dayTitle || `Day ${day.day || day.dayNumber}`}</h4>
                            {day.date && <p className="text-xs text-[var(--text-secondary)] tabular-nums">{day.date}</p>}
                          </div>
                        </div>

                        {day.stay && (
                          <div className="flex items-center gap-1.5 text-xs text-[var(--status-positive)] bg-[var(--status-positive-bg)] border border-[var(--status-positive-border)] px-3 py-1 rounded-full shrink-0">
                            <Hotel className="h-3.5 w-3.5 shrink-0" />
                            <span className="break-words leading-tight">Stay: {day.stay}</span>
                          </div>
                        )}
                      </div>

                      {/* Transit Legs */}
                      {Array.isArray(day.legs) && day.legs.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                            <Train className="h-3.5 w-3.5 text-[var(--brand-primary)]" /> Transit &amp; Transfers
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {day.legs.map((leg: any, legIdx: number) => (
                              <div key={legIdx} className="p-3 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] text-xs space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold text-[var(--text-primary)]">{leg.from} &rarr; {leg.to}</span>
                                  <span className="text-[var(--status-positive)] tabular-nums font-semibold">₹{leg.cost} (group)</span>
                                </div>
                                <div className="text-[var(--text-secondary)] text-[11px] flex flex-wrap items-center gap-2">
                                  <span className="font-medium text-[var(--brand-dark)] dark:text-[var(--brand-primary)]">{leg.mode}</span>
                                  <span>•</span>
                                  <span>{leg.depart} - {leg.arrive}</span>
                                  <span>•</span>
                                  <span>{leg.duration}</span>
                                </div>
                                {leg.details && <p className="text-[var(--text-secondary)] text-[11px]">{leg.details}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Activities & Sightseeing */}
                      {day.activities && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[var(--border-subtle)] text-xs">
                          {day.activities.morning && (
                            <div className="p-3 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)]">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--status-warning)] block mb-1">Morning</span>
                              <p className="text-[var(--text-secondary)] text-[11px] leading-relaxed">{day.activities.morning}</p>
                            </div>
                          )}
                          {day.activities.afternoon && (
                            <div className="p-3 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)]">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-dark)] dark:text-[var(--brand-primary)] block mb-1">Afternoon</span>
                              <p className="text-[var(--text-secondary)] text-[11px] leading-relaxed">{day.activities.afternoon}</p>
                            </div>
                          )}
                          {day.activities.evening && (
                            <div className="p-3 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)]">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--status-positive)] block mb-1">Evening</span>
                              <p className="text-[var(--text-secondary)] text-[11px] leading-relaxed">{day.activities.evening}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Accommodation Details & Contacts */}
                      {day.hotelDetails && (
                        <div className="p-3.5 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--status-positive-border)] text-xs space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
                              <Hotel className="h-4 w-4 text-[var(--brand-primary)]" />
                              <span>{day.hotelDetails.name}</span>
                            </div>
                            <span className="text-[var(--status-positive)] tabular-nums font-semibold">
                              ₹{day.hotelDetails.costPerNight} <span className="text-[10px] text-[var(--text-secondary)] font-normal">/ night total</span>
                            </span>
                          </div>

                          {day.hotelDetails.breakdownNote && (
                            <p className="text-[var(--text-secondary)] text-[11px] leading-relaxed">
                              {day.hotelDetails.breakdownNote}
                            </p>
                          )}

                          {day.hotelDetails.contact && (
                            <p className="text-[var(--text-secondary)] text-[11px] flex items-center gap-1.5">
                              <Phone className="h-3 w-3 text-[var(--brand-primary)]" />
                              <span>Reception Contact: <strong className="text-[var(--text-primary)] font-mono">{day.hotelDetails.contact}</strong></span>
                            </p>
                          )}

                          {/* Alternate Hostels */}
                          {Array.isArray(day.hotelDetails.alternateHostels) && day.hotelDetails.alternateHostels.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-[var(--border-subtle)]">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--status-positive)] block mb-1.5">
                                Verified Alternate Hostels &amp; Homestays:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {day.hotelDetails.alternateHostels.map((h: any, hIdx: number) => (
                                  <div key={hIdx} className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px] flex items-center justify-between">
                                    <span className="text-[var(--text-primary)]">{h.name}</span>
                                    <span className="text-[var(--status-positive)] tabular-nums font-semibold">₹{h.costPerPerson || 500}/p</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Important Group Travel Tips */}
                <div className="p-4 rounded-2xl bg-[var(--status-warning-bg)] border border-[var(--status-warning-border)] text-xs flex items-start gap-3">
                  <ShieldAlert className="h-5 w-5 text-[var(--status-warning)] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-semibold text-[var(--status-warning)] block">Nepal Travel &amp; Border Advisory for All Members:</span>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                      • Every traveler must carry a physical Voter ID card or original Passport for Nepal border clearance.<br />
                      • Carry Indian ₹100 and ₹200 currency notes; Indian ₹500 notes are legally prohibited in Nepal.<br />
                      • Mountain roads between Pokhara, Marpha &amp; Muktinath average 25–35 km/h; daylight travel is advised.
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
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
          groupName={group?.name}
          onClose={() => setDeletingExpense(null)}
          onDeleted={() => {
            setDeletingExpense(null);
            loadGroup();
          }}
        />
      )}

      {settleUpData && (
        <SettleUpModal
          groupId={group?.id || groupId}
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
                  avatarColor: newMember.avatarColor || DEFAULT_AVATAR_COLOR,
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
