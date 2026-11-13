"use client";

import React, { useEffect, useState } from "react";
import {
  CloudUpload,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Trash2,
  Edit3
} from "lucide-react";
import { ModalShell } from "@/components/ui/primitives";
import {
  getOfflineQueue,
  syncOfflineQueue,
  resolveOfflineActionType,
  OfflineExpenseItem
} from "@/lib/offlineSync";

export default function OfflineSyncModal() {
  const [queue, setQueue] = useState<OfflineExpenseItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Load queue on mount & listen to changes
  useEffect(() => {
    // 1. Initial check: If online and there are pending offline expenses, prompt directly!
    const q = getOfflineQueue();
    setQueue(q);
    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
    if (isOnline && q.length > 0) {
      setIsOpen(true);
    }

    const updateQueue = () => {
      const currentQ = getOfflineQueue();
      setQueue(currentQ);
      // If we are currently online and new offline items exist, show sync prompt
      if (typeof navigator !== "undefined" && navigator.onLine && currentQ.length > 0) {
        setIsOpen(true);
      }
    };

    window.addEventListener("splitrupee_offline_queue_changed", updateQueue);

    // 2. When connection is restored and queue is not empty, prompt user directly for confirmation
    const handleOnline = () => {
      const onlineQ = getOfflineQueue();
      setQueue(onlineQ);
      if (onlineQ.length > 0) {
        setIsOpen(true);
      }
    };

    // 3. When offline, do not keep sync modal open
    const handleOffline = () => {
      setIsOpen(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("splitrupee_offline_queue_changed", updateQueue);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleSync = async () => {
    if (syncing) return;
    try {
      setSyncing(true);
      setStatusMessage(null);
      const res = await syncOfflineQueue();

      if (res.errors.length === 0) {
        setStatusMessage({
          text: `All saved! ${res.syncedCount} expense(s) updated across your groups.`,
          type: "success"
        });
        setTimeout(() => {
          setIsOpen(false);
          setStatusMessage(null);
          setSyncing(false);
        }, 1200);
      } else {
        setStatusMessage({
          text: `Updated ${res.syncedCount} expense(s). Some items couldn't be saved: ${res.errors.join(", ")}`,
          type: "error"
        });
        setSyncing(false);
      }
    } catch (err: any) {
      setStatusMessage({
        text: err.message || "We couldn't update your expenses. Please try again.",
        type: "error"
      });
      setSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={() => {
        if (!syncing) setIsOpen(false);
      }}
      title={
        <span className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-[var(--status-positive-bg)] text-[var(--status-positive)] border border-[var(--status-positive-border)]">
            <CloudUpload className="h-4 w-4" aria-hidden="true" />
          </span>
          <span>Update Saved Expenses?</span>
        </span>
      }
      subtitle="You're back online"
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4">
        {/* Status Message */}
        {statusMessage && (
          <div
            role={statusMessage.type === "error" ? "alert" : "status"}
            className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 border ${
              statusMessage.type === "success"
                ? "bg-[var(--status-positive-bg)] border-[var(--status-positive-border)] text-[var(--status-positive)]"
                : "bg-[var(--status-negative-bg)] border-[var(--status-negative-border)] text-[var(--status-negative)]"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Confirmation Question */}
        <div className="space-y-3">
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            You recorded <strong className="text-[var(--text-primary)] font-semibold">{queue.length} offline change(s)</strong>. Do you want to update your groups now?
          </p>

          {/* Items List */}
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {queue.map((item) => {
              const actionType = resolveOfflineActionType(item);
              const badge =
                actionType === "DELETE_EXPENSE"
                  ? "Deleted Expense"
                  : actionType === "UPDATE_EXPENSE"
                    ? "Edited Expense"
                    : actionType === "CREATE_PAYMENT"
                      ? "Cash Settlement"
                      : "New Expense";
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="p-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--brand-primary)]">
                      {actionType === "DELETE_EXPENSE" ? (
                        <Trash2 className="h-4 w-4 text-[var(--status-negative)]" aria-hidden="true" />
                      ) : actionType === "UPDATE_EXPENSE" ? (
                        <Edit3 className="h-4 w-4 text-[var(--status-warning)]" aria-hidden="true" />
                      ) : actionType === "CREATE_PAYMENT" ? (
                        <CheckCircle2 className="h-4 w-4 text-[var(--status-positive)]" aria-hidden="true" />
                      ) : (
                        <Receipt className="h-4 w-4" aria-hidden="true" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[var(--text-primary)] break-words line-clamp-2 leading-tight">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-[var(--text-secondary)] break-words mt-0.5">
                        {item.groupName || "Group"} • {badge}
                      </p>
                    </div>
                  </div>
                  <span className="font-display tabular-nums font-semibold text-[var(--status-positive)] shrink-0 ml-3">
                    ₹{Math.round(item.totalAmount).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            disabled={syncing}
            className="cursor-pointer h-10 px-4 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors disabled:opacity-50"
          >
            Later
          </button>

          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="cursor-pointer inline-flex h-10 items-center gap-2 px-4 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-[var(--brand-ink)] font-semibold text-xs transition-colors disabled:opacity-50"
          >
            {syncing && <RotateCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
            <span>{syncing ? "Updating..." : "Update Groups Now"}</span>
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
