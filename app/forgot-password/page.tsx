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
  Sparkles,
  RefreshCw,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  async function handleSendReset(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!identifier.trim()) {
      setError("Please enter your registered email address or mobile number.");
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

      setSentEmail(data.email || identifier.trim());
      setStep(2);
      setResendCooldown(60);

      // 60-second cooldown timer for resend button
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-[460px] rounded-[24px] border-2 border-[#10b981] bg-[#0b1329] p-6 sm:p-9 shadow-[0_0_30px_rgba(16,185,129,0.35),0_20px_45px_rgba(0,0,0,0.8)] backdrop-blur-xl animate-in fade-in duration-200">
        {step === 1 ? (
          /* Step 1: Request Reset Link */
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-bold mb-3 shadow-md shadow-emerald-500/25">
                <KeyRound className="h-5 w-5" />
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-white">
                Forgot Your Password?
              </h1>

              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Enter your registered email address and we'll send you a secure magic link to reset your password.
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

            <form onSubmit={handleSendReset} className="space-y-4">
              <AuthInput
                id="recovery-identifier"
                label="Email or Mobile Number"
                type="text"
                required
                placeholder="Enter your registered email address"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                disabled={loading}
              />

              <button
                type="submit"
                disabled={loading}
                className="submit-button"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sending Magic Link...</span>
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
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:underline transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>

            <div className="pt-2 border-t border-white/5 text-center text-[11px] text-slate-400">
              Powered by Resend Magic Links · SplitRupee Security
            </div>
          </div>
        ) : (
          /* Step 2: Confirmation / Check Inbox */
          <div className="space-y-6 text-center animate-in fade-in duration-300">
            <div className="relative mx-auto flex h-14 w-14 items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-emerald-500/25 blur-lg animate-pulse" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/30">
                <Mail className="h-6 w-6" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Check Your Inbox!
              </h2>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                We sent a secure password reset link to:
              </p>
              <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="truncate max-w-[280px]">{sentEmail}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 font-semibold text-white">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                <span>Next steps:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11.5px] text-slate-400 leading-relaxed pl-1">
                <li>Open your email provider (Gmail, Outlook, etc.).</li>
                <li>Look for an email from <strong>SplitRupee</strong>.</li>
                <li>Click <strong>"Reset My Password"</strong> inside the email.</li>
                <li>This link will safely expire in <strong>15 minutes</strong>.</li>
              </ol>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                disabled={loading || resendCooldown > 0}
                onClick={() => handleSendReset()}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] text-xs font-semibold text-white hover:bg-white/[0.08] hover:border-emerald-500/40 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                ) : (
                  <RefreshCw className={`h-3.5 w-3.5 ${resendCooldown > 0 ? "text-slate-500" : "text-emerald-400"}`} />
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
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
