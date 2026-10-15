"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useUser } from "@/lib/userContext";
import {
  type ExpenseDTO,
  CATEGORIES,
  type CategoryName,
} from "@/lib/types";
import { formatINR } from "@/lib/money";
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
  Food: { icon: Utensils, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  Rent: { icon: Home, color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20" },
  Travel: { icon: Plane, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  Utilities: { icon: Zap, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
  Shopping: { icon: ShoppingBag, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20" },
  Entertainment: { icon: Film, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
  Miscellaneous: { icon: Shapes, color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/20" },
};

export default function AllExpensesPage() {
  const { currentUser, isLoading: userLoading } = useUser();
  const [expenses, setExpenses] = useState<any[]>(() => getCachedAllExpenses());
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryName | "All">("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(() => getCachedAllExpenses().length === 0);

  // Modals
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseDTO | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<ExpenseDTO | null>(null);

  const loadExpenses = useCallback(async (isInitial = false) => {
    if (!currentUser?.id) {
      const cached = getCachedAllExpenses();
      if (cached.length > 0) setExpenses(cached);
      if (!userLoading) setLoading(false);
      return;
    }
    try {
      if (isInitial && expenses.length === 0) setLoading(true);
      const res = await fetch(`/api/expenses?userId=${encodeURIComponent(currentUser.id)}&_t=${Date.now()}`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.expenses)) {
        setExpenses(data.expenses);
        saveCachedAllExpenses(data.expenses);
      } else {
        const cached = getCachedAllExpenses();
        if (cached.length > 0) setExpenses(cached);
      }
    } catch (e) {
      console.warn("Failed to load all expenses (offline mode active):", e);
      const cached = getCachedAllExpenses();
      if (cached.length > 0) setExpenses(cached);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, userLoading, expenses.length]);

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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Receipt className="h-6 w-6 text-emerald-400" />
            All Expenses
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete chronological expense history across all your shared groups
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3.5 py-1.5 text-right">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Shown</p>
            <p className="text-sm font-bold text-white tabular-nums">{formatINR(totalSum)}</p>
          </div>
          <button
            onClick={() => setShowAddExpense(true)}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 active:scale-95 transition"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, payer, or group name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {(["All", ...CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                categoryFilter === cat
                  ? "border-emerald-500 bg-emerald-500/15 text-emerald-300"
                  : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
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
              className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden hover:border-white/20 transition"
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
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white truncate">{exp.title}</h4>
                      {exp.groupName && (
                        <Link
                          href={`/groups/${exp.groupId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-emerald-400 hover:bg-emerald-500/10 transition"
                        >
                          {exp.groupName}
                        </Link>
                      )}
                    </div>
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
                    <p className="font-semibold text-slate-400 mb-2">Split Breakdown:</p>
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

        {filtered.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center">
            <Receipt className="mx-auto h-8 w-8 text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-white">No expenses found</p>
            <p className="text-xs text-slate-400 mt-1">
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
