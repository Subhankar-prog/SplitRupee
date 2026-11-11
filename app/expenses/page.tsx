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
} from "lucide-react";
import AddExpenseModal from "@/components/AddExpenseModal";
import DeleteExpenseModal from "@/components/DeleteExpenseModal";
import SplitRupeeLoader from "@/components/SplitRupeeLoader";
import { getCachedAllExpenses, saveCachedAllExpenses } from "@/lib/offlineSync";

const CATEGORY_STYLE: Record<CategoryName, { icon: typeof Utensils; color: string; bg: string }> = {
  Food: { icon: Utensils, color: "text-[var(--status-warning)]", bg: "bg-[var(--status-warning-bg)] border-[var(--status-warning-border)]" },
  Rent: { icon: Home, color: "text-[var(--brand-dark)] dark:text-[var(--brand-primary)]", bg: "bg-[var(--status-positive-bg)] border-[var(--status-positive-border)]" },
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
      const data = await res.json();
      if (data.ok && Array.isArray(data.expenses)) {
        saveCachedAllExpenses(data.expenses);
        setExpenses(getCachedAllExpenses());
      } else {
        setExpenses(getCachedAllExpenses());
      }
    } catch (e) {
      console.warn("Failed to load all expenses (offline mode active):", e);
      setExpenses(getCachedAllExpenses());
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, userLoading]);

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

  const totalSum = filtered.reduce((acc, curr) => acc + curr.totalAmount, 0);

  if (loading && expenses.length === 0 && currentUser) {
    return (
      <SplitRupeeLoader
        fullScreen={false}
        text="All Expenses"
        subtext="Fetching transactions across your groups..."
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
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
            className="flex h-10 items-center gap-1.5 rounded-xl bg-[var(--brand-dark)] dark:bg-[var(--brand-primary)] px-4 text-xs font-semibold text-white dark:text-[#171F1D] hover:opacity-95 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Search by title, payer, or group name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] pl-10 pr-4 text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/70 outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--status-positive-bg)] transition-colors"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {(["All", ...CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                categoryFilter === cat
                  ? "border-[var(--brand-primary)] bg-[var(--status-positive-bg)] text-[var(--brand-dark)] dark:text-[var(--brand-primary)]"
                  : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses Feed */}
      <div className="space-y-2.5">
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
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)] overflow-hidden hover:border-[var(--border-strong)] transition-colors"
            >
              <div
                onClick={() => setExpandedId(isExpanded ? null : exp.id)}
                className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${style.bg} ${style.color}`}>
                    <Icon className="h-5 w-5" />
                  </span>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-semibold text-[var(--text-primary)] truncate">{exp.title}</h4>
                      {(exp as any).isOfflinePending && (
                        <span className="shrink-0 rounded-full border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--status-warning)]">
                          Pending Sync
                        </span>
                      )}
                      {exp.groupName && (
                        <Link
                          href={`/groups/${exp.groupId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] px-2 py-0.5 text-[10px] font-medium text-[var(--brand-dark)] dark:text-[var(--brand-primary)] hover:border-[var(--brand-primary)] transition-colors"
                        >
                          {exp.groupName}
                        </Link>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 flex flex-wrap items-center gap-1">
                      <span className="font-semibold text-[var(--text-primary)]">{exp.paidBy.name}</span> paid{" "}
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
                  <button type="button" aria-label="Toggle split breakdown" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-4 space-y-3 text-xs animate-in fade-in duration-150">
                  {exp.currency && exp.currency !== "INR" && (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--status-warning-bg)] border border-[var(--status-warning-border)] px-3 py-2 text-xs text-[var(--status-warning)] font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{getCurrency(exp.currency).flag}</span>
                        <span>Foreign Expense: <strong>{exp.originalAmount ? formatCurrencyAmount(exp.originalAmount, exp.currency) : exp.currency}</strong></span>
                      </div>
                      <span className="text-[11px] text-[var(--text-secondary)] tabular-nums">
                        1 {exp.currency} = ₹{exp.exchangeRate?.toFixed(4) || "—"} INR · Recorded in ledger as {formatINR(exp.totalAmount)}
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
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ background: s.user.avatarColor || "#739B83" }}
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
                      className="flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Edit Expense</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingExpense(exp)}
                      className="flex items-center gap-1.5 rounded-xl border border-[var(--status-negative-border)] bg-[var(--status-negative-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--status-negative)] hover:opacity-90 transition-opacity"
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

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-10 text-center">
            <Receipt className="mx-auto h-8 w-8 text-[var(--text-secondary)] mb-2" />
            <p className="font-display text-sm font-semibold text-[var(--text-primary)]">No expenses found</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Try adjusting your search query or category filters.
            </p>
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
