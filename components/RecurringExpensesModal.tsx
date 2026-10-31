"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/lib/userContext";
import {
  X,
  Repeat,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Home,
  Utensils,
  Zap,
  Wifi,
  Tv,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";
import { formatINR, roundFigure } from "@/lib/money";
import type { MemberDTO } from "@/lib/types";

interface RecurringItem {
  id: string;
  groupId: string;
  paidById: string;
  title: string;
  totalAmount: number;
  currency: string;
  category: string;
  frequency: string;
  dayOfMonth: number;
  notes?: string | null;
  isActive: boolean;
  nextRunAt: string;
  lastRunAt?: string | null;
  paidBy: {
    id: string;
    name: string;
    avatarColor?: string;
  };
}

interface RecurringExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  members: MemberDTO[];
  onExpenseCreated?: () => void;
}

const PRESETS = [
  { title: "Flat Rent", category: "Rent", icon: Home },
  { title: "Cook Salary", category: "Food", icon: Utensils },
  { title: "Maid Salary", category: "Utilities", icon: Zap },
  { title: "High-Speed Wi-Fi", category: "Utilities", icon: Wifi },
  { title: "Netflix / OTT Bundle", category: "Entertainment", icon: Tv },
];

export default function RecurringExpensesModal({
  isOpen,
  onClose,
  groupId,
  groupName,
  members,
  onExpenseCreated,
}: RecurringExpensesModalProps) {
  const [recurringList, setRecurringList] = useState<RecurringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidById, setPaidById] = useState(members[0]?.id || "");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [category, setCategory] = useState("Rent");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && groupId) {
      loadRecurring();
    }
  }, [isOpen, groupId]);

  async function loadRecurring() {
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/recurring`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.recurring)) {
        setRecurringList(data.recurring);
        if (onExpenseCreated) {
          onExpenseCreated();
        }
      }
    } catch (e) {
      console.error("[Load Recurring] Failed:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !amount) {
      setError("Please fill in title and amount");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/groups/${groupId}/recurring`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          totalAmount: roundFigure(parseFloat(amount)),
          paidById: paidById || members[0]?.id,
          dayOfMonth: parseInt(dayOfMonth, 10) || 1,
          frequency: "MONTHLY",
          category,
          notes: notes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || "Failed to create recurring rule");
      }

      // Reset
      setTitle("");
      setAmount("");
      setNotes("");
      setShowAddForm(false);
      loadRecurring();
    } catch (err: any) {
      setError(err.message || "Could not save recurring rule");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(ruleId: string) {
    try {
      await fetch(`/api/groups/${groupId}/recurring?ruleId=${ruleId}`, {
        method: "DELETE",
      });
      setRecurringList((prev) => prev.filter((r) => r.id !== ruleId));
    } catch (e) {
      console.error("[Delete Recurring] Failed:", e);
    }
  }

  const { currentUser } = useUser();

  if (!isOpen) return null;

  if (!currentUser?.isPro) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in">
        <div className="relative w-full max-w-md rounded-3xl border border-purple-500/30 bg-slate-900/98 p-6 text-center space-y-4 shadow-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-xl p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="mx-auto h-12 w-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 grid place-items-center">
            <Repeat className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-white">SplitRupee Pro Feature</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Automated recurring expenses (Flat Rent, Cook Salary, Maid, Wi-Fi) are exclusively available for Pro members.
          </p>
          <Link
            href="/pro"
            onClick={onClose}
            className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-500/20 hover:from-purple-400 hover:to-indigo-500 transition"
          >
            <Sparkles className="h-4 w-4" />
            <span>Upgrade to Pro</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 p-0 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/10 bg-indigo-500/5">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 grid place-items-center text-indigo-400">
              <Repeat className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Automated Recurring Expenses
                </h3>
                <span className="rounded-full bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30 text-[9px] font-extrabold px-1.5 py-0.2 flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" /> PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Monthly rent, maid, cook, Wi-Fi auto-posted on schedule
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full border border-slate-200 dark:border-white/10 grid place-items-center text-slate-400 hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Action to add */}
          {!showAddForm && (
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Recurring Rules ({recurringList.length})
              </h4>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition shadow"
              >
                <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>Add Recurring Bill</span>
              </button>
            </div>
          )}

          {/* Add Form */}
          {showAddForm && (
            <form onSubmit={handleCreate} className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Repeat className="h-3.5 w-3.5" /> Set Up Recurring Expense
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-400">
                  {error}
                </div>
              )}

              {/* Quick Presets */}
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Quick Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESETS.map((p) => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.title}
                        type="button"
                        onClick={() => {
                          setTitle(p.title);
                          setCategory(p.category);
                        }}
                        className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-300 hover:bg-white/10 hover:text-white transition"
                      >
                        <Icon className="h-3 w-3 text-emerald-400" />
                        <span>{p.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-300">Bill Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Flat 402 Rent, Cook salary"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300">Amount (₹)</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    onBlur={() => {
                      if (amount) {
                        const n = parseFloat(amount);
                        if (!isNaN(n)) setAmount(roundFigure(n).toString());
                      }
                    }}
                    required
                    className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-bold text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Paid By & Day of Month */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300">Paid By</label>
                  <select
                    value={paidById}
                    onChange={(e) => setPaidById(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300">Post Day of Month</label>
                  <select
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        {d === 1 ? "1st of every month" : d === 2 ? "2nd of month" : d === 3 ? "3rd of month" : `${d}th of month`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Start Auto-Posting"}
                </button>
              </div>
            </form>
          )}

          {/* List of Recurring Rules */}
          {loading ? (
            <div className="py-8 text-center text-slate-400">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-400 mb-2" />
              <p className="text-xs">Checking automated recurring schedule...</p>
            </div>
          ) : recurringList.length === 0 && !showAddForm ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center space-y-2">
              <Repeat className="mx-auto h-8 w-8 text-slate-600" />
              <p className="text-xs font-semibold text-slate-300">No recurring expenses set up yet</p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Automate your monthly flat rent, maid salary, cook wages, and Wi-Fi bills without entering them every month.
              </p>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400"
              >
                <Plus className="h-3 w-3 stroke-[2.5]" />
                <span>Add First Recurring Bill</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recurringList.map((item) => {
                const nextDate = new Date(item.nextRunAt).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 hover:border-white/20 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 grid place-items-center text-emerald-400 shrink-0">
                        <Repeat className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs sm:text-sm font-bold text-white truncate">
                            {item.title}
                          </h5>
                          <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-1.5 py-0.2">
                            Active
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Paid by <strong className="text-slate-300">{item.paidBy.name}</strong> · Day {item.dayOfMonth}th of month
                        </p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="h-2.5 w-2.5 text-slate-400" />
                          <span>Next auto-post: {nextDate}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs sm:text-sm font-extrabold text-white tabular-nums">
                        {formatINR(item.totalAmount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="h-8 w-8 rounded-lg border border-rose-500/20 bg-rose-500/10 grid place-items-center text-rose-400 hover:bg-rose-500/20 transition"
                        title="Delete recurring rule"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
