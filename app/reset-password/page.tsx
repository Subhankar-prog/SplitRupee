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
      try {
        const res = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token!)}`);
        const data = await res.json();
        if (!res.ok || !data.ok) {
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
      <div className="w-full max-w-[460px] rounded-[24px] border-2 border-emerald-500/30 bg-[#0b1329] p-8 text-center shadow-2xl backdrop-blur-xl">
        <SplitRupeeLoader fullScreen={false} text="SplitRupee" subtext="Verifying reset link..." />
      </div>
    );
  }

  // Token is invalid or expired
  if (tokenError) {
    return (
      <div className="w-full max-w-[460px] rounded-[24px] border-2 border-rose-500/40 bg-[#0b1329] p-7 sm:p-9 shadow-[0_0_30px_rgba(244,63,94,0.25),0_20px_45px_rgba(0,0,0,0.8)] backdrop-blur-xl text-center space-y-5 animate-in fade-in duration-200">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Reset Link Expired</h2>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            {tokenError}
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/forgot-password"
            className="submit-button w-full inline-flex items-center justify-center gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            <span>Request New Reset Link</span>
          </Link>
        </div>
        <div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[460px] rounded-[24px] border-2 border-[#10b981] bg-[#0b1329] p-6 sm:p-9 shadow-[0_0_30px_rgba(16,185,129,0.35),0_20px_45px_rgba(0,0,0,0.8)] backdrop-blur-xl animate-in fade-in duration-200">
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-bold mb-3 shadow-md shadow-emerald-500/25">
            <KeyRound className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Set New Password
          </h1>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            Create a secure new password for account{" "}
            <span className="font-semibold text-emerald-400">{userEmail || userName}</span>
          </p>
        </div>

        {formError && (
          <div
            role="alert"
            className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 text-center animate-in fade-in"
          >
            {formError}
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
            className="submit-button"
          >
            {submitting ? (
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
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<SplitRupeeLoader fullScreen={false} text="SplitRupee" subtext="Loading..." />}>
        <ResetPasswordContent />
      </Suspense>
    </AuthLayout>
  );
}
