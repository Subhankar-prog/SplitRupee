"use client";

import React, { useId, useState } from "react";
import { QrCode, CheckCircle2, Loader2, ArrowRight, ShieldCheck, Trash2 } from "lucide-react";
import { useUser } from "@/lib/userContext";
import { ModalShell } from "@/components/ui/primitives";

interface AddUpiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddUpiModal({ isOpen, onClose }: AddUpiModalProps) {
  const { currentUser, setCurrentUser, refreshUsers } = useUser();
  const upiInputId = useId();
  const [upiId, setUpiId] = useState(currentUser?.upiId || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    if (isOpen && currentUser) {
      setUpiId(currentUser.upiId || "");
      setError("");
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !currentUser) return null;

  async function handleDelete() {
    if (!currentUser) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          upiId: null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to remove UPI ID");
      }

      setUpiId("");
      if (data.user) {
        setCurrentUser(data.user);
      }
      if (data.user) {
        setCurrentUser(data.user);
      }
      await refreshUsers();
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to remove UPI ID");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) {
      setError("Please log in to update your UPI ID");
      return;
    }
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

      if (data.user) {
        setCurrentUser(data.user);
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
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] text-[var(--status-warning)]">
            <QrCode className="h-4 w-4" aria-hidden="true" />
          </span>
          <span>Add UPI ID for Instant Settlements</span>
        </span>
      }
      subtitle="Friends can settle their debts to you in 1 click"
      maxWidthClass="max-w-md"
    >
      <div className="space-y-5">
        {/* Benefits Alert */}
        <div className="rounded-2xl border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] p-3 text-xs text-[var(--text-primary)] space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-[var(--status-warning)]">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Why is this important?</span>
          </div>
          <p className="leading-relaxed text-[11px] text-[var(--text-secondary)]">
            When group members settle up, SplitRupee generates direct Google Pay, PhonePe, or Paytm payment links with your UPI ID prefilled.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-[var(--status-negative-border)] bg-[var(--status-negative-bg)] p-2.5 text-xs text-[var(--status-negative)]"
          >
            {error}
          </div>
        )}

        {saved ? (
          <div
            role="status"
            className="rounded-2xl border border-[var(--status-positive-border)] bg-[var(--status-positive-bg)] p-6 text-center space-y-2"
          >
            <CheckCircle2 className="h-8 w-8 text-[var(--status-positive)] mx-auto" aria-hidden="true" />
            <p className="font-display text-sm font-semibold text-[var(--text-primary)]">UPI ID Saved Successfully!</p>
            <p className="text-xs text-[var(--text-secondary)]">One-tap settlements are now active on your account.</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor={upiInputId} className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Your UPI ID (VPA)
              </label>
              <div className="relative">
                <input
                  id={upiInputId}
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. name@okhdfcbank or 9876543210@paytm"
                  className="h-10 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 pr-10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:border-[var(--brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--brand-dark)] dark:focus-visible:ring-[var(--brand-primary)] transition-colors"
                  autoFocus
                />
                <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
                  <QrCode className="h-4 w-4" aria-hidden="true" />
                </div>
              </div>

              {/* Quick Handle Suggestions */}
              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                <span className="text-[11px] text-[var(--text-secondary)]">Popular:</span>
                {quickHandles.map((handle) => (
                  <button
                    key={handle}
                    type="button"
                    onClick={() => {
                      const prefix = upiId.includes("@") ? upiId.split("@")[0] : upiId || (currentUser.name || "user").toLowerCase().replace(/\s+/g, "");
                      setUpiId(prefix + handle);
                    }}
                    className="cursor-pointer text-[11px] rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] px-2 py-0.5 text-[var(--text-primary)] hover:border-[var(--brand-primary)] transition-colors"
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
                className="cursor-pointer h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] px-4 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                Later
              </button>
              {currentUser.upiId && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="cursor-pointer h-10 rounded-xl border border-[var(--status-negative-border)] bg-[var(--status-negative-bg)] px-3.5 text-xs font-semibold text-[var(--status-negative)] hover:opacity-90 transition-opacity flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Remove UPI</span>
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer flex-1 h-10 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-xs font-semibold text-[var(--brand-ink)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <>
                    <span>Save UPI ID</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
          <ShieldCheck className="h-3.5 w-3.5 text-[var(--status-positive)] shrink-0" aria-hidden="true" />
          <span>Your UPI ID is only used to receive settlements directly into your bank.</span>
        </div>
      </div>
    </ModalShell>
  );
}
