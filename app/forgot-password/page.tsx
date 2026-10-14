"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthInput from "@/components/auth/AuthInput";
import PasswordInput from "@/components/auth/PasswordInput";
import {
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSendReset(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier.trim()) {
      setError("Please enter your registered email or mobile number.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No account found with this email or mobile number.");
      }
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Failed to process recovery request");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      setError("Password must be at least 4 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          newPassword: newPassword.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to update password");
      }
      setSuccess("Your password has been reset successfully! Redirecting to sign in...");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-[460px] rounded-[24px] border-2 border-[#10b981] bg-[#0b1329] p-6 sm:p-9 shadow-[0_0_30px_rgba(16,185,129,0.35),0_20px_45px_rgba(0,0,0,0.8)] backdrop-blur-xl animate-in fade-in duration-200">
        {step === 1 ? (
          /* Step 1: Request Reset Instructions */
          <div className="space-y-6">
            {/* 1. Recovery Key Icon */}
            <div className="text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-bold mb-3 shadow-md shadow-emerald-500/25">
                <KeyRound className="h-5 w-5" />
              </div>

              {/* 2. Heading */}
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Forgot Your Password?
              </h1>

              {/* 3. Supporting Text */}
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                No worries. Enter your registered email or mobile number to get started.
              </p>
            </div>

            {/* Error Feedback */}
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 text-center animate-in fade-in"
              >
                {error}
              </div>
            )}

            {/* 4. Form */}
            <form onSubmit={handleSendReset} className="space-y-4">
              {/* 4 & 5. Label and Identifier Input */}
              <AuthInput
                id="recovery-identifier"
                label="Email or Mobile Number"
                type="text"
                required
                placeholder="Enter your registered email or mobile number"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                disabled={loading}
              />

              {/* 6. Primary Button */}
              <button
                type="submit"
                disabled={loading}
                className="submit-button"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4" />
                    <span>Send Reset Instructions</span>
                  </>
                )}
              </button>
            </form>

            {/* 7. Secondary Link: Back to Sign In */}
            <div className="text-center pt-1">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:underline transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>

            {/* 8. Optional Muted Helper Text */}
            <div className="pt-2 border-t border-white/5 text-center text-[11px] text-slate-400">
              Secure account recovery · SplitRupee
            </div>
          </div>
        ) : (
          /* Step 2: Set New Password */
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-bold mb-3 shadow-md shadow-emerald-500/25">
                <KeyRound className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Set New Password
              </h1>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Enter your new password for account{" "}
                <span className="font-semibold text-emerald-400">{identifier}</span>
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 text-center animate-in fade-in"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-300 text-center flex items-center justify-center gap-2 animate-in fade-in"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <PasswordInput
                id="new-password"
                label="New Password"
                required
                placeholder="Enter new password (min. 4 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                disabled={loading || Boolean(success)}
              />

              <PasswordInput
                id="confirm-new-password"
                label="Confirm New Password"
                required
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                disabled={loading || Boolean(success)}
              />

              <button
                type="submit"
                disabled={loading || Boolean(success)}
                className="submit-button"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Updating password...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4" />
                    <span>Update Password & Log In</span>
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-1">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:underline transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
