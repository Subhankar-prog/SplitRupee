"use client";

import React, { useState } from "react";
import { useUser } from "@/lib/userContext";
import {
  X,
  ArrowRight,
  CheckCircle2,
  QrCode,
  ExternalLink,
  Smartphone,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
import type { MemberDTO } from "@/lib/types";

export default function SettleUpModal({
  groupId,
  members,
  defaultPayerId,
  defaultReceiverId,
  defaultAmount,
  onClose,
  onSettled,
}: {
  groupId: string;
  members: (MemberDTO & { upiId?: string | null })[];
  defaultPayerId?: string;
  defaultReceiverId?: string;
  defaultAmount?: number;
  onClose: () => void;
  onSettled: () => void;
}) {
  const { currentUser } = useUser();
  const [payerId, setPayerId] = useState<string>(
    defaultPayerId || currentUser?.id || members[0]?.id || ""
  );
  const [receiverId, setReceiverId] = useState<string>(
    defaultReceiverId || members.find((m) => m.id !== payerId)?.id || members[1]?.id || ""
  );
  const [amount, setAmount] = useState<string>(
    defaultAmount && defaultAmount > 0 ? (defaultAmount / 100).toFixed(2) : ""
  );
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedUPI, setCopiedUPI] = useState(false);

  const payer = members.find((m) => m.id === payerId);
  const receiver = members.find((m) => m.id === receiverId);

  const numAmount = parseFloat(amount) || 0;
  const receiverUPI = (receiver as any)?.upiId || `${receiver?.name.toLowerCase().replace(/\s+/g, "")}@upi`;

  // Standard UPI URI format
  const upiUri = `upi://pay?pa=${encodeURIComponent(receiverUPI)}&pn=${encodeURIComponent(
    receiver?.name || "Friend"
  )}&am=${numAmount > 0 ? numAmount.toFixed(2) : "0.00"}&cu=INR&tn=SplitRupee%20Settlement`;

  // Google Charts QR code API (SVG/PNG)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    upiUri
  )}`;

  async function handleCopyUPI() {
    try {
      await navigator.clipboard.writeText(receiverUPI);
      setCopiedUPI(true);
      setTimeout(() => setCopiedUPI(false), 2000);
    } catch {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!numAmount || numAmount <= 0) {
      setError("Please enter a valid payment amount");
      return;
    }
    if (payerId === receiverId) {
      setError("Payer and receiver cannot be the same person");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          payerId,
          receiverId,
          amount: numAmount,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to record payment");
      }

      onSettled();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 p-0 sm:p-4 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-white/10 bg-slate-900/98 p-4 sm:p-6 shadow-2xl backdrop-blur-2xl max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto">
        <div className="sm:hidden flex justify-center mb-2 -mt-1">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              Settle Up with UPI / Cash
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pay directly via UPI or record an offline cash payment
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
              {error}
            </div>
          )}

          {/* Payer and Receiver Selection */}
          <div className="grid grid-cols-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="col-span-5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Payer (Who paid)
              </label>
              <select
                value={payerId}
                onChange={(e) => setPayerId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-2.5 py-2 text-xs font-medium text-white outline-none focus:border-emerald-500"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.id === currentUser?.id ? "(You)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-1 grid place-items-center pt-5">
              <ArrowRight className="h-4 w-4 text-emerald-400" />
            </div>

            <div className="col-span-5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Receiver (To whom)
              </label>
              <select
                value={receiverId}
                onChange={(e) => setReceiverId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-2.5 py-2 text-xs font-medium text-white outline-none focus:border-emerald-500"
              >
                {members
                  .filter((m) => m.id !== payerId)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.id === currentUser?.id ? "(You)" : ""}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-semibold text-slate-300">Amount Paid (₹)</label>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-bold">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-8 pr-4 text-base font-semibold text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* UPI Instant Pay Card */}
          {numAmount > 0 && receiver && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                  <Smartphone className="h-4 w-4" />
                  <span>Instant UPI Settlement</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUPI}
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white"
                >
                  {copiedUPI ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedUPI ? "Copied" : receiverUPI}</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                <div className="bg-white p-2 rounded-xl shrink-0 shadow-md">
                  <img
                    src={qrCodeUrl}
                    alt="UPI QR Code"
                    className="h-28 w-28 object-contain"
                  />
                </div>

                <div className="space-y-2 text-left w-full">
                  <p className="text-xs text-slate-300">
                    Scan with <span className="font-bold text-white">GPay, PhonePe, Paytm,</span> or click below on mobile:
                  </p>
                  <a
                    href={upiUri}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 py-2 text-xs font-bold text-slate-950 hover:opacity-95 transition shadow"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Pay ₹{numAmount.toFixed(2)} via UPI App</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-300">Notes / Payment Reference</label>
            <input
              type="text"
              placeholder="e.g. Paid via Google Pay / Paytm / Cash"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition shadow-lg shadow-emerald-500/20"
            >
              {loading ? "Recording..." : "Record as Settled"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
