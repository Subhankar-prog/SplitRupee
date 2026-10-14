"use client";

import React, { useState, useMemo, useEffect } from "react";
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
  Banknote,
  Lock,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import type { MemberDTO } from "@/lib/types";
import type { Transfer } from "@/lib/debt";
import { formatINR } from "@/lib/money";

interface Props {
  groupId: string;
  members: (MemberDTO & { upiId?: string | null })[];
  groupCreatorId?: string | null;
  transfers?: Transfer[];
  balances?: Record<string, number>; // in paise
  defaultPayerId?: string;
  defaultReceiverId?: string;
  defaultAmount?: number; // in RUPEES
  onClose: () => void;
  onSettled: () => void;
}

export default function SettleUpModal({
  groupId,
  members,
  groupCreatorId,
  transfers = [],
  balances = {},
  defaultPayerId,
  defaultReceiverId,
  defaultAmount,
  onClose,
  onSettled,
}: Props) {
  const { currentUser } = useUser();

  // Role resolution: Server-backed creatorId check
  const isAdmin = useMemo(() => {
    return !!(currentUser && groupCreatorId && currentUser.id === groupCreatorId);
  }, [currentUser, groupCreatorId]);

  // 1. Initial payer:
  // If defaultPayerId was passed (e.g. from 1-Tap Settle or Friends Balances), honor it!
  const initialPayerId = useMemo(() => {
    if (defaultPayerId && members.some((m) => m.id === defaultPayerId)) {
      return defaultPayerId;
    }
    // If ordinary member who owes money, default to currentUser as payer
    if (!isAdmin && currentUser && (balances[currentUser.id] ?? 0) < 0 && members.some((m) => m.id === currentUser.id)) {
      return currentUser.id;
    }
    // Otherwise pick debtor from transfers
    const transferDebtor = transfers.find((t) => members.some((m) => m.id === t.from))?.from;
    if (transferDebtor) return transferDebtor;
    // Or member who owes money
    const debtor = members.find((m) => (balances[m.id] ?? 0) < 0);
    if (debtor) return debtor.id;
    return members[0]?.id || "";
  }, [defaultPayerId, members, isAdmin, currentUser, balances, transfers]);

  // 2. Initial receiver:
  // If defaultReceiverId was passed, honor it!
  const initialReceiverId = useMemo(() => {
    if (defaultReceiverId && defaultReceiverId !== initialPayerId && members.some((m) => m.id === defaultReceiverId)) {
      return defaultReceiverId;
    }
    // Match transfer obligation from initialPayerId
    const matchingTransfer = transfers.find((t) => t.from === initialPayerId && t.to !== initialPayerId);
    if (matchingTransfer && members.some((m) => m.id === matchingTransfer.to)) {
      return matchingTransfer.to;
    }
    // If currentUser is owed money and is not the payer, default receiver to currentUser
    if (currentUser && currentUser.id !== initialPayerId && (balances[currentUser.id] ?? 0) > 0 && members.some((m) => m.id === currentUser.id)) {
      return currentUser.id;
    }
    // Otherwise pick creditor (balance > 0)
    const creditor = members.find((m) => m.id !== initialPayerId && (balances[m.id] ?? 0) > 0);
    if (creditor) return creditor.id;
    // Fallback to any member other than payer
    return members.find((m) => m.id !== initialPayerId)?.id || "";
  }, [defaultReceiverId, initialPayerId, members, transfers, balances, currentUser]);

  // Single authoritative state
  const [payerId, setPayerId] = useState<string>(initialPayerId);
  const [receiverId, setReceiverId] = useState<string>(initialReceiverId);
  const [amount, setAmount] = useState<string>(
    defaultAmount && defaultAmount > 0 ? defaultAmount.toFixed(2) : ""
  );

  // Sync state whenever props change (e.g. clicking different friends in Friends Balances)
  useEffect(() => {
    if (defaultPayerId && members.some((m) => m.id === defaultPayerId)) {
      setPayerId(defaultPayerId);
    }
    if (defaultReceiverId && members.some((m) => m.id === defaultReceiverId) && defaultReceiverId !== defaultPayerId) {
      setReceiverId(defaultReceiverId);
    }
    if (defaultAmount && defaultAmount > 0) {
      setAmount(defaultAmount.toFixed(2));
    }
    setManualUpiOverride(null);
    setError("");
  }, [defaultPayerId, defaultReceiverId, defaultAmount, members]);

  const [paymentMethod, setPaymentMethod] = useState<"upi" | "cash">("upi");
  const [manualUpiOverride, setManualUpiOverride] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedUPI, setCopiedUPI] = useState(false);
  const [isSavingUPI, setIsSavingUPI] = useState(false);
  const [upiSavedMsg, setUpiSavedMsg] = useState("");
  const [attemptToken, setAttemptToken] = useState(() => `attempt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`);

  const refreshAttemptToken = () => setAttemptToken(`attempt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`);

  // Synchronously resolved members (Source of truth: member IDs)
  const payer = useMemo(() => members.find((m) => m.id === payerId), [members, payerId]);
  const receiver = useMemo(() => members.find((m) => m.id === receiverId), [members, receiverId]);

  // Synchronously resolved UPI ID:
  // Immediate resolution with zero delay or race condition
  const defaultReceiverUPI = (receiver?.upiId || "").trim();
  const effectiveUPI = (manualUpiOverride !== null ? manualUpiOverride : defaultReceiverUPI).trim();
  const isValidUPI =
    effectiveUPI.includes("@") &&
    effectiveUPI.length >= 5 &&
    !effectiveUPI.endsWith("@upi") &&
    !effectiveUPI.includes("aarav@okaxis");

  const numAmount = parseFloat(amount) || 0;

  // Outstanding debt limit for current payer
  const payerNetPaise = balances[payerId] ?? 0;
  const maxOutstandingRupees =
    payerNetPaise < 0
      ? Math.abs(payerNetPaise) / 100
      : (defaultAmount && defaultAmount > 0 ? defaultAmount : 0);

  // Standard UPI URI format (NPCI specification)
  const upiUri = useMemo(() => {
    if (!isValidUPI || numAmount <= 0) return "";
    return `upi://pay?pa=${encodeURIComponent(effectiveUPI)}&pn=${encodeURIComponent(
      receiver?.name || "Friend"
    )}&am=${numAmount.toFixed(2)}&cu=INR&tn=SplitRupee%20Settlement`;
  }, [isValidUPI, effectiveUPI, receiver, numAmount]);

  // Real-time QR Code generation
  const qrCodeUrl = useMemo(() => {
    if (!upiUri) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUri)}`;
  }, [upiUri]);

  // When payer changes:
  function handlePayerChange(newPayerId: string) {
    if (!isAdmin) return; // Ordinary members locked
    setPayerId(newPayerId);
    setError("");
    setManualUpiOverride(null);
    refreshAttemptToken();

    // Auto-select valid creditor for this payer
    const matching = transfers.find((t) => t.from === newPayerId);
    let newReceiverId = matching ? matching.to : "";
    if (!newReceiverId || newReceiverId === newPayerId) {
      newReceiverId =
        members.find((m) => m.id !== newPayerId && (balances[m.id] ?? 0) > 0)?.id ||
        members.find((m) => m.id !== newPayerId)?.id ||
        "";
    }
    setReceiverId(newReceiverId);

    // Auto-fill permissible obligation amount
    if (matching && matching.amountPaise > 0) {
      setAmount((matching.amountPaise / 100).toFixed(2));
    } else {
      const debt = balances[newPayerId] ?? 0;
      if (debt < 0) {
        setAmount((Math.abs(debt) / 100).toFixed(2));
      }
    }
  }

  // When receiver changes:
  function handleReceiverChange(newReceiverId: string) {
    if (!isAdmin) return; // Ordinary members locked
    setReceiverId(newReceiverId);
    setError("");
    // Synchronously resets manual override so new receiver's VPA appears immediately
    setManualUpiOverride(null);
    refreshAttemptToken();

    // Update suggested amount for this specific transfer if known
    const matching = transfers.find((t) => t.from === payerId && t.to === newReceiverId);
    if (matching) {
      setAmount((matching.amountPaise / 100).toFixed(2));
    }
  }

  async function handleCopyUPI() {
    if (!effectiveUPI) return;
    try {
      await navigator.clipboard.writeText(effectiveUPI);
      setCopiedUPI(true);
      setTimeout(() => setCopiedUPI(false), 2000);
    } catch {}
  }

  async function handleSaveReceiverUPI() {
    if (!receiverId || !effectiveUPI) return;
    setIsSavingUPI(true);
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: receiverId, upiId: effectiveUPI }),
      });
      const data = await res.json();
      if (data.ok) {
        setUpiSavedMsg("Saved to profile!");
        if (receiver) (receiver as any).upiId = effectiveUPI;
        setTimeout(() => setUpiSavedMsg(""), 3000);
      }
    } catch (e) {
      console.error("Failed to save UPI ID", e);
    } finally {
      setIsSavingUPI(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!numAmount || numAmount <= 0) {
      setError("Please enter a valid positive payment amount");
      return;
    }
    if (payerId === receiverId) {
      setError("Payer and receiver cannot be the same person");
      return;
    }

    // Role check: Must be the paying debtor, the receiving creditor, or group admin
    const isParty = currentUser && (payerId === currentUser.id || receiverId === currentUser.id);
    if (!isAdmin && !isParty) {
      setError("You are only permitted to record settlements where you are the payer, receiver, or group admin.");
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
          callerId: currentUser?.id,
          idempotencyKey: attemptToken,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        const errorMsg =
          data.issues && Array.isArray(data.issues) && data.issues.length > 0
            ? data.issues[0]
            : data.error || "Failed to record payment";
        throw new Error(errorMsg);
      }

      onSettled();
    } catch (err: any) {
      setError(err.message || "Failed to record settlement");
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

        {/* Modal Header */}
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
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Transfer Direction Banner */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <ArrowRight className="h-4 w-4 text-emerald-400 shrink-0" />
              <div className="truncate">
                <span className="text-xs font-bold text-white tracking-wide truncate">
                  {payer?.name || "Payer"} → {receiver?.name || "Receiver"}
                </span>
                <span className="text-xs font-extrabold text-emerald-300 ml-1.5 tabular-nums">
                  · {numAmount > 0 ? formatINR(numAmount) : "₹0.00"}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider shrink-0 ml-2 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
              Direction
            </span>
          </div>

          {/* Role Status Note */}
          {!isAdmin && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-white/5 rounded-xl px-3 py-1.5 border border-white/5">
              <Lock className="h-3 w-3 text-emerald-400 shrink-0" />
              <span>
                {payerId === currentUser?.id
                  ? "Standard Member: You are recording your payment to clear your debt."
                  : receiverId === currentUser?.id
                  ? `Standard Member: You are recording a payment received from ${payer?.name || "debtor"}.`
                  : "Standard Member: Payer & Receiver are locked to this authentic obligation."}
              </span>
            </div>
          )}
          {isAdmin && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-300/90 bg-amber-500/10 rounded-xl px-3 py-1.5 border border-amber-500/20">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
              <span>Group Admin Mode: You have permission to select eligible payers and receivers.</span>
            </div>
          )}

          {/* Payer and Receiver Selection */}
          <div className="grid grid-cols-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="col-span-5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Payer (Who pays)
                </label>
                {!isAdmin && <Lock className="h-3 w-3 text-slate-500" />}
              </div>
              <select
                value={payerId}
                disabled={!isAdmin}
                onChange={(e) => handlePayerChange(e.target.value)}
                className={`mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-2.5 py-2 text-xs font-medium text-white outline-none focus:border-emerald-500 ${
                  !isAdmin ? "opacity-75 cursor-not-allowed bg-slate-950/60" : ""
                }`}
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
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Receiver (Gets paid)
                </label>
                {!isAdmin && <Lock className="h-3 w-3 text-slate-500" />}
              </div>
              <select
                value={receiverId}
                disabled={!isAdmin}
                onChange={(e) => handleReceiverChange(e.target.value)}
                className={`mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-2.5 py-2 text-xs font-medium text-white outline-none focus:border-emerald-500 ${
                  !isAdmin ? "opacity-75 cursor-not-allowed bg-slate-950/60" : ""
                }`}
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

          {/* Amount Input */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Amount Paid (₹)</label>
              {maxOutstandingRupees > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(maxOutstandingRupees.toFixed(2))}
                  className="text-[10px] text-emerald-400 hover:underline"
                >
                  Pay Full ({formatINR(maxOutstandingRupees)})
                </button>
              )}
            </div>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-bold">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={maxOutstandingRupees > 0 ? maxOutstandingRupees : undefined}
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  refreshAttemptToken();
                }}
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-8 pr-4 text-base font-semibold text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 tabular-nums"
              />
            </div>
          </div>

          {/* Payment Method Switcher Tabs */}
          <div className="flex rounded-xl bg-white/5 p-1 border border-white/10 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setPaymentMethod("upi")}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
                paymentMethod === "upi"
                  ? "bg-emerald-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Instant UPI & QR</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("cash")}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
                paymentMethod === "cash"
                  ? "bg-emerald-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Banknote className="h-3.5 w-3.5" />
              <span>Record Cash Settlement</span>
            </button>
          </div>

          {/* TAB 1: UPI Instant Pay Card */}
          {paymentMethod === "upi" && receiver && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                  <Smartphone className="h-4 w-4" />
                  <span>Instant UPI Settlement</span>
                </div>
                {effectiveUPI && (
                  <button
                    type="button"
                    onClick={handleCopyUPI}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white transition"
                  >
                    {copiedUPI ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedUPI ? "Copied" : effectiveUPI}</span>
                  </button>
                )}
              </div>

              {/* Receiver UPI Input with live validation */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-300">
                    {receiver.name}'s UPI ID (VPA):
                  </label>
                  {upiSavedMsg && (
                    <span className="text-[10px] text-emerald-400 font-semibold animate-pulse">
                      ✓ {upiSavedMsg}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={effectiveUPI}
                    onChange={(e) => setManualUpiOverride(e.target.value.toLowerCase().trim())}
                    placeholder="e.g. 6372466462@ybl, name@okhdfcbank"
                    className="flex-1 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs font-mono text-emerald-300 placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                  {effectiveUPI && effectiveUPI !== receiver.upiId && (
                    <button
                      type="button"
                      disabled={isSavingUPI}
                      onClick={handleSaveReceiverUPI}
                      className="px-2.5 py-2 rounded-xl text-[10px] font-bold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 transition shrink-0"
                    >
                      {isSavingUPI ? "Saving..." : "Save UPI"}
                    </button>
                  )}
                </div>

                {!isValidUPI && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-[11px] text-amber-300">
                    💡 {receiver.name} has not linked a valid UPI ID yet. Enter their verified handle above or switch to "Record Cash Settlement".
                  </div>
                )}

                {/* Quick handle helpers */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-slate-400">Quick append:</span>
                  {[
                    { label: "PhonePe (@ybl)", suffix: "@ybl" },
                    { label: "Paytm (@paytm)", suffix: "@paytm" },
                    { label: "GPay (@okaxis)", suffix: "@okaxis" },
                    { label: "HDFC (@okhdfcbank)", suffix: "@okhdfcbank" },
                  ].map((s) => {
                    const phoneBase = receiver.phone?.replace(/\D/g, "").slice(-10) || "6372466462";
                    const candidate = effectiveUPI.includes("@")
                      ? effectiveUPI.split("@")[0] + s.suffix
                      : (effectiveUPI || phoneBase) + s.suffix;
                    return (
                      <button
                        key={s.suffix}
                        type="button"
                        onClick={() => setManualUpiOverride(candidate)}
                        className="rounded-lg border border-white/10 bg-white/5 hover:bg-emerald-500/15 hover:border-emerald-500/30 px-2 py-0.5 text-[10px] text-slate-300 hover:text-emerald-300 transition"
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic QR Code & Mobile Deep Link */}
              {isValidUPI && numAmount > 0 && (
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
                      Scan with <span className="font-bold text-white">GPay, PhonePe, Paytm, BHIM</span> or tap below on your mobile:
                    </p>
                    <a
                      href={upiUri}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 py-2.5 text-xs font-bold text-slate-950 hover:opacity-95 transition shadow-lg shadow-emerald-500/20"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Pay ₹{numAmount.toFixed(2)} via UPI App</span>
                    </a>
                    <p className="text-[10px] text-slate-400">
                      Paying to: <span className="font-mono text-emerald-300">{effectiveUPI}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Cash Payment Details */}
          {paymentMethod === "cash" && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-white">
                <Banknote className="h-4 w-4 text-emerald-400" />
                <span>Offline / Cash Settlement</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Record an in-person cash handover or direct bank transfer. This will immediately deduct{" "}
                <span className="font-bold text-white">₹{numAmount > 0 ? numAmount.toFixed(2) : "0.00"}</span> from{" "}
                {payer?.name}'s debt and adjust {receiver?.name}'s credit in the group ledger.
              </p>
            </div>
          )}

          {/* Notes Input */}
          <div>
            <label className="text-xs font-semibold text-slate-300">Notes / Payment Reference</label>
            <input
              type="text"
              placeholder="e.g. Paid via Google Pay / Paytm / Cash handover"
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
              className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || numAmount <= 0}
              className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition shadow-lg shadow-emerald-500/20"
            >
              {loading ? "Recording..." : "Record as Settled"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
