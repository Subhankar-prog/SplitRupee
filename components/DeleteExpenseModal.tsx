"use client";

import React, { useState } from "react";
import { useUser } from "@/lib/userContext";
import { Trash2, AlertTriangle, X } from "lucide-react";
import type { ExpenseDTO } from "@/lib/types";
import { formatINR } from "@/lib/money";

export default function DeleteExpenseModal({
  expense,
  onClose,
  onDeleted,
}: {
  expense: ExpenseDTO;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const { currentUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(
        `/api/expenses/${expense.id}?deletedById=${encodeURIComponent(currentUser?.id || "")}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to delete expense");
      onDeleted();
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-2xl border border-rose-500/20 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Trash2 className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-white">Delete Expense</h3>
            <p className="mt-1 text-xs text-slate-400">
              Are you sure you want to delete <span className="font-semibold text-slate-200">"{expense.title}"</span> ({formatINR(expense.totalAmount)})?
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              This will update balances for everyone in the group and log this action.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-400">
            {error}
          </div>
        )}

        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleDelete}
            className="flex-1 rounded-xl bg-rose-600 py-2 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-50 transition shadow-lg shadow-rose-600/20"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
