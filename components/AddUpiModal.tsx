"use client";

import React, { useState } from "react";
import { X, QrCode, CheckCircle2, Loader2, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { useUser } from "@/lib/userContext";

interface AddUpiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddUpiModal({ isOpen, onClose }: AddUpiModalProps) {
  const { currentUser, refreshUsers } = useUser();
  const [upiId, setUpiId] = useState(currentUser?.upiId || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  if (!isOpen || !currentUser) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const clean = upiId.trim();

    if (!clean) {
      setError("Please enter your UPI ID");
      return;
    }

    if (!clean.includes("@") || clean.indexOf("@") === 0 || clean.indexOf("@") === clean.length - 1) {
      setError("Please enter a valid UPI ID format (e.g. username@okhdfcbank, mobile@paytm)");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          upiId: clean,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to update UPI ID");
      }

      await refreshUsers();
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to save UPI ID");
    } finally {
      setLoading(false);
    }
  }

  const quickHandles = ["@okhdfcbank", "@okaxis", "@paytm", "@ybl", "@ibl"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-emerald-500/25 bg-slate-900 p-6 sm:p-7 shadow-2xl space-y-5 relative">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                Add UPI ID for Instant Settlements
              </h3>
              <p className="text-xs text-slate-400">
                Friends can settle their debts to you in 1-click
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-xl bg-white/5 text-slate-400 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Benefits Alert */}
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-3 text-[11.5px] text-amber-200/90 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-amber-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Why is this important?</span>
          </div>
          <p className="leading-relaxed text-[11px] text-amber-200/80">
            When group members settle up, SplitRupee generates direct Google Pay / PhonePe / Paytm deep-links with your UPI ID prefilled.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-400">
            {error}
          </div>
        )}

        {saved ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/15 p-6 text-center space-y-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
            <p className="text-sm font-bold text-white">UPI ID Saved Successfully!</p>
            <p className="text-xs text-emerald-300/80">One-tap settlements are now active on your account.</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="upi-input" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Your UPI ID (VPA)
              </label>
              <div className="relative">
                <input
                  id="upi-input"
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. rahul@okhdfcbank or 9876543210@paytm"
                  className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:bg-white/[0.08] transition pr-10"
                  autoFocus
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <QrCode className="h-4 w-4" />
                </div>
              </div>

              {/* Quick Handle Suggestions */}
              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                <span className="text-[10px] text-slate-400">Popular:</span>
                {quickHandles.map((handle) => (
                  <button
                    key={handle}
                    type="button"
                    onClick={() => {
                      const prefix = upiId.includes("@") ? upiId.split("@")[0] : upiId || (currentUser.name || "user").toLowerCase().replace(/\s+/g, "");
                      setUpiId(prefix + handle);
                    }}
                    className="text-[10px] rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-slate-300 hover:border-emerald-500/40 hover:text-emerald-300 transition"
                  >
                    {handle}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
              >
                Later
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 py-2.5 text-xs font-bold text-slate-950 hover:from-emerald-400 hover:to-teal-300 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Save UPI ID</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        <div className="pt-2 border-t border-white/5 flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Your UPI ID is only used to receive settlements directly into your bank.</span>
        </div>
      </div>
    </div>
  );
}
