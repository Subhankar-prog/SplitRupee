"use client";

import React, { useState } from "react";
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthInput from "@/components/auth/AuthInput";
import {
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Mail,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Submit Request to /api/auth/forgot-password
  async function handleSendRecovery(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const clean = identifier.trim();
    if (!clean) {
      setError("Please enter your registered email address or mobile number.");
      return;
    }

    const emailCheck = clean.includes("@");
    const cleanPhone = clean.replace(/\D/g, "").slice(-10);

    if (!emailCheck && cleanPhone.length !== 10) {
      setError("Please enter a valid email address or 10-digit mobile number.");
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError("You're offline. Sending a password recovery link requires an internet connection.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: clean }),
      });
      const data = await res.json();

      if (data.offline) {
        throw new Error("You're offline. Sending a password recovery link requires an internet connection.");
      }
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No account found matching this email or mobile number.");
      }

      setSentEmail(data.email || clean);
      setStep(2);
      startCooldown();
    } catch (err: any) {
      setError(err.message || "Failed to send reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function startCooldown() {
    setResendCooldown(60);
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-[440px] rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-[var(--shadow-popover)] animate-in fade-in duration-150">
        {step === 1 && (
          /* STEP 1: Enter Email or Mobile */
          <div className="space-y-5">
            <div className="text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--status-positive-bg)] border border-[var(--status-positive-border)] text-[var(--brand-dark)] dark:text-[var(--brand-primary)] mb-3">
                <KeyRound className="h-5 w-5" />
              </div>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                Forgot Your Password?
              </h1>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                Enter your registered email address or mobile number. We&apos;ll send a secure password reset link to your email.
              </p>
            </div>

            {/* Account Security Notice about 7-Day Limit */}
            <div className="rounded-xl border border-[var(--status-positive-border)] bg-[var(--status-positive-bg)] p-3 text-[11.5px] text-[var(--text-secondary)] flex items-start gap-2.5 text-left leading-relaxed">
              <ShieldCheck className="h-4 w-4 text-[var(--status-positive)] shrink-0 mt-0.5" />
              <span>
                For account protection, password reset requests are limited to <strong className="text-[var(--text-primary)]">once every 7 days</strong>. The secure link sent to your email remains valid for <strong className="text-[var(--text-primary)]">15 minutes</strong>.
              </span>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-[var(--status-negative-border)] bg-[var(--status-negative-bg)] p-3 text-xs text-[var(--status-negative)] text-center leading-relaxed"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSendRecovery} className="space-y-4">
              <AuthInput
                id="recovery-identifier"
                label="Registered Email or Mobile Number"
                type="text"
                required
                placeholder="e.g. name@gmail.com or 9876543210"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                disabled={loading}
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-xs sm:text-sm font-semibold text-[var(--brand-ink)] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying account...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4" />
                    <span>Send Reset Link</span>
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

            <div className="pt-3 border-t border-[var(--border-subtle)] text-center text-[11px] text-[var(--text-secondary)] flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--status-positive)]" />
              <span>Protected by 256-bit encryption · SplitRupee Security</span>
            </div>
          </div>
        )}

        {step === 2 && (
          /* STEP 2: Magic Link Sent Confirmation */
          <div className="space-y-5 text-center animate-in fade-in duration-200">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--status-positive-bg)] border border-[var(--status-positive-border)] text-[var(--brand-dark)] dark:text-[var(--brand-primary)]">
              <Mail className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                Check Your Inbox!
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">
                We sent a secure password reset link to:
              </p>
              <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-[var(--status-positive-border)] bg-[var(--status-positive-bg)] px-3.5 py-1.5 text-xs font-semibold text-[var(--status-positive)]">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span className="break-all">{sentEmail}</span>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-4 text-left space-y-2 text-xs text-[var(--text-secondary)]">
              <div className="font-semibold text-[var(--text-primary)]">Next steps:</div>
              <ol className="list-decimal list-inside space-y-1.5 text-[11.5px] leading-relaxed pl-1">
                <li>Open your email inbox (Gmail, Outlook, Yahoo, etc.).</li>
                <li>Check for an email from <strong className="text-[var(--text-primary)]">SplitRupee</strong>.</li>
                <li>Click the <strong className="text-[var(--text-primary)]">&ldquo;Reset My Password&rdquo;</strong> button inside.</li>
                <li>The link expires in <strong className="text-[var(--text-primary)]">15 minutes</strong> for your security.</li>
              </ol>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-[var(--status-negative-border)] bg-[var(--status-negative-bg)] p-3 text-xs text-[var(--status-negative)] text-center"
              >
                {error}
              </div>
            )}

            <div className="space-y-3 pt-1">
              <button
                type="button"
                disabled={loading || resendCooldown > 0}
                onClick={() => handleSendRecovery()}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[var(--brand-primary)]" />
                ) : (
                  <RefreshCw className={`h-3.5 w-3.5 ${resendCooldown > 0 ? "text-[var(--text-secondary)]" : "text-[var(--brand-primary)]"}`} />
                )}
                <span>
                  {resendCooldown > 0
                    ? `Resend link in ${resendCooldown}s`
                    : "Didn't receive email? Click to resend"}
                </span>
              </button>

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

            <div className="pt-3 border-t border-[var(--border-subtle)] text-center text-[11px] text-[var(--text-secondary)]">
              For security, password reset requests are limited to once every 7 days
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
