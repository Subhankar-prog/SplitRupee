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
  Cloud,
} from "lucide-react";
import type { MemberDTO } from "@/lib/types";
import type { Transfer } from "@/lib/debt";
import { formatINR, roundFigure } from "@/lib/money";
import { addOfflinePayment, getCachedGroup } from "@/lib/offlineSync";

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

  // Role resolution: Server-backed creatorId check or ADMIN role check
  const isAdmin = useMemo(() => {
    if (!currentUser) return false;
    if (groupCreatorId && currentUser.id === groupCreatorId) return true;
    const currentMember = members.find((m) => m.id === currentUser.id);
    return currentMember?.role === "ADMIN";
  }, [currentUser, groupCreatorId, members]);

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
    defaultAmount && defaultAmount > 0 ? roundFigure(defaultAmount).toString() : ""
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
      setAmount(roundFigure(defaultAmount).toString());
    }
    setManualUpiOverride(null);
    setError("");
  }, [defaultPayerId, defaultReceiverId, defaultAmount, members]);

  const [paymentMethod, setPaymentMethod] = useState<"upi" | "cash">("upi");
  const [manualUpiOverride, setManualUpiOverride] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [offlineNotice, setOfflineNotice] = useState("");
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

  // Standard UPI URI format (NPCI specification with whole round figure)
  const upiUri = useMemo(() => {
    if (!isValidUPI || numAmount <= 0) return "";
    const rounded = roundFigure(numAmount);
    return `upi://pay?pa=${encodeURIComponent(effectiveUPI)}&pn=${encodeURIComponent(
      receiver?.name || "Friend"
    )}&am=${rounded}&cu=INR&tn=SplitRupee%20Settlement`;
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
      setAmount(roundFigure(matching.amountPaise / 100).toString());
    } else {
      const debt = balances[newPayerId] ?? 0;
      if (debt < 0) {
        setAmount(roundFigure(Math.abs(debt) / 100).toString());
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
      setAmount(roundFigure(matching.amountPaise / 100).toString());
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

    const saveOfflineCashFallback = (msg: string) => {
      const receiverNetPaise = balances[receiverId] ?? 0;
      if (!isAdmin) {
        if (payerNetPaise >= 0) {
          setError("Payer does not have an outstanding debt in this group");
          setLoading(false);
          return;
        }
        if (receiverNetPaise <= 0) {
          setError("Receiver is not entitled to receive payments in this group");
          setLoading(false);
          return;
        }
        const debtRupees = Math.abs(payerNetPaise) / 100;
        if (roundFigure(numAmount) > roundFigure(debtRupees)) {
          setError(`Payment amount ₹${roundFigure(numAmount)} exceeds payer's remaining debt of ₹${roundFigure(debtRupees)}`);
          setLoading(false);
          return;
        }
      }

      const cachedGrp = getCachedGroup(groupId);
      addOfflinePayment({
        groupId,
        groupName: cachedGrp?.name || "Group",
        payerId,
        payerName: payer?.name || "Payer",
        receiverId,
        receiverName: receiver?.name || "Receiver",
        amount: roundFigure(numAmount),
        notes: notes.trim() || undefined,
        callerId: currentUser?.id,
        idempotencyKey: attemptToken,
      });

      setOfflineNotice(msg);
      setLoading(false);
      setTimeout(() => {
        onSettled();
      }, 1200);
    };

    setError("");
    setLoading(true);

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      saveOfflineCashFallback("Settlement saved locally (Offline mode). Balances updated & will sync when online.");
      return;
    }

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
      if (data?.offline) {
        saveOfflineCashFallback("Connection unavailable: Settlement saved locally. It will sync once internet is restored.");
        return;
      }
      if (!res.ok || !data.ok) {
        const errorMsg =
          data.issues && Array.isArray(data.issues) && data.issues.length > 0
            ? data.issues[0]
            : data.error || "Failed to record payment";
        throw new Error(errorMsg);
      }

      onSettled();
    } catch (err: any) {
      if (
        (typeof navigator !== "undefined" && !navigator.onLine) ||
        err.message?.includes("Failed to fetch") ||
        err.message?.includes("network")
      ) {
        saveOfflineCashFallback("Connection lost: Settlement saved locally. It will sync once online.");
        return;
      }
      setError(err.message || "Failed to record settlement");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[var(--overlay-backdrop)] p-0 sm:p-4 backdrop-blur-sm overflow-hidden animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-6 shadow-popover max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto"
      >
        <div className="sm:hidden flex justify-center mb-2 -mt-1">
          <div className="h-1 w-10 rounded-full bg-[var(--border-strong)]" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="font-display text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[var(--brand-primary)]" />
              Settle Up with UPI / Cash
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Pay directly via UPI or record an offline cash payment
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
          {offlineNotice && (
            <div className="rounded-xl border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] p-3 text-xs text-[var(--status-warning)] flex items-center gap-2">
              <Cloud className="h-4 w-4 shrink-0" />
              <span>{offlineNotice}</span>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-[var(--status-negative-border)] bg-[var(--status-negative-bg)] p-3 text-xs text-[var(--status-negative)] flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Transfer Direction Banner */}
          <div className="rounded-xl border border-[var(--status-positive-border)] bg-[var(--status-positive-bg)] p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <ArrowRight className="h-4 w-4 text-[var(--status-positive)] shrink-0" />
              <div className="truncate">
                <span className="text-xs font-semibold text-[var(--text-primary)] tracking-wide truncate">
                  {payer?.name || "Payer"} → {receiver?.name || "Receiver"}
                </span>
                <span className="font-display text-xs font-semibold text-[var(--status-positive)] ml-1.5 tabular-nums">
                  · {numAmount > 0 ? formatINR(numAmount) : "₹0.00"}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-[var(--status-positive)] uppercase tracking-wider shrink-0 ml-2 bg-[var(--bg-surface)] px-2 py-0.5 rounded-full border border-[var(--status-positive-border)]">
              Direction
            </span>
          </div>

          {/* Role Status Note */}
          {!isAdmin && (
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)] bg-[var(--bg-surface-secondary)] rounded-xl px-3 py-2 border border-[var(--border-subtle)]">
              <Lock className="h-3.5 w-3.5 text-[var(--brand-primary)] shrink-0" />
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
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--status-warning)] bg-[var(--status-warning-bg)] rounded-xl px-3 py-2 border border-[var(--status-warning-border)]">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              <span>Group Admin Mode: You have permission to select eligible payers and receivers.</span>
            </div>
          )}

          {/* Payer and Receiver Selection */}
          <div className="grid grid-cols-11 items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-3">
            <div className="col-span-5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Payer (Who pays)
                </label>
                {!isAdmin && <Lock className="h-3 w-3 text-[var(--text-secondary)]" />}
              </div>
              <select
                value={payerId}
                disabled={!isAdmin}
                onChange={(e) => handlePayerChange(e.target.value)}
                className={`mt-1 h-9 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 text-xs font-medium text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)] ${
                  !isAdmin ? "opacity-75 cursor-not-allowed" : ""
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
              <ArrowRight className="h-4 w-4 text-[var(--brand-primary)]" />
            </div>

            <div className="col-span-5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Receiver (Gets paid)
                </label>
                {!isAdmin && <Lock className="h-3 w-3 text-[var(--text-secondary)]" />}
              </div>
              <select
                value={receiverId}
                disabled={!isAdmin}
                onChange={(e) => handleReceiverChange(e.target.value)}
                className={`mt-1 h-9 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 text-xs font-medium text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)] ${
                  !isAdmin ? "opacity-75 cursor-not-allowed" : ""
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
              <label className="text-xs font-medium text-[var(--text-secondary)]">Amount Paid (₹)</label>
              {maxOutstandingRupees > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(String(roundFigure(maxOutstandingRupees)))}
                  className="text-[11px] font-medium text-[var(--brand-dark)] dark:text-[var(--brand-primary)] hover:underline"
                >
                  Pay Full ({formatINR(maxOutstandingRupees)})
                </button>
              )}
            </div>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--text-secondary)] font-semibold">
                ₹
              </span>
              <input
                type="number"
                step="any"
                min="0.01"
                max={!isAdmin && maxOutstandingRupees > 0 ? maxOutstandingRupees : undefined}
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  refreshAttemptToken();
                }}
                required
                className="h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] pl-8 pr-4 font-display text-base font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/70 outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--status-positive-bg)] tabular-nums transition-colors"
              />
            </div>
          </div>

          {/* Payment Method Switcher Tabs */}
          <div className="flex rounded-xl bg-[var(--bg-surface-secondary)] p-1 border border-[var(--border-subtle)] text-xs font-medium">
            <button
              type="button"
              onClick={() => setPaymentMethod("upi")}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                paymentMethod === "upi"
                  ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-card"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Instant UPI & QR</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("cash")}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                paymentMethod === "cash"
                  ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-card"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Banknote className="h-3.5 w-3.5" />
              <span>Record Cash Settlement</span>
            </button>
          </div>

          {/* TAB 1: UPI Instant Pay Card */}
          {paymentMethod === "upi" && receiver && (
            <div className="rounded-2xl border border-[var(--status-positive-border)] bg-[var(--bg-surface-secondary)] p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--brand-dark)] dark:text-[var(--brand-primary)]">
                  <Smartphone className="h-4 w-4" />
                  <span>Instant UPI Settlement</span>
                </div>
                {effectiveUPI && (
                  <button
                    type="button"
                    onClick={handleCopyUPI}
                    className="flex items-center gap-1 text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {copiedUPI ? <Check className="h-3 w-3 text-[var(--status-positive)]" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedUPI ? "Copied" : effectiveUPI}</span>
                  </button>
                )}
              </div>

              {/* Receiver UPI Input with live validation */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                    {receiver.name}&apos;s UPI ID (VPA):
                  </label>
                  {upiSavedMsg && (
                    <span className="text-[10px] text-[var(--status-positive)] font-semibold">
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
                    className="h-9 flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-xs font-mono text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/70 outline-none focus:border-[var(--brand-primary)] transition-colors"
                  />
                  {effectiveUPI && effectiveUPI !== receiver.upiId && (
                    <button
                      type="button"
                      disabled={isSavingUPI}
                      onClick={handleSaveReceiverUPI}
                      className="h-9 px-3 rounded-xl text-[11px] font-semibold bg-[var(--status-positive-bg)] text-[var(--status-positive)] hover:opacity-90 border border-[var(--status-positive-border)] transition-opacity shrink-0"
                    >
                      {isSavingUPI ? "Saving..." : "Save UPI"}
                    </button>
                  )}
                </div>

                {!isValidUPI && (
                  <div className="rounded-xl border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] p-2.5 text-[11px] text-[var(--status-warning)]">
                    {receiver.name} has not linked a valid UPI ID yet. Enter their verified handle above or switch to &ldquo;Record Cash Settlement&rdquo;.
                  </div>
                )}

                {/* Quick handle helpers */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-[var(--text-secondary)]">Quick append:</span>
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
                        className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--brand-primary)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
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
                  <div className="bg-white p-2 rounded-xl border border-[#E6E9E3] shrink-0">
                    <img
                      src={qrCodeUrl}
                      alt="UPI QR Code"
                      className="h-28 w-28 object-contain"
                    />
                  </div>

                  <div className="space-y-2 text-left w-full">
                    <p className="text-xs text-[var(--text-secondary)]">
                      Scan with <span className="font-semibold text-[var(--text-primary)]">GPay, PhonePe, Paytm, BHIM</span> or tap below on your mobile:
                    </p>
                    <a
                      href={upiUri}
                      className="w-full inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--brand-dark)] dark:bg-[var(--brand-primary)] text-xs font-semibold text-white dark:text-[#171F1D] hover:opacity-95 transition-opacity"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Pay ₹{roundFigure(numAmount)} via UPI App</span>
                    </a>
                    <p className="text-[10px] text-[var(--text-secondary)]">
                      Paying to: <span className="font-mono text-[var(--brand-dark)] dark:text-[var(--brand-primary)]">{effectiveUPI}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Cash Payment Details */}
          {paymentMethod === "cash" && (
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-4 text-xs text-[var(--text-secondary)] space-y-2">
              <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                <Banknote className="h-4 w-4 text-[var(--brand-primary)]" />
                <span>Offline / Cash Settlement</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Record an in-person cash handover or direct bank transfer. This will immediately deduct{" "}
                <span className="font-semibold text-[var(--text-primary)] tabular-nums">₹{numAmount > 0 ? roundFigure(numAmount) : "0"}</span> from{" "}
                {payer?.name}&apos;s debt and adjust {receiver?.name}&apos;s credit in the group ledger.
              </p>
            </div>
          )}

          {/* Notes Input */}
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Notes / Payment Reference</label>
            <input
              type="text"
              placeholder="e.g. Paid via Google Pay / Paytm / Cash handover"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/70 outline-none focus:border-[var(--brand-primary)] transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || numAmount <= 0}
              className="flex-1 h-10 rounded-xl bg-[var(--brand-dark)] dark:bg-[var(--brand-primary)] text-xs font-semibold text-white dark:text-[#171F1D] hover:opacity-95 disabled:opacity-50 transition-opacity"
            >
              {loading ? "Recording..." : "Record as Settled"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
