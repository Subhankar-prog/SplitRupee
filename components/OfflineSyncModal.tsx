"use client";

import React, { useEffect, useState } from "react";
import {
  CloudUpload,
  RotateCw,
  CheckCircle2,
  X,
  AlertCircle,
  Receipt,
  Calendar,
  Layers
} from "lucide-react";
import {
  getOfflineQueue,
  syncOfflineQueue,
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
          text: `Data saved! All ${res.syncedCount} expense(s) synced successfully to SplitRupee server.`,
          type: "success"
        });
        setTimeout(() => {
          setIsOpen(false);
          setStatusMessage(null);
          setSyncing(false);
        }, 1200);
      } else {
        setStatusMessage({
          text: `Synced ${res.syncedCount} expense(s). Some items failed: ${res.errors.join(", ")}`,
          type: "error"
        });
        setSyncing(false);
      }
    } catch (err: any) {
      setStatusMessage({
        text: err.message || "Failed to sync offline expenses",
        type: "error"
      });
      setSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Confirmation Modal — Pops up directly when online */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
                  <CloudUpload className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Sync Offline Expenses?
                  </h3>
                  <p className="text-xs text-slate-400">
                    Your internet connection is active
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                disabled={syncing}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Status Message */}
            {statusMessage && (
              <div
                className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 border ${
                  statusMessage.type === "success"
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                    : "bg-rose-500/15 border-rose-500/30 text-rose-300"
                }`}
              >
                {statusMessage.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Confirmation Question */}
            <div className="space-y-3">
              <p className="text-sm text-slate-300 leading-relaxed">
                You added or modified <strong className="text-white font-semibold">{queue.length} expense(s)</strong> while offline. Do you want to sync and record them on the server now?
              </p>

              {/* Items List */}
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {queue.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="p-1.5 rounded-xl bg-slate-800 text-emerald-400">
                        <Receipt className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {item.groupName || "Group"} • {item.isEdit ? "Edited" : "New"}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-emerald-400 shrink-0 ml-3">
                      ₹{Math.round(item.totalAmount).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={syncing}
                className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
              >
                Later
              </button>

              <button
                type="button"
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition disabled:opacity-50"
              >
                {syncing && <RotateCw className="h-4 w-4 animate-spin" />}
                <span>{syncing ? "Syncing..." : "Yes, Sync Now"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
