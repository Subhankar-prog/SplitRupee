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

const AVATAR_COLORS = [
  "#739B83",
  "#263A32",
  "#D9A86C",
  "#3B7356",
  "#B85C55",
  "#5E7B6D",
  "#A26D2E",
  "#4A6572",
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
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError("You're offline. Removing your UPI ID requires an internet connection.");
      return;
    }
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
      if (data.offline) {
        throw new Error("You're offline. Removing your UPI ID requires an internet connection.");
      }
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
      <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary)]" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-3 max-w-sm rounded-2xl border border-[color:var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-card)]">
          <div className="h-12 w-12 rounded-xl bg-[var(--status-positive-bg)] text-[var(--status-positive)] flex items-center justify-center mx-auto border border-[color:var(--border-subtle)]">
            <User className="h-6 w-6" />
          </div>
          <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">Please Sign In</h2>
          <p className="text-xs text-[var(--text-secondary)]">Log in to view and manage your profile settings.</p>
          <Link
            href="/login"
            className="inline-block px-5 py-2.5 rounded-lg bg-[var(--brand-dark)] dark:bg-[var(--brand-primary)] hover:opacity-95 text-white dark:text-[#171F1D] font-medium text-xs transition-opacity"
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

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      if (typeof window !== "undefined") {
        localStorage.setItem("splitrupee_pref_currency", preferredCurrency);
      }
      setError("You're offline. Preferred currency was saved locally, while profile account updates require an internet connection.");
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
      if (data.offline) {
        throw new Error("You're offline. Saving account profile changes requires an internet connection.");
      }
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
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2.5 text-xs text-[var(--text-secondary)]">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </Link>
          <span>/</span>
          <span className="text-[var(--text-primary)] font-medium">Profile Settings</span>
        </div>

        {/* Page Hero Card */}
        <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)] flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div
              className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl flex items-center justify-center text-2xl font-display font-semibold text-white keep-white transition-colors border border-[var(--border-subtle)]"
              style={{ backgroundColor: avatarColor }}
            >
              {name ? name.slice(0, 2).toUpperCase() : currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2.5">
                <h1 className="font-display text-xl sm:text-2xl font-semibold text-[var(--text-primary)]">{name || currentUser.name}</h1>
                {currentUser.isPro && (
                  <span className="text-[10px] bg-[var(--status-warning-bg)] text-[var(--status-warning)] border border-[var(--status-warning-border)] px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <Crown className="h-3 w-3" /> PRO
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">{currentUser.email}</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                {currentUser.phone && (
                  <span className="text-[11px] bg-[var(--status-positive-bg)] text-[var(--status-positive)] border border-[var(--status-positive-border)] px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1">
                    <Smartphone className="h-3 w-3" /> +91 {currentUser.phone}
                  </span>
                )}
                {currentUser.upiId && (
                  <span className="text-[11px] bg-[var(--bg-surface-secondary)] text-[var(--text-primary)] border border-[var(--border-subtle)] px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1">
                    <QrCode className="h-3 w-3 text-[var(--brand-primary)]" /> {currentUser.upiId}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!currentUser.isPro && (
              <Link
                href="/pro"
                className="h-9 inline-flex items-center px-4 rounded-xl bg-[var(--accent-sand)] text-[#171F1D] text-xs font-semibold hover:opacity-95 transition-opacity"
              >
                Upgrade to Pro
              </Link>
            )}
            <button
              type="button"
              onClick={() => logout()}
              className="h-9 px-3.5 rounded-xl border border-[var(--status-negative-border)] bg-[var(--status-negative-bg)] hover:opacity-90 text-[var(--status-negative)] text-xs font-semibold transition-opacity flex items-center gap-1.5"
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
            <div className="p-4 rounded-xl bg-[var(--status-negative-bg)] border border-[var(--status-negative-border)] text-[var(--status-negative)] text-xs sm:text-sm flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-xl bg-[var(--status-positive-bg)] border border-[var(--status-positive-border)] text-[var(--status-positive)] text-xs sm:text-sm flex items-center gap-3">
              <Check className="h-5 w-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Personal Identity & Phone */}
            <div className="space-y-6">
              {/* Personal Identity Card */}
              <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)] space-y-4">
                <div className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                  <User className="h-4 w-4 text-[var(--brand-primary)]" />
                  <span>Personal Details</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-10 w-full text-sm bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl px-3.5 text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)] focus:bg-[var(--bg-surface)] transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">Avatar Color Theme</label>
                  <div className="flex flex-wrap gap-2.5">
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setAvatarColor(c)}
                        className={`h-9 w-9 rounded-xl flex items-center justify-center transition-transform ${
                          avatarColor === c
                            ? "ring-2 ring-[var(--brand-primary)] ring-offset-2 ring-offset-[var(--bg-surface)] scale-105"
                            : "hover:scale-105 opacity-85 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: c }}
                      >
                        {avatarColor === c && <Check className="h-4 w-4 text-white keep-white stroke-[2.5]" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Registered Email</label>
                  <div className="flex items-center justify-between bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)]">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="h-4 w-4 text-[var(--text-secondary)] shrink-0" />
                      <span className="truncate">{currentUser.email}</span>
                    </div>
                    <span className="text-[10px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full font-medium shrink-0">
                      Primary
                    </span>
                  </div>
                </div>
              </div>

              {/* Mobile Number & Auto-Claim Card */}
              <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-[var(--brand-primary)]" />
                    <span>Mobile Number &amp; Auto-Sync</span>
                  </div>
                  {currentUser.phone && (
                    <span className="text-[10px] bg-[var(--status-positive-bg)] text-[var(--status-positive)] border border-[var(--status-positive-border)] px-2 py-0.5 rounded-full font-semibold">
                      Linked
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                    10-Digit Mobile Number (+91)
                  </label>
                  <div className="flex items-center rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] focus-within:border-[var(--brand-primary)] focus-within:bg-[var(--bg-surface)] overflow-hidden transition-colors">
                    <span className="px-3 text-xs font-semibold text-[var(--text-secondary)] bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] select-none py-2.5 tabular-nums">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder="9876543210"
                      className="flex-1 bg-transparent px-3.5 py-2.5 text-sm text-[var(--text-primary)] font-mono outline-none"
                    />
                  </div>
                </div>

                {/* Info Card */}
                <div className="p-3.5 rounded-xl bg-[var(--status-positive-bg)] border border-[var(--status-positive-border)] text-xs text-[var(--text-secondary)] leading-relaxed flex items-start gap-3">
                  <Sparkles className="h-4 w-4 text-[var(--status-positive)] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[var(--status-positive)]">Smart Group Auto-Claim:</strong> Whenever a friend adds you to a trip or group using your phone number, adding your mobile number here will automatically scan and pull all past expenses, balances, and debts directly into your account!
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: UPI & Preferences */}
            <div className="space-y-6">
              {/* UPI Card */}
              <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-[var(--brand-primary)]" />
                    <span>UPI Settlement Address</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(upiId || currentUser.upiId) && (
                      <button
                        type="button"
                        onClick={handleDeleteUpi}
                        disabled={deletingUpi || saving}
                        className="text-xs font-semibold text-[var(--status-negative)] flex items-center gap-1 transition-opacity px-2.5 py-1 rounded-lg bg-[var(--status-negative-bg)] border border-[var(--status-negative-border)] hover:opacity-90"
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
                        className="text-xs font-semibold text-[var(--status-positive)] hover:underline flex items-center gap-1"
                      >
                        {copiedUpi ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedUpi ? "Copied" : "Copy UPI"}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                    UPI ID (Virtual Payment Address)
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value.toLowerCase().trim())}
                    placeholder="e.g. 9876543210@ybl"
                    className="h-10 w-full text-sm bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl px-3.5 text-[var(--text-primary)] font-mono outline-none focus:border-[var(--brand-primary)] focus:bg-[var(--bg-surface)] transition-colors"
                  />
                  {/* Quick Handle Suggestions */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[11px] text-[var(--text-secondary)]">Quick handles:</span>
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
                        className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--brand-primary)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        {handle}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live QR Code Display */}
                {qrCodeUrl && (
                  <div className="p-4 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--status-positive-border)] text-center space-y-3">
                    <div className="text-xs font-semibold text-[var(--text-primary)]">Your Settlement QR Code</div>
                    <div className="inline-block p-3 rounded-xl bg-white border border-[#E6E9E3]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrCodeUrl}
                        alt="UPI QR Code"
                        className="h-44 w-44 object-contain mx-auto"
                      />
                    </div>
                    <div className="text-xs font-mono text-[var(--status-positive)] font-semibold">{upiId}</div>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      Friends can scan this QR code with any UPI app (GPay, PhonePe, Paytm) to settle debts.
                    </p>
                  </div>
                )}
              </div>

              {/* Currency Preference Card */}
              <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)] space-y-4">
                <div className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                  <Crown className="h-4 w-4 text-[var(--accent-sand)]" />
                  <span>Currency Preference</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">Default Currency</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["INR", "USD", "EUR", "GBP"] as const).map((curr) => (
                      <button
                        key={curr}
                        type="button"
                        onClick={() => setPreferredCurrency(curr)}
                        className={`py-2 px-2 rounded-xl border text-xs tabular-nums font-semibold transition-colors ${
                          preferredCurrency === curr
                            ? "bg-[var(--status-positive-bg)] border-[var(--status-positive-border)] text-[var(--brand-dark)] dark:text-[var(--brand-primary)]"
                            : "bg-[var(--bg-surface-secondary)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
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
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
            <Link
              href="/dashboard"
              className="h-10 inline-flex items-center px-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-secondary)] text-xs font-medium text-[var(--text-primary)] transition-colors"
            >
              Back to Dashboard
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="h-10 flex items-center gap-2 px-6 rounded-xl bg-[var(--brand-dark)] dark:bg-[var(--brand-primary)] hover:opacity-95 text-white dark:text-[#171F1D] font-semibold text-xs sm:text-sm transition-opacity disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              <span>Save Profile Changes</span>
            </button>
          </div>
        </form>
    </div>
  );
}

