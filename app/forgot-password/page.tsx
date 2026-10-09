"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/userContext";
import {
  KeyRound,
  ArrowRight,
  CheckCircle2,
  ArrowLeft,
  Mail,
  Lock,
  Loader2,
  Smartphone,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { login } = useUser();
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [channel, setChannel] = useState("Email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSendReset(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier.trim()) {
      setError("Please enter your registered Email or Mobile number");
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
        throw new Error(data.error || "No account found with this email/phone");
      }
      setChannel(data.channel || "Email");
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Failed to send reset instructions");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
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
          otp: otp.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to update password");
      }
      setSuccess("Password updated successfully! Redirecting to login...");
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
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6 animate-in fade-in duration-300">
      <div className="rounded-3xl border border-white/10 bg-slate-900/95 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {step === 1 ? "Reset your password" : "Set new password"}
          </h1>
          <p className="text-xs text-slate-400">
            {step === 1
              ? "Enter your registered Email or WhatsApp phone number"
              : `Verification code sent to your registered ${channel} (${identifier})`}
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 text-center font-semibold">
            {success}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendReset} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Registered Email or Mobile Number
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. aarav@example.com or 9876543210"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:opacity-95 transition"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              <span>Send Reset Instructions</span>
            </button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Log in
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 text-center">
              Use test verification OTP: <span className="font-bold font-mono">1234</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Enter 4-Digit OTP
              </label>
              <input
                type="text"
                required
                maxLength={4}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="1234"
                className="w-full text-center tracking-widest text-base font-mono font-bold rounded-xl border border-white/10 bg-white/5 py-2 text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:opacity-95 transition"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              <span>Save Password & Log In</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
