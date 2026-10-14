"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthInput from "@/components/auth/AuthInput";
import PasswordInput from "@/components/auth/PasswordInput";
import {
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Mail,
  Smartphone,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [isEmail, setIsEmail] = useState(true);

  // Flow Steps:
  // 1: Enter email or phone
  // 2: Email sent confirmation (for email users)
  // 3: Enter SMS OTP (for phone users)
  // 4: Set new password (for phone users after OTP verified)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sentEmail, setSentEmail] = useState("");

  // Phone OTP State
  const [otpCode, setOtpCode] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Initialize Firebase App when script loads
  function initFirebase() {
    if (typeof window !== "undefined" && window.firebase && !window.firebase.apps?.length) {
      const config = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCVlK9D89f4q-DKrPkzYewA2Ye6Qp_u5oM",
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "splitrupee.firebaseapp.com",
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "splitrupee",
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "splitrupee.firebasestorage.app",
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "487628112425",
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:487628112425:web:0f90eb45af74bcab17d238",
      };
      try {
        window.firebase.initializeApp(config);
      } catch (e) {
        console.error("Firebase init:", e);
      }
    }
  }

  // Handle Step 1 Submit: Determine Email vs Phone
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

    setError("");
    setLoading(true);

    // CASE 1: EMAIL USER -> Send Magic Link via Resend
    if (emailCheck) {
      setIsEmail(true);
      try {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: clean }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.error || "No account found with this email address.");
        }

        setSentEmail(data.email || clean);
        setStep(2);
        startCooldown();
      } catch (err: any) {
        setError(err.message || "Failed to send reset link");
      } finally {
        setLoading(false);
      }
      return;
    }

    // CASE 2: PHONE USER -> Send SMS OTP via Firebase Phone Auth
    setIsEmail(false);
    initFirebase();

    if (typeof window === "undefined" || !window.firebase?.auth) {
      setError("Phone SMS service is initializing. Please try again in a few seconds.");
      setLoading(false);
      return;
    }

    try {
      // Create invisible reCAPTCHA if not already created
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new window.firebase.auth.RecaptchaVerifier(
          "recaptcha-container",
          { size: "invisible" }
        );
      }

      const formattedPhone = `+91${cleanPhone}`;
      const confirmationResult = await window.firebase
        .auth()
        .signInWithPhoneNumber(formattedPhone, window.recaptchaVerifier);

      window.confirmationResult = confirmationResult;
      setVerifiedPhone(cleanPhone);
      setStep(3); // Go to OTP verification step
      startCooldown();
    } catch (err: any) {
      console.error("Firebase phone auth error:", err);
      // Reset reCAPTCHA on error
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        } catch {}
      }
      setError(err.message || "Failed to send SMS OTP. Please check the mobile number.");
    } finally {
      setLoading(false);
    }
  }

  // Handle Step 3: Verify Phone SMS OTP
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setError("Please enter the 6-digit OTP code sent to your mobile.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      if (!window.confirmationResult) {
        throw new Error("Session expired. Please request a new SMS OTP.");
      }

      await window.confirmationResult.confirm(otpCode.trim());
      // OTP Confirmed! Move to step 4 (New password)
      setStep(4);
    } catch (err: any) {
      setError("Invalid or expired OTP code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Handle Step 4: Set New Password for verified phone user
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
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: verifiedPhone,
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
      setError(err.message || "Failed to update password");
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
      {/* Firebase Compat Scripts for Phone Auth */}
      <Script
        src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"
        strategy="afterInteractive"
        onLoad={initFirebase}
      />
      <Script
        src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"
        strategy="afterInteractive"
        onLoad={initFirebase}
      />

      {/* Invisible reCAPTCHA container for Phone Auth */}
      <div id="recaptcha-container" />

      <div className="w-full max-w-[460px] rounded-[24px] border-2 border-[#10b981] bg-[#0b1329] p-6 sm:p-9 shadow-[0_0_30px_rgba(16,185,129,0.35),0_20px_45px_rgba(0,0,0,0.8)] backdrop-blur-xl animate-in fade-in duration-200">
        {step === 1 && (
          /* STEP 1: Enter Email or Phone */
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-bold mb-3 shadow-md shadow-emerald-500/25">
                <KeyRound className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Forgot Your Password?
              </h1>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Enter your email for a <strong>Magic Reset Link</strong>, or your mobile number for a <strong>secure SMS OTP</strong>.
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

            <form onSubmit={handleSendRecovery} className="space-y-4">
              <AuthInput
                id="recovery-identifier"
                label="Email or 10-Digit Mobile"
                type="text"
                required
                placeholder="Enter email or mobile number"
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
                    <span>Verifying account...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4" />
                    <span>Continue with Recovery</span>
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
              Email Magic Links by Resend · Phone OTPs by Firebase
            </div>
          </div>
        )}

        {step === 2 && (
          /* STEP 2: Email Magic Link Confirmation (Resend) */
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
                onClick={() => handleSendRecovery()}
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

        {step === 3 && (
          /* STEP 3: Enter Phone SMS OTP (Firebase Phone Auth) */
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-bold mb-3 shadow-md shadow-emerald-500/25">
                <Smartphone className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Enter SMS Code
              </h2>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                We sent a 6-digit OTP via SMS to{" "}
                <span className="font-semibold text-emerald-400">+91 {verifiedPhone}</span>
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

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="e.g. 581923"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full text-center tracking-[0.4em] font-mono text-xl rounded-2xl border border-white/15 bg-white/5 py-3 text-white placeholder-slate-600 outline-none focus:border-emerald-500 focus:bg-white/[0.08] transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length < 6}
                className="submit-button"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying OTP...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Verify Code & Continue</span>
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-slate-400 hover:text-white transition flex items-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>Change Number</span>
              </button>

              <button
                type="button"
                disabled={resendCooldown > 0 || loading}
                onClick={() => handleSendRecovery()}
                className="text-emerald-400 hover:text-emerald-300 transition disabled:text-slate-500"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend SMS OTP"}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          /* STEP 4: Set New Password (For Phone Users after OTP verified) */
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-bold mb-3 shadow-md shadow-emerald-500/25">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Set New Password
              </h2>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Phone verified! Choose your new password for account{" "}
                <span className="font-semibold text-emerald-400">+91 {verifiedPhone}</span>
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
                id="phone-new-password"
                label="New Password"
                required
                placeholder="Enter new password (min. 4 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                disabled={loading || Boolean(success)}
              />

              <PasswordInput
                id="phone-confirm-new-password"
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

            <div className="pt-2 border-t border-white/5 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Identity verified via Firebase Phone Authentication</span>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
