"use client";

import { useState, useEffect, useMemo } from "react";
import {
  User,
  Mail,
  Phone,
  QrCode,
  Crown,
  KeyRound,
  LogOut,
  X,
  Loader2,
  Check,
  Copy,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Trash2,
} from "lucide-react";
import { useUser } from "@/lib/userContext";
import type { MemberDTO } from "@/lib/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenChangePassword?: () => void;
  onLogoutConfirm?: () => void;
}

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

export default function ProfileSettingsModal({
  isOpen,
  onClose,
  onOpenChangePassword,
  onLogoutConfirm,
}: Props) {
  const { currentUser, setCurrentUser, refreshUsers } = useUser();

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
  const [showQrModal, setShowQrModal] = useState(false);
  const [autoClaimInfo, setAutoClaimInfo] = useState<{
    groupsCount: number;
    expensesCount: number;
  } | null>(null);

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
      setShowQrModal(false);
      if (data.user) {
        setCurrentUser(data.user);
      }
      await refreshUsers();
      setSuccessMsg("UPI ID removed successfully!");
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch (err: any) {
      setError(err.message || "Failed to remove UPI ID");
    } finally {
      setDeletingUpi(false);
    }
  };

  // Initialize from currentUser
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setPhone(currentUser.phone || "");
      setUpiId(currentUser.upiId || "");
      setAvatarColor(currentUser.avatarColor || "#10b981");
    }
  }, [currentUser, isOpen]);

  // Read currency preference from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCurrency = localStorage.getItem("splitrupee_pref_currency");
      if (savedCurrency) setPreferredCurrency(savedCurrency);
    }
  }, []);

  // UPI payment URI for QR Code
  const upiUri = useMemo(() => {
    const cleanUpi = upiId.trim();
    if (!cleanUpi || !cleanUpi.includes("@")) return "";
    return `upi://pay?pa=${encodeURIComponent(cleanUpi)}&pn=${encodeURIComponent(
      name.trim() || "SplitRupee User"
    )}&cu=${preferredCurrency}&tn=SplitRupee%20Settlement`;
  }, [upiId, name, preferredCurrency]);

  const qrCodeUrl = useMemo(() => {
    if (!upiUri) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiUri)}`;
  }, [upiUri]);

  if (!isOpen || !currentUser) return null;

  const handleCopyUpi = () => {
    if (!upiId) return;
    navigator.clipboard.writeText(upiId.trim());
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
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
      setAutoClaimInfo(null);

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

      // Save preferred currency locally
      if (typeof window !== "undefined") {
        localStorage.setItem("splitrupee_pref_currency", preferredCurrency);
      }

      if (data.user) {
        setCurrentUser(data.user);
      }
      await refreshUsers();

      if (data.claimedGroupsCount && data.claimedGroupsCount > 0) {
        setAutoClaimInfo({
          groupsCount: data.claimedGroupsCount,
          expensesCount: data.claimedExpensesCount || 0,
        });
        setSuccessMsg(
          `🎉 Mobile number linked! We automatically imported your expenses from ${data.claimedGroupsCount} group(s).`
        );
      } else {
        setSuccessMsg("Profile updated successfully!");
      }

      setTimeout(() => {
        if (!data.claimedGroupsCount) {
          onClose();
        }
      }, 1600);
    } catch (err: any) {
      setError(err.message || "Failed to save profile changes");
    } finally {
      setSaving(false);
    }
  };

  const isGoogleAccount =
    currentUser.email &&
    !currentUser.email.endsWith("@splitrupee.in") &&
    currentUser.email.includes("@gmail.com");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl border border-white/10 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-2xl flex items-center justify-center text-sm font-bold text-slate-950 shadow-md transition-colors"
              style={{ backgroundColor: avatarColor }}
            >
              {name ? name.slice(0, 2).toUpperCase() : currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Profile Settings</span>
                {currentUser.isPro ? (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <Crown className="h-3 w-3 text-amber-400" /> PRO
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                    Free
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                {currentUser.email || "Manage your account, phone number & UPI"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
              <Check className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section 1: Avatar Color & Display Name */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3.5">
            <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-emerald-400" />
              <span>Personal Identity</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full text-xs sm:text-sm bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Avatar Color Picker */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Avatar Theme Color
              </label>
              <div className="flex flex-wrap items-center gap-2.5">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAvatarColor(c)}
                    className={`h-8 w-8 rounded-xl flex items-center justify-center transition transform active:scale-90 ${
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

            {/* Email Address */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Account Email
              </label>
              <div className="flex items-center justify-between bg-slate-950/60 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-slate-300">
                <div className="flex items-center gap-2 truncate">
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{currentUser.email || "No email linked"}</span>
                </div>
                {isGoogleAccount ? (
                  <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-medium shrink-0 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Google OAuth
                  </span>
                ) : (
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-medium shrink-0">
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Mobile Number & Smart Auto-Claim */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/20 via-slate-900 to-teal-950/20 border border-emerald-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
                <span>Mobile Number</span>
              </div>
              {currentUser.phone && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Check className="h-2.5 w-2.5" /> Linked
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Indian Mobile Number (+91)
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
                  className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-white font-mono outline-none"
                />
              </div>
            </div>

            {/* Smart Auto-Claim Explainer Card */}
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-200/90 leading-relaxed flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-300">Smart Group Auto-Claim:</strong> If a friend previously added you to their trip or flat group using your phone number, adding your mobile number here will automatically link all past expenses, balances, and settlements to your real account!
              </div>
            </div>
          </div>

          {/* Section 3: UPI ID & QR Code */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <QrCode className="h-3.5 w-3.5 text-emerald-400" />
                <span>UPI Payment Address</span>
              </div>
              <div className="flex items-center gap-2">
                {(upiId || currentUser.upiId) && (
                  <button
                    type="button"
                    onClick={handleDeleteUpi}
                    disabled={deletingUpi || saving}
                    className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition px-2 py-0.5 rounded-lg hover:bg-rose-500/10 border border-rose-500/20"
                    title="Delete UPI ID from account"
                  >
                    {deletingUpi ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    <span>Delete UPI</span>
                  </button>
                )}
                {upiId && (
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
                  >
                    {copiedUpi ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedUpi ? "Copied" : "Copy UPI"}</span>
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Virtual Payment Address (VPA)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value.toLowerCase().trim())}
                  placeholder="e.g. 9876543210@ybl or name@okaxis"
                  className="flex-1 text-xs sm:text-sm bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                {upiId.includes("@") && (
                  <button
                    type="button"
                    onClick={() => setShowQrModal(!showQrModal)}
                    className="px-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition shrink-0"
                    title="View UPI QR Code"
                  >
                    <QrCode className="h-4 w-4" />
                    <span className="hidden sm:inline">QR Code</span>
                  </button>
                )}
              </div>

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

            {/* Inline UPI QR Code View */}
            {showQrModal && qrCodeUrl && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 text-center space-y-3">
                <div className="text-xs font-bold text-white">Your Personal Settlement QR Code</div>
                <div className="inline-block p-3 rounded-2xl bg-white shadow-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCodeUrl}
                    alt="UPI QR Code"
                    className="h-44 w-44 object-contain mx-auto"
                  />
                </div>
                <div className="text-xs font-mono text-emerald-400 font-bold">{upiId}</div>
                <div className="text-[11px] text-slate-400">
                  Friends can scan this code with GPay, PhonePe, or Paytm to pay you back directly!
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Membership Tier & Currency */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3.5">
            <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Crown className="h-3.5 w-3.5 text-amber-400" />
              <span>Preferences & Membership</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Membership Status Card */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{currentUser.isPro ? "SplitRupee Pro" : "Free Account"}</span>
                    {currentUser.isPro && (
                      <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-bold">PRO</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {currentUser.isPro ? "Unlimited trips & dynamic export" : "Standard features"}
                  </div>
                </div>
                {!currentUser.isPro && (
                  <a
                    href="/pro"
                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shrink-0 transition"
                  >
                    Upgrade
                  </a>
                )}
              </div>

              {/* Base Display Currency */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5">
                <div className="text-xs font-bold text-white mb-2">Display Currency</div>
                <div className="flex gap-1.5">
                  {(["INR", "USD", "EUR", "GBP"] as const).map((curr) => (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => setPreferredCurrency(curr)}
                      className={`flex-1 py-1 px-1.5 rounded-lg border text-[11px] font-mono font-bold transition ${
                        preferredCurrency === curr
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                          : "bg-white/5 border-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      {curr === "INR" ? "₹ INR" : curr === "USD" ? "$ USD" : curr === "EUR" ? "€ EUR" : "£ GBP"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Security & Account Actions */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2.5">
            <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <KeyRound className="h-3.5 w-3.5 text-amber-400" />
              <span>Security & Actions</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              {onOpenChangePassword && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenChangePassword();
                  }}
                  className="flex-1 py-2 px-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition"
                >
                  <KeyRound className="h-3.5 w-3.5 text-amber-400" />
                  <span>Change Password</span>
                </button>
              )}

              {onLogoutConfirm && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLogoutConfirm();
                  }}
                  className="flex-1 py-2 px-3 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-bold text-rose-400 flex items-center justify-center gap-2 transition"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Log Out of Account</span>
                </button>
              )}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

