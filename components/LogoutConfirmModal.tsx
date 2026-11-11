"use client";

import React from "react";
import { LogOut, X, AlertTriangle } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName?: string;
}

export default function LogoutConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  userName,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#171F1D]/60 dark:bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-sm rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-popover space-y-5 animate-in zoom-in-95 duration-150"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3.5">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--status-negative-bg)] text-[var(--status-negative)] border border-[var(--status-negative-border)]">
            <LogOut className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0 pr-5">
            <h3 className="font-display text-base font-semibold text-[var(--text-primary)] tracking-tight">
              Log Out of SplitRupee?
            </h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">
              {userName ? `Hey ${userName}, are` : "Are"} you sure you want to end your active session? You will need to log in again to access your shared groups and expenses.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] px-4 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[var(--status-negative)] hover:opacity-95 px-4 text-xs font-semibold text-white transition-opacity"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Yes, Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
