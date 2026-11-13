"use client";

import { useId, useRef, useState } from "react";
import { LogOut, AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";
import { useDialogAccessibility } from "@/components/ui/primitives";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  currentUserId: string;
  isAdmin: boolean;
  memberCount: number;
  userBalance: number; // net balance from ledger
  onExited: () => void;
}

export default function ExitGroupModal({
  isOpen,
  onClose,
  groupId,
  groupName,
  currentUserId,
  isAdmin,
  memberCount,
  userBalance,
  onExited,
}: Props) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useDialogAccessibility(isOpen, onClose, dialogRef, loading);

  if (!isOpen) return null;

  const handleExit = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError("You're offline. Exiting a group requires an internet connection.");
      return;
    }
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/groups/${groupId}/members?userId=${encodeURIComponent(currentUserId)}&removedById=${encodeURIComponent(currentUserId)}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.offline) {
        throw new Error("You're offline. Exiting a group requires an internet connection.");
      }
      if (!res.ok || !data.ok) {
        throw new Error(data.message || data.error || "Failed to exit group");
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("splitrupee_refresh", { detail: { groupId } }));
      }

      onExited();
    } catch (err: any) {
      setError(err.message || "An error occurred while exiting the group");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay-backdrop)] sr-modal-backdrop"
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
        className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-popover space-y-5 outline-none sr-modal-panel"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[var(--status-negative-bg)] text-[var(--status-negative)] border border-[var(--status-negative-border)]">
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </span>
            <h3 id={titleId} className="font-display text-base font-semibold text-[var(--text-primary)]">Exit Group</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close modal"
            className="grid h-11 w-11 sm:h-8 sm:w-8 place-items-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] transition-colors"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Message */}
        <div className="space-y-3 text-sm">
          <p className="text-[var(--text-secondary)]">
            Are you sure you want to leave <strong className="text-[var(--text-primary)] font-semibold">{groupName}</strong>?
          </p>

          {/* Admin Random Promotion Note */}
          {isAdmin && memberCount > 1 && (
            <div className="p-3.5 rounded-xl bg-[var(--status-warning-bg)] border border-[var(--status-warning-border)] text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-[var(--status-warning)]">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Admin Reassignment Notice</span>
              </div>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                You are currently a Group Admin. When you exit, a remaining member will be <strong className="text-[var(--text-primary)]">randomly promoted to Group Admin</strong> to keep the group operational.
              </p>
            </div>
          )}

          {/* Balance Status Warning */}
          {userBalance < -1 && (
            <div className="p-3.5 rounded-xl bg-[var(--status-negative-bg)] border border-[var(--status-negative-border)] text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-[var(--status-negative)]">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Outstanding Debt Warning</span>
              </div>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                You currently owe <strong className="text-[var(--text-primary)] font-display tabular-nums">₹{Math.abs(Math.round(userBalance)).toLocaleString()}</strong> in this group. It is strongly recommended to settle up with your group before leaving.
              </p>
            </div>
          )}

          {userBalance > 1 && (
            <div className="p-3.5 rounded-xl bg-[var(--status-positive-bg)] border border-[var(--status-positive-border)] text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-[var(--status-positive)]">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Receivable Balance Warning</span>
              </div>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                You are owed <strong className="text-[var(--text-primary)] font-display tabular-nums">₹{Math.round(userBalance).toLocaleString()}</strong> by other members. Exiting will remove your access to live balance tracking.
              </p>
            </div>
          )}

          {Math.abs(userBalance) <= 1 && (
            <div className="p-3 rounded-xl bg-[var(--status-positive-bg)] border border-[var(--status-positive-border)] text-[var(--status-positive)] text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>All settled up! You have zero outstanding debts in this group.</span>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-[var(--status-negative-bg)] border border-[var(--status-negative-border)] text-[var(--status-negative)] text-xs">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-9 px-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExit}
            disabled={loading}
            className="inline-flex h-9 items-center justify-center gap-2 px-4 rounded-xl bg-[var(--status-negative)] hover:opacity-95 text-white dark:text-[#171613] text-xs font-semibold transition-opacity disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
            <span>Confirm & Exit Group</span>
          </button>
        </div>
      </div>
    </div>
  );
}
