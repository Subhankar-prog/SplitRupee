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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl border border-rose-500/30 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-2xl space-y-5 animate-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3.5">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-lg shadow-rose-500/10">
            <LogOut className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-base font-bold text-white tracking-tight">
              Log Out of SplitRupee?
            </h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              {userName ? `Hey ${userName}, are` : "Are"} you sure you want to end your active session? You will need to log in again to access your shared groups and expenses.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-500/25 active:scale-95 transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Yes, Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
