"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/lib/userContext";
import {
  Sparkles,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Loader2,
  User,
  KeyRound,
} from "lucide-react";
import Link from "next/link";
import GoogleAuthModal from "@/components/GoogleAuthModal";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  const { login, refreshUsers } = useUser();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 1. Username / Email / Phone + Password Sign In
  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier.trim()) {
      setError("Please enter your Username, Email address, or Mobile number");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Login failed. Please check your credentials.");
      }

      login(data.user);
      await refreshUsers();
      router.push(redirectUrl);
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  const [showGoogleModal, setShowGoogleModal] = useState(false);

  return (
    <div className="flex min-h-[75vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/95 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6 animate-in fade-in duration-200">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 font-bold text-slate-950 text-2xl shadow-lg shadow-emerald-500/20">
            ₹
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Log in to SplitRupee
          </h1>
          <p className="text-xs text-slate-400">
            Enter your credentials to access your groups and balances
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
            {error}
          </div>
        )}

        {/* 1-Click Google OAuth */}
        <button
          onClick={() => setShowGoogleModal(true)}
          type="button"
          className="w-full flex items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/[0.08] py-3.5 px-4 text-sm font-bold text-white hover:bg-white/[0.14] hover:border-white/30 transition shadow-lg"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"/>
            <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
            <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"/>
            <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-white/10" />
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            or sign in with password
          </span>
          <div className="flex-1 border-t border-white/10" />
        </div>

        {/* Username / Email / Phone + Password Form */}
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300">
              Username, Email, or Mobile Number
            </label>
            <div className="relative mt-1">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                required
                placeholder="e.g. aarav, diya@example.com, or 9876543210"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <Link
                href="/forgot-password"
                className="text-[11px] font-semibold text-emerald-400 hover:underline"
              >
                Forgot your password?
              </Link>
            </div>
            <div className="relative mt-1">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 py-3 text-xs font-bold text-slate-950 hover:opacity-95 disabled:opacity-50 transition shadow-lg shadow-emerald-500/20"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            <span>Log In to Account</span>
          </button>
        </form>

        <div className="border-t border-white/5 pt-4 text-center text-xs text-slate-400">
          Don't have an account yet?{" "}
          <Link href="/signup" className="font-semibold text-emerald-400 hover:underline">
            Sign up for free
          </Link>
        </div>
      </div>

      {showGoogleModal && (
        <GoogleAuthModal onClose={() => setShowGoogleModal(false)} />
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[75vh] items-center justify-center p-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

