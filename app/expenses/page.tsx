"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useUser } from "@/lib/userContext";
import {
  type ExpenseDTO,
  CATEGORIES,
  type CategoryName,
} from "@/lib/types";
import { formatINR } from "@/lib/money";
import { getCurrency, formatCurrencyAmount } from "@/lib/currencies";
import { DEFAULT_AVATAR_COLOR } from "@/lib/avatarColors";
import UserAvatar from "@/components/ui/UserAvatar";
import { formatSplitType } from "@/lib/displayLabels";
import {
  Receipt,
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  Utensils,
  Home,
  Plane,
  Zap,
  ShoppingBag,
  Film,
  Shapes,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import AddExpenseModal from "@/components/AddExpenseModal";
import DeleteExpenseModal from "@/components/DeleteExpenseModal";
import SplitRupeeLoader from "@/components/SplitRupeeLoader";
import DataStatusBanner from "@/components/ui/DataStatusBanner";
import { getCachedAllExpenses, saveCachedAllExpenses } from "@/lib/offlineSync";
import { parseApiJsonResponse, resolveDataViewMode, type FetchIssueState } from "@/lib/apiResponse";

const CATEGORY_STYLE: Record<CategoryName, { icon: typeof Utensils; color: string; bg: string }> = {
  Food: { icon: Utensils, color: "text-[var(--status-warning)]", bg: "bg-[var(--status-warning-bg)] border-[var(--status-warning-border)]" },
  Rent: { icon: Home, color: "text-[var(--brand-dark)] dark:text-[var(--brand-primary)]", bg: "bg-[var(--brand-tint-bg)] border-[var(--brand-tint-border)]" },
  Travel: { icon: Plane, color: "text-[var(--status-positive)]", bg: "bg-[var(--status-positive-bg)] border-[var(--status-positive-border)]" },
  Utilities: { icon: Zap, color: "text-[var(--status-warning)]", bg: "bg-[var(--status-warning-bg)] border-[var(--status-warning-border)]" },
  Shopping: { icon: ShoppingBag, color: "text-[var(--text-primary)]", bg: "bg-[var(--bg-surface-secondary)] border-[var(--border-subtle)]" },
  Entertainment: { icon: Film, color: "text-[var(--status-negative)]", bg: "bg-[var(--status-negative-bg)] border-[var(--status-negative-border)]" },
  Miscellaneous: { icon: Shapes, color: "text-[var(--text-secondary)]", bg: "bg-[var(--bg-surface-secondary)] border-[var(--border-subtle)]" },
};

export default function AllExpensesPage() {
  const { currentUser, isLoading: userLoading } = useUser();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryName | "All">("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [fetchIssue, setFetchIssue] = useState<FetchIssueState | null>(null);

  // Modals
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseDTO | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<ExpenseDTO | null>(null);
  const expensesRef = useRef(expenses);
  expensesRef.current = expenses;

  const loadExpenses = useCallback(async (isInitial = false) => {
    if (!currentUser?.id) {
      const cached = getCachedAllExpenses();
      if (cached.length > 0) setExpenses(cached);
      if (!userLoading) setLoading(false);
      return;
    }
    const cachedInitial = getCachedAllExpenses();
    if (isInitial && cachedInitial.length > 0) {
      setExpenses(cachedInitial);
      setLoading(false);
    }
    try {
      if (isInitial && expensesRef.current.length === 0 && cachedInitial.length === 0) setLoading(true);
      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 8000) : null;
      const res = await fetch(`/api/expenses?userId=${encodeURIComponent(currentUser.id)}&_t=${Date.now()}`, {
        signal: controller?.signal,
      });
      if (timeoutId) clearTimeout(timeoutId);
      const outcome = await parseApiJsonResponse<{ ok?: boolean; expenses?: any[] }>(
        res,
        "Could not load your expenses."
      );
      if (outcome.kind === "ok" && Array.isArray(outcome.data.expenses)) {
        saveCachedAllExpenses(outcome.data.expenses);
        setExpenses(getCachedAllExpenses());
        setFetchIssue(null);
      } else {
        setExpenses(getCachedAllExpenses());
        setFetchIssue(
          outcome.kind === "offline"
            ? { kind: "offline", message: outcome.message }
            : { kind: "error", message: outcome.kind === "error" ? outcome.message : "Could not load your expenses." }
        );
      }
    } catch {
      setExpenses(getCachedAllExpenses());
      const offlineNow = typeof navigator !== "undefined" && !navigator.onLine;
      setFetchIssue({
        kind: offlineNow ? "offline" : "error",
        message: offlineNow
          ? "You are currently offline. Showing cached expenses if available."
          : "Network error while loading expenses.",
      });
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  }, [currentUser?.id, userLoading]);

  const handleRetry = () => {
    setIsRetrying(true);
    loadExpenses(false);
  };

  useEffect(() => {
    loadExpenses(true);
    const handleRefresh = () => loadExpenses(false);
    window.addEventListener("splitrupee_refresh", handleRefresh);
    window.addEventListener("splitrupee_offline_queue_changed", handleRefresh);
    return () => {
      window.removeEventListener("splitrupee_refresh", handleRefresh);
      window.removeEventListener("splitrupee_offline_queue_changed", handleRefresh);
    };
  }, [loadExpenses]);

  const filtered = expenses.filter((e) => {
    const matchesCategory = categoryFilter === "All" || e.category === categoryFilter;
    const matchesSearch =
      !search.trim() ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.paidBy?.name?.toLowerCase()?.includes(search.toLowerCase()) ||
      (e.groupName && e.groupName.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const hasFilterActive = Boolean(search.trim()) || categoryFilter !== "All";
  const viewMode = resolveDataViewMode({
    isLoading: loading || userLoading,
    totalCount: expenses.length,
    visibleCount: filtered.length,
    hasFilterActive,
    fetchIssue,
  });

  const totalSum = filtered.reduce((acc, curr) => acc + curr.totalAmount, 0);

  if (viewMode === "loading" && currentUser) {
    return (
      <SplitRupeeLoader
        variant="page"
        text="All Expenses"
        subtext="Loading your expenses across all groups..."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--text-primary)] flex items-center gap-2.5">
            <Receipt className="h-6 w-6 text-[var(--brand-primary)]" />
            All Expenses
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Complete chronological expense history across all your shared groups
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-1.5 text-right shadow-[var(--shadow-card)]">
            <p className="text-[10px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider">Total Shown</p>
            <p className="font-display text-sm font-semibold text-[var(--text-primary)] tabular-nums">{formatINR(totalSum)}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddExpense(true)}
            className="flex h-10 items-center gap-1.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-4 text-xs font-semibold text-[var(--brand-ink)] transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {fetchIssue && expenses.length > 0 && (
        <DataStatusBanner
          issue={fetchIssue}
          onRetry={handleRetry}
          isRetrying={isRetrying}
          cachedLabel="Showing cached expenses until connection restores."
        />
      )}

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
          <input
            type="text"
            aria-label="Search expenses by title, payer, or group name"
            placeholder="Search by title, payer, or group name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] pl-10 pr-4 text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:border-[var(--brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--brand-dark)] dark:focus-visible:ring-[var(--brand-primary)] transition-colors"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {(["All", ...CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              aria-pressed={categoryFilter === cat}
              onClick={() => setCategoryFilter(cat)}
              className={`min-h-[44px] sm:min-h-[32px] rounded-full border px-3 py-1 text-xs font-medium sr-interactive-transition sr-button-press ${
                categoryFilter === cat
                  ? "border-[var(--brand-primary)] bg-[var(--status-positive-bg)] text-[var(--brand-dark)] dark:text-[var(--brand-primary)] font-semibold shadow-xs"
                  : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses Feed */}
      <div key={categoryFilter} className="sr-tab-panel space-y-2.5">
        {filtered.map((exp) => {
          const isExpanded = expandedId === exp.id;
          const style = CATEGORY_STYLE[exp.category as CategoryName] || CATEGORY_STYLE.Miscellaneous;
          const Icon = style.icon;

          const mySplit = exp.splits.find((s: any) => s.userId === currentUser?.id);
          const isPayer = exp.paidById === currentUser?.id;
          let userImpact = "not involved";
          if (isPayer) {
            const lent = exp.totalAmount - (mySplit?.amount ?? 0);
            userImpact = `you lent ${formatINR(lent)}`;
          } else if (mySplit) {
            userImpact = `you borrowed ${formatINR(mySplit.amount)}`;
          }

          return (
            <div
              key={exp.id}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)] overflow-hidden sr-card-interactive"
            >
              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${style.bg} ${style.color}`}>
                    <Icon className="h-5 w-5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : exp.id)}
                        aria-expanded={isExpanded}
                        aria-controls={`expense-split-${exp.id}`}
                        className="text-left text-sm font-semibold text-[var(--text-primary)] hover:underline break-words line-clamp-2 leading-snug cursor-pointer"
                      >
                        {exp.title}
                      </button>
                      {(exp as any).isOfflinePending && (
                        <span className="shrink-0 rounded-full border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--status-warning)]">
                          Waiting to sync
                        </span>
                      )}
                      {exp.groupName && (
                        <Link
                          href={`/groups/${exp.groupId}`}
                          className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] px-2 py-0.5 text-[10px] font-medium text-[var(--brand-dark)] dark:text-[var(--brand-primary)] hover:border-[var(--brand-primary)] transition-colors"
                        >
                          {exp.groupName}
                        </Link>
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

                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : exp.id)}
                  aria-expanded={isExpanded}
                  aria-controls={`expense-split-${exp.id}`}
                  aria-label={`${isExpanded ? "Hide" : "Show"} split breakdown for ${exp.title}`}
                  className="flex items-center gap-3 shrink-0 min-h-[44px] pl-2 pr-1 rounded-lg text-right cursor-pointer hover:bg-[var(--bg-surface-secondary)] transition-colors"
                >
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
                    <p className="text-[11px] text-[var(--text-secondary)] tracking-wide">
                      {formatSplitType(exp.splitType)}
                    </p>
                  </div>
                  <span className="text-[var(--text-secondary)]" aria-hidden="true">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </span>
                </button>
              </div>

              {isExpanded && (
                <div id={`expense-split-${exp.id}`} className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-4 space-y-3 text-xs">
                  {exp.currency && exp.currency !== "INR" && (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--status-warning-bg)] border border-[var(--status-warning-border)] px-3 py-2 text-xs text-[var(--status-warning)] font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{getCurrency(exp.currency).flag}</span>
                        <span>Foreign Expense: <strong>{exp.originalAmount ? formatCurrencyAmount(exp.originalAmount, exp.currency) : exp.currency}</strong></span>
                      </div>
                      <span className="text-[11px] text-[var(--text-secondary)] tabular-nums">
                        1 {exp.currency} = ₹{exp.exchangeRate?.toFixed(4) || "N/A"} INR · Recorded in ledger as {formatINR(exp.totalAmount)}
                      </span>
                    </div>
                  )}

                  {exp.notes && (
                    <p className="text-[var(--text-secondary)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-2.5 rounded-xl text-xs">
                      &ldquo;{exp.notes}&rdquo;
                    </p>
                  )}

                  <div>
                    <p className="font-semibold text-[var(--text-secondary)] mb-2">Split Breakdown:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {exp.splits.map((s: any) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2.5"
                        >
                          <div className="flex items-center gap-2">
                            <UserAvatar
                              name={s.user.name}
                              avatarUrl={s.user.avatarUrl}
                              avatarColor={s.user.avatarColor}
                              size="xs"
                              shape="circle"
                            />
                            <span className="font-medium text-[var(--text-primary)]">{s.user.name}</span>
                          </div>
                          <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                            {formatINR(s.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
                    <button
                      type="button"
                      onClick={() => setEditingExpense(exp)}
                      className="min-h-[44px] sm:min-h-0 flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Edit Expense</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingExpense(exp)}
                      className="min-h-[44px] sm:min-h-0 flex items-center gap-1.5 rounded-xl border border-[var(--status-negative-border)] bg-[var(--status-negative-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--status-negative)] hover:opacity-90 transition-opacity"
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

        {viewMode === "error" && fetchIssue && (
          <div role="alert" className="rounded-2xl border border-[var(--status-negative-border)] bg-[var(--bg-surface)] p-10 text-center space-y-3 shadow-[var(--shadow-card)]">
            <AlertTriangle className="mx-auto h-8 w-8 text-[var(--status-negative)]" aria-hidden="true" />
            <p className="font-display text-sm font-semibold text-[var(--text-primary)]">Could not load expenses</p>
            <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">{fetchIssue.message}</p>
            <button
              type="button"
              onClick={handleRetry}
              disabled={isRetrying}
              className="inline-flex min-h-[44px] sm:min-h-[38px] items-center gap-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-4 text-xs font-semibold text-[var(--brand-ink)] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin" : ""}`} aria-hidden="true" />
              <span>{isRetrying ? "Retrying..." : "Retry"}</span>
            </button>
          </div>
        )}

        {viewMode === "empty" && (
          <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] p-10 text-center space-y-3">
            <Receipt className="mx-auto h-8 w-8 text-[var(--text-secondary)]" aria-hidden="true" />
            <div>
              <p className="font-display text-sm font-semibold text-[var(--text-primary)]">No expenses recorded yet</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Add your first shared expense to track splits and balances across groups.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddExpense(true)}
              className="inline-flex min-h-[44px] sm:min-h-[38px] items-center gap-1.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-4 text-xs font-semibold text-[var(--brand-ink)] transition-colors"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Add First Expense</span>
            </button>
          </div>
        )}

        {viewMode === "filtered-empty" && (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-10 text-center space-y-3">
            <Receipt className="mx-auto h-8 w-8 text-[var(--text-secondary)]" aria-hidden="true" />
            <div>
              <p className="font-display text-sm font-semibold text-[var(--text-primary)]">No matching expenses</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                No transactions match your current search or category filter.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategoryFilter("All");
              }}
              className="inline-flex min-h-[44px] sm:min-h-[38px] items-center rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] px-4 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
            >
              Clear Search &amp; Filters
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddExpense && (
        <AddExpenseModal
          onClose={() => setShowAddExpense(false)}
          onSaved={() => {
            setShowAddExpense(false);
            loadExpenses();
          }}
        />
      )}

      {editingExpense && (
        <AddExpenseModal
          initialExpense={editingExpense}
          onClose={() => setEditingExpense(null)}
          onSaved={() => {
            setEditingExpense(null);
            loadExpenses();
          }}
        />
      )}

      {deletingExpense && (
        <DeleteExpenseModal
          expense={deletingExpense}
          groupName={(deletingExpense as any).groupName}
          onClose={() => setDeletingExpense(null)}
          onDeleted={() => {
            setDeletingExpense(null);
            loadExpenses();
          }}
        />
      )}
    </div>
  );
}
