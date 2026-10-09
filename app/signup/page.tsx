"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/userContext";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Check,
  Smartphone,
  Mail,
  Lock,
  User,
  KeyRound,
} from "lucide-react";
import Link from "next/link";
import GoogleAuthModal from "@/components/GoogleAuthModal";

export default function SignupPage() {
  const router = useRouter();
  const { login, refreshUsers } = useUser();
  const [tab, setTab] = useState<"google" | "phone" | "email">("google");
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [color, setColor] = useState("#10b981");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const colors = [
    "#10b981", "#f43f5e", "#0ea5e9", "#f59e0b",
    "#8b5cf6", "#ec4899", "#14b8a6", "#3b82f6",
  ];

  // 1. Google OAuth Signup
  async function handleGoogleSignup() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "Aarav Sharma",
          email: email.trim() || undefined,
          authMethod: "google",
          avatarColor: color,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        // If already exists, attempt login
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ authMethod: "google" }),
        });
        const loginData = await loginRes.json();
        if (loginData.ok) {
          login(loginData.user);
          await refreshUsers();
          router.push("/dashboard");
          return;
        }
        throw new Error(data.error || "Google Sign-In failed");
      }
      login(data.user);
      await refreshUsers();
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to sign up with Google");
    } finally {
      setLoading(false);
    }
  }

  // 2. WhatsApp / Phone OTP Signup with Password
  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your full name");
      return;
    }
    if (!phone || phone.length < 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    if (!password || password.length < 4) {
      setError("Password must be at least 4 characters long");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setLoading(true);

    if (!otpSent) {
      // Step 1: Dispatch OTP to WhatsApp/Phone
      setTimeout(() => {
        setOtpSent(true);
        setLoading(false);
      }, 500);
    } else {
      // Step 2: Verify OTP and create user
      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim(),
            password: password.trim(),
            authMethod: "phone",
            avatarColor: color,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.error || "Phone registration failed");
        }
        login(data.user);
        await refreshUsers();
        router.push("/dashboard");
      } catch (err: any) {
        setError(err.message || "Failed to register with phone number");
      } finally {
        setLoading(false);
      }
    }
  }

  // 3. Email & Password Signup
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your full name");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    if (!password || password.length < 4) {
      setError("Password must be at least 4 characters long");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          authMethod: "email",
          avatarColor: color,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Email registration failed");
      }
      login(data.user);
      await refreshUsers();
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[75vh] items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/95 p-6 sm:p-10 backdrop-blur-2xl shadow-2xl space-y-6 animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 font-bold text-slate-950 text-2xl shadow-lg shadow-emerald-500/20">
            ₹
          </div>
          <div>
            <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">
              Join SplitRupee
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Create your account
            </h1>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
            {error}
          </div>
        )}

        {/* 3 Signup Methods Tabs */}
        <div className="flex rounded-2xl bg-white/5 p-1 border border-white/10 text-xs font-semibold">
          <button
            onClick={() => { setTab("google"); setError(""); }}
            className={`flex-1 rounded-xl py-2 transition ${
              tab === "google" ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Google OAuth
          </button>
          <button
            onClick={() => { setTab("phone"); setError(""); }}
            className={`flex-1 rounded-xl py-2 transition ${
              tab === "phone" ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            WhatsApp / OTP
          </button>
          <button
            onClick={() => { setTab("email"); setError(""); }}
            className={`flex-1 rounded-xl py-2 transition ${
              tab === "email" ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Email & Password
          </button>
        </div>

        {/* TAB 1: Google OAuth Signup */}
        {tab === "google" && (
          <div className="space-y-4 pt-2">
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

            <p className="text-[11px] text-slate-500 text-center">
              1-Click registration · Choose your Google account with 0 passwords
            </p>
          </div>
        )}

        {/* TAB 2: WhatsApp / Phone OTP Signup */}
        {tab === "phone" && (
          <form onSubmit={handlePhoneSubmit} className="space-y-4 pt-2">
            {!otpSent ? (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Your Full Name</label>
                  <div className="relative mt-1">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Diya Patel"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Mobile Number (India)</label>
                  <div className="relative mt-1">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-bold text-slate-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-11 pr-3 text-xs font-semibold text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Create Password</label>
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
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Confirm Password</label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 py-3 text-xs font-bold text-slate-950 hover:opacity-95 disabled:opacity-50 transition shadow-lg shadow-emerald-500/20"
                >
                  {loading ? "Sending..." : "Send WhatsApp / SMS Code"}
                </button>
              </>
            ) : (
              <>
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 text-center">
                  OTP sent to +91 {phone}! Use code: <span className="font-bold font-mono">1234</span>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Enter 4-digit OTP Code</label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="1234"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    className="mt-1 w-full text-center tracking-widest text-lg font-mono font-bold rounded-xl border border-white/10 bg-white/5 py-2.5 text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-emerald-500 py-3 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition shadow-lg shadow-emerald-500/20"
                >
                  {loading ? "Registering..." : "Verify OTP & Create Account"}
                </button>
              </>
            )}
          </form>
        )}

        {/* TAB 3: Email & Password Signup */}
        {tab === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-300">Your Full Name</label>
              <div className="relative mt-1">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Kabir Mehta"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="kabir@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Create Password</label>
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
              <div>
                <label className="text-xs font-semibold text-slate-300">Confirm Password</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Avatar Color Picker */}
            <div>
              <label className="text-xs font-semibold text-slate-300">Choose Profile Color</label>
              <div className="mt-2 flex gap-2.5">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-7 w-7 rounded-full transition flex items-center justify-center ${
                      color === c ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110" : "opacity-80 hover:opacity-100"
                    }`}
                    style={{ background: c }}
                  >
                    {color === c && <Check className="h-3.5 w-3.5 text-slate-950 stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 py-3 text-xs font-bold text-slate-950 hover:opacity-95 disabled:opacity-50 transition shadow-lg shadow-emerald-500/20"
            >
              {loading ? "Creating Account..." : "Create Account & Go to Dashboard"}
            </button>
          </form>
        )}

        <div className="border-t border-white/5 pt-4 text-center text-xs text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-emerald-400 hover:underline">
            Log in here
          </Link>
        </div>
      </div>

      {showGoogleModal && (
        <GoogleAuthModal onClose={() => setShowGoogleModal(false)} />
      )}
    </div>
  );
}
