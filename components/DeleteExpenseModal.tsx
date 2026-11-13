"use client";

import React, { useId, useRef, useState } from "react";
import { useUser } from "@/lib/userContext";
import { Trash2, Cloud } from "lucide-react";
import type { ExpenseDTO } from "@/lib/types";
import { formatINR } from "@/lib/money";
import { addOfflineDeleteExpense } from "@/lib/offlineSync";
import { useDialogAccessibility, ModalPortal } from "@/components/ui/primitives";

export default function DeleteExpenseModal({
  expense,
  groupName,
  onClose,
  onDeleted,
}: {
  expense: ExpenseDTO;
  groupName?: string;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const { currentUser } = useUser();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [offlineNotice, setOfflineNotice] = useState("");

  useDialogAccessibility(true, onClose, dialogRef, loading);

  const queueOfflineDelete = () => {
    addOfflineDeleteExpense({
      expenseId: expense.id,
      groupId: expense.groupId,
      groupName: groupName || (expense as any).groupName || "Group",
      title: expense.title,
      totalAmount: expense.totalAmount,
      deletedById: currentUser?.id || "",
    });
    setOfflineNotice(
      expense.id.startsWith("offline_")
        ? "Removed pending offline expense."
        : "Deleted locally (Offline mode). Balances updated & will sync when online."
    );
    setTimeout(() => {
      onDeleted();
    }, 900);
  };

  async function handleDelete() {
    setError("");
    setLoading(true);

    const isOffline =
      (typeof navigator !== "undefined" && !navigator.onLine) ||
      expense.id.startsWith("offline_");

    if (isOffline) {
      queueOfflineDelete();
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `/api/expenses/${expense.id}?deletedById=${encodeURIComponent(currentUser?.id || "")}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data?.offline) {
        queueOfflineDelete();
        return;
      }
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to delete expense");
      onDeleted();
    } catch (e: any) {
      if (
        (typeof navigator !== "undefined" && !navigator.onLine) ||
        e.message?.includes("Failed to fetch") ||
        e.message?.includes("network")
      ) {
        queueOfflineDelete();
        return;
      }
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[var(--overlay-backdrop)] overscroll-contain touch-none sr-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative w-full max-w-sm max-h-[min(90vh,calc(100dvh-1.5rem))] overflow-y-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-popover outline-none sr-modal-panel"
      >
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--status-negative-bg)] text-[var(--status-negative)] border border-[var(--status-negative-border)]">
            <Trash2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id={titleId} className="font-display text-base font-semibold text-[var(--text-primary)]">Delete Expense</h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Are you sure you want to delete <span className="font-semibold text-[var(--text-primary)]">&ldquo;{expense.title}&rdquo;</span> (<span className="tabular-nums">{formatINR(expense.totalAmount)}</span>)?
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-secondary)]/85">
              This will update balances for everyone in the group and log this action.
            </p>
          </div>
        </div>

        {offlineNotice && (
          <div className="mt-3 rounded-xl border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] p-2.5 text-xs text-[var(--status-warning)] flex items-center gap-2">
            <Cloud className="h-4 w-4 shrink-0" />
            <span>{offlineNotice}</span>
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-xl border border-[var(--status-negative-border)] bg-[var(--status-negative-bg)] p-2.5 text-xs text-[var(--status-negative)]">
            {error}
          </div>
        )}

        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-9 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || !!offlineNotice}
            onClick={handleDelete}
            className="flex-1 h-9 rounded-xl bg-[var(--status-negative)] text-xs font-semibold text-white dark:text-[#171613] hover:opacity-95 disabled:opacity-50 transition-opacity"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  </ModalPortal>
  );
}
