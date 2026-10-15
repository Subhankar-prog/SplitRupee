"use client";

import { useState } from "react";
import { LogOut, AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleExit = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/groups/${groupId}/members?userId=${encodeURIComponent(currentUserId)}&removedById=${encodeURIComponent(currentUserId)}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.message || data.error || "Failed to exit group");
      }

      onExited();
    } catch (err: any) {
      setError(err.message || "An error occurred while exiting the group");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <LogOut className="h-5 w-5" />
            </span>
            <h3 className="text-lg font-bold text-white">Exit Group</h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Message */}
        <div className="space-y-3 text-sm">
          <p className="text-slate-300">
            Are you sure you want to leave <strong className="text-white font-semibold">{groupName}</strong>?
          </p>

          {/* Admin Random Promotion Note */}
          {isAdmin && memberCount > 1 && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Admin Reassignment Notice</span>
              </div>
              <p className="text-amber-300/90 leading-relaxed">
                You are currently a Group Admin. When you exit, a remaining member will be <strong>randomly promoted to Group Admin</strong> to keep the group operational.
              </p>
            </div>
          )}

          {/* Balance Status Warning */}
          {userBalance < -1 && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-rose-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Outstanding Debt Warning</span>
              </div>
              <p className="text-rose-300/90 leading-relaxed">
                You currently owe <strong className="text-white font-mono">₹{Math.abs(Math.round(userBalance)).toLocaleString()}</strong> in this group. It is strongly recommended to settle up with your group before leaving.
              </p>
            </div>
          )}

          {userBalance > 1 && (
            <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-cyan-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Receivable Balance Warning</span>
              </div>
              <p className="text-cyan-300/90 leading-relaxed">
                You are owed <strong className="text-white font-mono">₹{Math.round(userBalance).toLocaleString()}</strong> by other members. Exiting will remove your access to live balance tracking.
              </p>
            </div>
          )}

          {Math.abs(userBalance) <= 1 && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>All settled up! You have zero outstanding debts in this group.</span>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExit}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-600/30 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            <span>Confirm & Exit Group</span>
          </button>
        </div>
      </div>
    </div>
  );
}
