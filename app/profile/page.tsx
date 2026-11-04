"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Mail,
  Smartphone,
  QrCode,
  Crown,
  KeyRound,
  LogOut,
  Check,
  Copy,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { useUser } from "@/lib/userContext";
import Navbar from "@/components/Navbar";

const AVATAR_COLORS = [
  "#10b981", // Emerald
  "#0ea5e9", // Sky Blue
  "#8b5cf6", // Purple
  "#f43f5e", // Rose
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#14b8a6", // Teal
  "#3b82f6", // Blue
];

const UPI_HANDLES = ["@ybl", "@paytm", "@okaxis", "@okhdfcbank", "@icici"];

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser, setCurrentUser, refreshUsers, logout, isLoading } = useUser();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [upiId, setUpiId] = useState("");
  const [avatarColor, setAvatarColor] = useState("#10b981");
  const [preferredCurrency, setPreferredCurrency] = useState("INR");

  const [saving, setSaving] = useState(false);
  const [deletingUpi, setDeletingUpi] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [showQr, setShowQr] = useState(true);

  const handleDeleteUpi = async () => {
    if (!currentUser) return;
    try {
      setDeletingUpi(true);
      setError("");
      setSuccessMsg("");

      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          upiId: null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.message || data.error || "Failed to remove UPI ID");
      }

      setUpiId("");
      if (data.user) {
        setCurrentUser(data.user);
      }
      await refreshUsers();
      setSuccessMsg("UPI ID removed successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to remove UPI ID");
    } finally {
      setDeletingUpi(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setPhone(currentUser.phone || "");
      setUpiId(currentUser.upiId || "");
      setAvatarColor(currentUser.avatarColor || "#10b981");
    }
  }, [currentUser]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("splitrupee_pref_currency");
      if (saved) setPreferredCurrency(saved);
    }
  }, []);

  const upiUri = useMemo(() => {
    const clean = upiId.trim();
    if (!clean || !clean.includes("@")) return "";
    return `upi://pay?pa=${encodeURIComponent(clean)}&pn=${encodeURIComponent(
      name.trim() || "SplitRupee User"
    )}&cu=${preferredCurrency}&tn=SplitRupee%20Settlement`;
  }, [upiId, name, preferredCurrency]);

  const qrCodeUrl = useMemo(() => {
    if (!upiUri) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(upiUri)}`;
  }, [upiUri]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-3 max-w-sm">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
            <User className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold">Please Sign In</h2>
          <p className="text-xs text-slate-400">Log in to view and manage your profile settings.</p>
          <Link
            href="/login"
            className="inline-block px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const handleCopyUpi = () => {
    if (!upiId) return;
    navigator.clipboard.writeText(upiId.trim());
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (phone.trim() && cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccessMsg("");

      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          name: name.trim(),
          phone: cleanPhone || null,
          upiId: upiId.trim() || null,
          avatarColor,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.message || data.error || "Failed to update profile");
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("splitrupee_pref_currency", preferredCurrency);
      }

      if (data.user) {
        setCurrentUser(data.user);
      }
      await refreshUsers();

      if (data.claimedGroupsCount && data.claimedGroupsCount > 0) {
        setSuccessMsg(
          `🎉 Mobile number linked! We automatically imported your expenses from ${data.claimedGroupsCount} group(s).`
        );
      } else {
        setSuccessMsg("Profile updated successfully!");
      }

      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to save profile changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 hover:text-white transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </Link>
          <span>/</span>
          <span className="text-white font-medium">Profile Settings</span>
        </div>

        {/* Page Hero Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-white/10 shadow-2xl flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div
              className="h-20 w-20 rounded-3xl flex items-center justify-center text-2xl font-black text-slate-950 shadow-xl transition-colors ring-4 ring-white/10"
              style={{ backgroundColor: avatarColor }}
            >
              {name ? name.slice(0, 2).toUpperCase() : currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-white">{name || currentUser.name}</h1>
                {currentUser.isPro && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <Crown className="h-3 w-3 text-amber-400" /> PRO
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">{currentUser.email}</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                {currentUser.phone && (
                  <span className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1">
                    <Smartphone className="h-3 w-3" /> +91 {currentUser.phone}
                  </span>
                )}
                {currentUser.upiId && (
                  <span className="text-[11px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1">
                    <QrCode className="h-3 w-3" /> {currentUser.upiId}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!currentUser.isPro && (
              <Link
                href="/pro"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 hover:scale-105 transition"
              >
                Upgrade to Pro
              </Link>
            )}
            <button
              onClick={() => logout()}
              className="p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition flex items-center gap-1.5"
              title="Log Out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center gap-3">
              <Check className="h-5 w-5 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Personal Identity & Phone */}
            <div className="space-y-6">
              {/* Personal Identity Card */}
              <div className="p-5 rounded-3xl bg-slate-900/60 border border-white/5 space-y-4">
                <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <User className="h-4 w-4 text-emerald-400" />
                  <span>Personal Details</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-sm bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">Avatar Color Theme</label>
                  <div className="flex flex-wrap gap-2.5">
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setAvatarColor(c)}
                        className={`h-9 w-9 rounded-xl flex items-center justify-center transition transform active:scale-90 ${
                          avatarColor === c
                            ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110 shadow-lg"
                            : "hover:scale-105 opacity-80 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: c }}
                      >
                        {avatarColor === c && <Check className="h-4 w-4 text-slate-950 font-bold" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Registered Email</label>
                  <div className="flex items-center justify-between bg-slate-950/80 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="truncate">{currentUser.email}</span>
                    </div>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-medium shrink-0">
                      Primary
                    </span>
                  </div>
                </div>
              </div>

              {/* Mobile Number & Auto-Claim Card */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/20 via-slate-900/60 to-slate-900/60 border border-emerald-500/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-emerald-400" />
                    <span>Mobile Number & Auto-Sync</span>
                  </div>
                  {currentUser.phone && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                      Linked
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    10-Digit Mobile Number (+91)
                  </label>
                  <div className="flex items-center rounded-xl bg-slate-950/80 border border-white/10 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 overflow-hidden">
                    <span className="px-3 text-xs font-bold text-slate-400 bg-white/5 border-r border-white/10 select-none py-2.5">
                      🇮🇳 +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder="9876543210"
                      className="flex-1 bg-transparent px-3.5 py-2.5 text-sm text-white font-mono outline-none"
                    />
                  </div>
                </div>

                {/* Info Card */}
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200/90 leading-relaxed flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-emerald-300">Smart Group Auto-Claim:</strong> Whenever a friend adds you to a trip or group using your phone number, adding your mobile number here will automatically scan and pull all past expenses, balances, and debts directly into your account!
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: UPI & Preferences */}
            <div className="space-y-6">
              {/* UPI Card */}
              <div className="p-5 rounded-3xl bg-slate-900/60 border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-emerald-400" />
                    <span>UPI Settlement Address</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(upiId || currentUser.upiId) && (
                      <button
                        type="button"
                        onClick={handleDeleteUpi}
                        disabled={deletingUpi || saving}
                        className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition px-2.5 py-1 rounded-lg hover:bg-rose-500/10 border border-rose-500/20"
                        title="Delete UPI ID from account"
                      >
                        {deletingUpi ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        <span>Delete UPI</span>
                      </button>
                    )}
                    {upiId && (
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
                      >
                        {copiedUpi ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedUpi ? "Copied" : "Copy UPI"}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    UPI ID (Virtual Payment Address)
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value.toLowerCase().trim())}
                    placeholder="e.g. 9876543210@ybl"
                    className="w-full text-sm bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  {/* Quick Handle Suggestions */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-slate-400">Quick handles:</span>
                    {UPI_HANDLES.map((handle) => (
                      <button
                        key={handle}
                        type="button"
                        onClick={() => {
                          const prefix = upiId.includes("@")
                            ? upiId.split("@")[0]
                            : upiId || phone || name.toLowerCase().replace(/[^a-z0-9]/g, "");
                          setUpiId(`${prefix}${handle}`);
                        }}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:border-emerald-500 hover:text-emerald-300 transition"
                      >
                        {handle}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live QR Code Display */}
                {qrCodeUrl && (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/20 text-center space-y-3">
                    <div className="text-xs font-bold text-white">Your Settlement QR Code</div>
                    <div className="inline-block p-3 rounded-2xl bg-white shadow-xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrCodeUrl}
                        alt="UPI QR Code"
                        className="h-44 w-44 object-contain mx-auto"
                      />
                    </div>
                    <div className="text-xs font-mono text-emerald-400 font-bold">{upiId}</div>
                    <p className="text-[11px] text-slate-400">
                      Friends can scan this QR code with any UPI app (GPay, PhonePe, Paytm) to settle debts.
                    </p>
                  </div>
                )}
              </div>

              {/* Currency Preference Card */}
              <div className="p-5 rounded-3xl bg-slate-900/60 border border-white/5 space-y-4">
                <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-400" />
                  <span>Currency Preference</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">Default Currency</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["INR", "USD", "EUR", "GBP"] as const).map((curr) => (
                      <button
                        key={curr}
                        type="button"
                        onClick={() => setPreferredCurrency(curr)}
                        className={`py-2 px-2 rounded-xl border text-xs font-mono font-bold transition ${
                          preferredCurrency === curr
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-sm"
                            : "bg-slate-950 border-white/5 text-slate-400 hover:text-white"
                        }`}
                      >
                        {curr === "INR" ? "₹ INR" : curr === "USD" ? "$ USD" : curr === "EUR" ? "€ EUR" : "£ GBP"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition"
            >
              Back to Dashboard
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-xl shadow-emerald-500/20 transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              <span>Save Profile Changes</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

