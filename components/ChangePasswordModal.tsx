"use client";

import React, { useId, useState } from "react";
import { Lock, CheckCircle2, Loader2, KeyRound } from "lucide-react";
import { useUser } from "@/lib/userContext";
import { ModalShell } from "@/components/ui/primitives";

interface Props {
  onClose: () => void;
}

export default function ChangePasswordModal({ onClose }: Props) {
  const { currentUser } = useUser();
  const newPassId = useId();
  const confirmPassId = useId();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      setError("New password must be at least 4 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: currentUser?.email || currentUser?.phone || currentUser?.name,
          newPassword: newPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to update password");
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell
      isOpen={true}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--status-positive-border)] bg-[var(--status-positive-bg)] text-[var(--status-positive)]">
            <KeyRound className="h-4 w-4" aria-hidden="true" />
          </span>
          <span>Change Password</span>
        </span>
      }
      subtitle={currentUser?.name ? `Update security credentials for ${currentUser.name}` : "Update your security credentials"}
      maxWidthClass="max-w-md"
    >
      <div className="space-y-5">
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-[var(--status-negative-border)] bg-[var(--status-negative-bg)] p-3 text-xs text-[var(--status-negative)]"
          >
            {error}
          </div>
        )}

        {success ? (
          <div
            role="status"
            className="rounded-2xl border border-[var(--status-positive-border)] bg-[var(--status-positive-bg)] p-5 text-center space-y-2"
          >
            <CheckCircle2 className="h-8 w-8 text-[var(--status-positive)] mx-auto" aria-hidden="true" />
            <p className="font-display text-sm font-semibold text-[var(--text-primary)]">Password Updated!</p>
            <p className="text-xs text-[var(--text-secondary)]">Your new password has been saved securely.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label htmlFor={newPassId} className="block font-medium text-[var(--text-secondary)] mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" aria-hidden="true" />
                <input
                  id={newPassId}
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  className="h-10 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] pl-10 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:border-[var(--brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--brand-dark)] dark:focus-visible:ring-[var(--brand-primary)] transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor={confirmPassId} className="block font-medium text-[var(--text-secondary)] mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" aria-hidden="true" />
                <input
                  id={confirmPassId}
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                  className="h-10 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] pl-10 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:border-[var(--brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--brand-dark)] dark:focus-visible:ring-[var(--brand-primary)] transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer flex-1 h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer flex-1 h-10 flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] font-semibold text-[var(--brand-ink)] disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                <span>Update Password</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </ModalShell>
  );
}
