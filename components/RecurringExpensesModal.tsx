"use client";

import React, { useId, useState, useEffect, useRef } from "react";
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
import { useDialogAccessibility } from "@/components/ui/primitives";

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
  const baseId = useId();
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
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError("You're offline. Loading recurring expense rules requires an internet connection.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/recurring`);
      const data = await res.json();
      if (data.offline) {
        setError("You're offline. Loading recurring expense rules requires an internet connection.");
      } else if (data.ok && Array.isArray(data.recurring)) {
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
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError("You're offline. Creating a recurring rule requires an internet connection.");
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
      if (json.offline) {
        throw new Error("You're offline. Creating a recurring rule requires an internet connection.");
      }
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
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError("You're offline. Deleting a recurring rule requires an internet connection.");
      return;
    }
    try {
      const res = await fetch(`/api/groups/${groupId}/recurring?ruleId=${ruleId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.offline) {
        setError("You're offline. Deleting a recurring rule requires an internet connection.");
        return;
      }
      if (res.ok && json.ok) {
        setRecurringList((prev) => prev.filter((r) => r.id !== ruleId));
      }
    } catch (e) {
      console.error("[Delete Recurring] Failed:", e);
    }
  }

  const { currentUser } = useUser();
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useDialogAccessibility(isOpen, onClose, dialogRef);

  if (!isOpen) return null;

  if (!currentUser?.isPro) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-backdrop)] p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="relative w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-center space-y-4 shadow-popover"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-3 right-3 h-11 w-11 sm:h-8 sm:w-8 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-surface-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="mx-auto h-11 w-11 rounded-xl bg-[var(--status-warning-bg)] border border-[var(--status-warning-border)] text-[var(--status-warning)] grid place-items-center">
            <Repeat className="h-5 w-5" />
          </div>
          <h3 id={titleId} className="font-display text-lg font-semibold text-[var(--text-primary)]">SplitRupee Pro Feature</h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Automated recurring expenses (Flat Rent, Cook Salary, Maid, Wi-Fi) are exclusively available for Pro members.
          </p>
          <Link
            href="/pro"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center gap-2 w-full rounded-xl bg-[var(--accent-gold)] hover:bg-[var(--accent-gold-hover)] px-4 text-xs font-semibold text-[#171613] transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            <span>Upgrade to Pro</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[var(--overlay-backdrop)] p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-popover flex flex-col max-h-[88vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[var(--status-positive-bg)] border border-[var(--status-positive-border)] grid place-items-center text-[var(--brand-dark)] dark:text-[var(--brand-primary)]">
              <Repeat className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id={titleId} className="font-display text-base font-semibold text-[var(--text-primary)]">
                  Automated Recurring Expenses
                </h3>
                <span className="rounded-full bg-[var(--status-warning-bg)] text-[var(--status-warning)] border border-[var(--status-warning-border)] text-[11px] font-semibold px-2 py-0.5 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" aria-hidden="true" /> PRO
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Monthly rent, maid, cook, Wi-Fi auto-posted on schedule
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="h-11 w-11 sm:h-8 sm:w-8 rounded-lg border border-[var(--border-subtle)] grid place-items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Action to add */}
          {!showAddForm && (
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Active Recurring Rules ({recurringList.length})
              </h4>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="flex h-8 items-center gap-1.5 rounded-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-3 text-xs font-semibold text-[var(--brand-ink)] transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Recurring Bill</span>
              </button>
            </div>
          )}

          {/* Add Form */}
          {showAddForm && (
            <form onSubmit={handleCreate} className="rounded-2xl border border-[var(--status-positive-border)] bg-[var(--bg-surface-secondary)] p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-[var(--brand-dark)] dark:text-[var(--brand-primary)] flex items-center gap-1.5">
                  <Repeat className="h-3.5 w-3.5" /> Set Up Recurring Expense
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
              </div>

              {error && (
                <div className="rounded-xl border border-[var(--status-negative-border)] bg-[var(--status-negative-bg)] p-2.5 text-xs text-[var(--status-negative)]">
                  {error}
                </div>
              )}

              {/* Quick Presets */}
              <div>
                <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider block mb-1.5">
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
                        className="flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1 text-[11px] text-[var(--text-primary)] hover:border-[var(--brand-primary)] transition-colors"
                      >
                        <Icon className="h-3 w-3 text-[var(--brand-primary)]" />
                        <span>{p.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <label htmlFor={`${baseId}-title`} className="text-[11px] font-medium text-[var(--text-secondary)]">Bill Title</label>
                  <input
                    id={`${baseId}-title`}
                    type="text"
                    placeholder="e.g. Flat 402 Rent, Cook salary"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="mt-1 h-9 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>
                <div>
                  <label htmlFor={`${baseId}-amount`} className="text-[11px] font-medium text-[var(--text-secondary)]">Amount (₹)</label>
                  <input
                    id={`${baseId}-amount`}
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
                    className="mt-1 h-9 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-xs font-semibold tabular-nums text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>
              </div>

              {/* Paid By & Day of Month */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor={`${baseId}-paidby`} className="text-[11px] font-medium text-[var(--text-secondary)]">Paid By</label>
                  <select
                    id={`${baseId}-paidby`}
                    value={paidById}
                    onChange={(e) => setPaidById(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)]"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor={`${baseId}-day`} className="text-[11px] font-medium text-[var(--text-secondary)]">Post Day of Month</label>
                  <select
                    id={`${baseId}-day`}
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)]"
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
                  className="h-9 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-9 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-4 text-xs font-semibold text-[var(--brand-ink)] transition-colors disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Start Auto-Posting"}
                </button>
              </div>
            </form>
          )}

          {/* List of Recurring Rules */}
          {loading ? (
            <div className="py-8 text-center text-[var(--text-secondary)]">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-[var(--brand-primary)] mb-2" />
              <p className="text-xs">Checking automated recurring schedule...</p>
            </div>
          ) : recurringList.length === 0 && !showAddForm ? (
            <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] p-8 text-center space-y-2">
              <Repeat className="mx-auto h-8 w-8 text-[var(--text-secondary)]" />
              <p className="text-xs font-semibold text-[var(--text-primary)]">No recurring expenses set up yet</p>
              <p className="text-[11px] text-[var(--text-secondary)] max-w-xs mx-auto">
                Automate your monthly flat rent, maid salary, cook wages, and Wi-Fi bills without entering them every month.
              </p>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-3 text-xs font-semibold text-[var(--brand-ink)] transition-colors"
              >
                <Plus className="h-3 w-3" />
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
                    className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-3.5 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-[var(--status-positive-bg)] border border-[var(--status-positive-border)] grid place-items-center text-[var(--status-positive)] shrink-0">
                        <Repeat className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] truncate">
                            {item.title}
                          </h5>
                          <span className="rounded-full bg-[var(--status-positive-bg)] text-[var(--status-positive)] border border-[var(--status-positive-border)] text-[11px] font-semibold px-2 py-0.5">
                            Active
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                          Paid by <strong className="text-[var(--text-primary)]">{item.paidBy.name}</strong> · Day {item.dayOfMonth}th of month
                        </p>
                        <p className="text-[10px] text-[var(--text-secondary)]/85 flex items-center gap-1 mt-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          <span>Next auto-post: {nextDate}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-display text-xs sm:text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                        {formatINR(item.totalAmount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="h-11 w-11 sm:h-8 sm:w-8 rounded-lg border border-[var(--status-negative-border)] bg-[var(--status-negative-bg)] grid place-items-center text-[var(--status-negative)] hover:opacity-90 transition-opacity"
                        aria-label={`Delete recurring rule ${item.title}`}
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
