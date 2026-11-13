"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import PasswordInput from "@/components/auth/PasswordInput";
import SplitRupeeLoader from "@/components/SplitRupeeLoader";
import { KeyRound, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [verifying, setVerifying] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [tokenError, setTokenError] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  // 1. Verify token on initial load
  useEffect(() => {
    if (!token) {
      setTokenError("No reset token provided. Please request a new link.");
      setVerifying(false);
      return;
    }

    async function verify() {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setTokenError("You're offline. Verifying your password reset link requires an internet connection.");
        setVerifying(false);
        return;
      }
      try {
        const res = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token!)}`);
        const data = await res.json();
        if (data.offline) {
          setTokenError("You're offline. Verifying your password reset link requires an internet connection.");
        } else if (!res.ok || !data.ok) {
          setTokenError(data.error || "This reset link is invalid or has expired.");
        } else {
          setUserEmail(data.email || "");
          setUserName(data.name || "");
        }
      } catch (err: any) {
        setTokenError("Failed to verify reset token. Please check your connection.");
      } finally {
        setVerifying(false);
      }
    }

    verify();
  }, [token]);

  // 2. Handle password update
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!newPassword || newPassword.length < 4) {
      setFormError("Password must be at least 4 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setFormError("You're offline. Updating your password requires an internet connection.");
      return;
    }

    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword: newPassword.trim(),
        }),
      });

      const data = await res.json();
      if (data.offline) {
        throw new Error("You're offline. Updating your password requires an internet connection.");
      }
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to update password");
      }

      setSuccess("Your password has been updated successfully! Redirecting to sign in...");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: any) {
      setFormError(err.message || "Failed to reset password");
    } finally {
      setSubmitting(false);
    }
  }

  if (verifying) {
    return (
      <div className="w-full max-w-[440px] rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center shadow-[var(--shadow-popover)]">
        <SplitRupeeLoader variant="modal" text="SplitRupee" subtext="Verifying reset link..." />
      </div>
    );
  }

  // Token is invalid or expired
  if (tokenError) {
    return (
      <div className="w-full max-w-[440px] rounded-2xl border border-[var(--status-negative-border)] bg-[var(--bg-surface)] p-7 sm:p-8 shadow-[var(--shadow-popover)] text-center space-y-5 animate-in fade-in duration-150">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--status-negative-bg)] border border-[var(--status-negative-border)] text-[var(--status-negative)]">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">Reset Link Expired</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">
            {tokenError}
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/forgot-password"
            className="w-full h-11 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-xs sm:text-sm font-semibold text-[var(--brand-ink)] transition-colors inline-flex items-center justify-center gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            <span>Request New Reset Link</span>
          </Link>
        </div>
        <div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[440px] rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-[var(--shadow-popover)] animate-in fade-in duration-150">
      <div className="space-y-5">
        <div className="text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--status-positive-bg)] border border-[var(--status-positive-border)] text-[var(--brand-dark)] dark:text-[var(--brand-primary)] mb-3">
            <KeyRound className="h-5 w-5" />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            Set New Password
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
            Create a secure new password for account{" "}
            <span className="font-semibold text-[var(--brand-dark)] dark:text-[var(--brand-primary)]">{userEmail || userName}</span>
          </p>
        </div>

        {formError && (
          <div
            role="alert"
            className="rounded-xl border border-[var(--status-negative-border)] bg-[var(--status-negative-bg)] p-3 text-xs text-[var(--status-negative)] text-center"
          >
            {formError}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="rounded-xl border border-[var(--status-positive-border)] bg-[var(--status-positive-bg)] p-3 text-xs text-[var(--status-positive)] text-center flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordInput
            id="new-password"
            label="New Password"
            required
            placeholder="Enter new password (min. 4 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            disabled={submitting || Boolean(success)}
          />

          <PasswordInput
            id="confirm-new-password"
            label="Confirm New Password"
            required
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            disabled={submitting || Boolean(success)}
          />

          <button
            type="submit"
            disabled={submitting || Boolean(success)}
            className="w-full h-11 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-xs sm:text-sm font-semibold text-[var(--brand-ink)] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Updating password...</span>
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4" />
                <span>Update Password &amp; Log In</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-1">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brand-dark)] dark:text-[var(--brand-primary)] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<SplitRupeeLoader variant="page" text="SplitRupee" subtext="Loading..." />}>
        <ResetPasswordContent />
      </Suspense>
    </AuthLayout>
  );
}
