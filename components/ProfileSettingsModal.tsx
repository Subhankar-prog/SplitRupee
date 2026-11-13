"use client";

import { useState, useEffect, useMemo, useId, useRef } from "react";
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
  Camera,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { useUser } from "@/lib/userContext";
import type { MemberDTO } from "@/lib/types";
import {
  BOTANICAL_AVATAR_COLORS,
  DEFAULT_AVATAR_COLOR,
  getAvatarTextColor,
} from "@/lib/avatarColors";
import { useDialogAccessibility, ModalPortal } from "@/components/ui/primitives";
import QrCodeImage from "@/components/ui/QrCodeImage";
import UserAvatar from "@/components/ui/UserAvatar";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenChangePassword?: () => void;
  onLogoutConfirm?: () => void;
}

const UPI_HANDLES = ["@ybl", "@paytm", "@okaxis", "@okhdfcbank", "@icici"];

export default function ProfileSettingsModal({
  isOpen,
  onClose,
  onOpenChangePassword,
  onLogoutConfirm,
}: Props) {
  const { currentUser, setCurrentUser, refreshUsers } = useUser();
  const nameId = useId();
  const phoneId = useId();
  const upiIdInputId = useId();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [upiId, setUpiId] = useState("");
  const [avatarColor, setAvatarColor] = useState(DEFAULT_AVATAR_COLOR);
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null>(null);
  const [removeCustomAvatar, setRemoveCustomAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      setAvatarColor(currentUser.avatarColor || DEFAULT_AVATAR_COLOR);
      setCustomAvatarUrl(currentUser.customAvatarUrl || null);
      setRemoveCustomAvatar(false);
    }
  }, [currentUser, isOpen]);

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Please select an image smaller than 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCustomAvatarUrl(reader.result);
        setRemoveCustomAvatar(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const effectiveAvatarUrl = removeCustomAvatar
    ? (currentUser?.googleAvatarUrl || null)
    : (customAvatarUrl || currentUser?.avatarUrl || null);

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

  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useDialogAccessibility(isOpen && Boolean(currentUser), onClose, dialogRef, saving);

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
      setAutoClaimInfo(null);

      const patchPayload: any = {
        userId: currentUser.id,
        name: name.trim(),
        phone: cleanPhone || null,
        upiId: upiId.trim() || null,
        avatarColor,
      };

      if (removeCustomAvatar) {
        patchPayload.removeCustomAvatar = true;
      } else if (customAvatarUrl && customAvatarUrl !== currentUser.customAvatarUrl) {
        patchPayload.customAvatarUrl = customAvatarUrl;
      }

      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchPayload),
      });

      const data = await res.json();
      if (data.offline) {
        throw new Error("You're offline. Saving account profile changes requires an internet connection.");
      }
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
          `Mobile number linked. We automatically imported your expenses from ${data.claimedGroupsCount} group(s).`
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
    <ModalPortal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[var(--overlay-backdrop)] overscroll-contain touch-none sr-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="w-full max-w-xl max-h-[min(90vh,calc(100dvh-1.5rem))] flex flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-popover overflow-hidden outline-none sr-modal-panel"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)] shrink-0">
          <div className="flex items-center gap-3">
            <UserAvatar
              name={name || currentUser.name}
              avatarUrl={effectiveAvatarUrl}
              avatarColor={avatarColor}
              size="lg"
              shape="rounded"
              isPro={currentUser.isPro}
            />
            <div>
              <h3 id={titleId} className="font-display text-base sm:text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <span>Profile Settings</span>
                {currentUser.isPro ? (
                  <span className="text-[10px] bg-[var(--status-warning-bg)] text-[var(--status-warning)] border border-[var(--status-warning-border)] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <Crown className="h-3 w-3" /> PRO
                  </span>
                ) : (
                  <span className="text-[10px] bg-[var(--status-positive-bg)] text-[var(--status-positive)] border border-[var(--status-positive-border)] px-2 py-0.5 rounded-full font-semibold">
                    Free
                  </span>
                )}
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                {currentUser.email || "Manage your account, phone number & UPI"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-11 w-11 sm:h-8 sm:w-8 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] transition-colors"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-[var(--status-negative-bg)] border border-[var(--status-negative-border)] text-[var(--status-negative)] text-xs flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-[var(--status-positive-bg)] border border-[var(--status-positive-border)] text-[var(--status-positive)] text-xs flex items-center gap-2.5">
              <Check className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section 1: Avatar Color & Display Name */}
          <div className="p-4 rounded-2xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] space-y-3.5">
            <div className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
              <span>Personal Identity</span>
            </div>

            <div>
              <label htmlFor={nameId} className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Full Name
              </label>
              <input
                id={nameId}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="h-10 w-full text-xs sm:text-sm bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-xl px-3.5 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:border-[var(--brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--brand-dark)] dark:focus-visible:ring-[var(--brand-primary)] transition-colors"
                required
              />
            </div>

            {/* Profile Picture & Avatar Priority */}
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--text-secondary)]">Profile Picture</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)]">
                  {!removeCustomAvatar && (customAvatarUrl || currentUser.customAvatarUrl)
                    ? "Priority 1: Custom Photo"
                    : currentUser.googleAvatarUrl
                    ? "Priority 2: Google Photo"
                    : "Priority 3: Initials Fallback"}
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                <UserAvatar
                  name={name || currentUser.name}
                  avatarUrl={effectiveAvatarUrl}
                  avatarColor={avatarColor}
                  size="xl"
                  shape="rounded"
                  isPro={currentUser.isPro}
                  className="shadow-sm border border-[var(--border-subtle)]"
                />

                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] hover:bg-[var(--bg-surface-hover)] hover:border-[var(--brand-primary)] text-xs font-semibold text-[var(--text-primary)] transition-colors"
                    >
                      <Camera className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                      <span>Upload Custom Photo</span>
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFile}
                      className="hidden"
                      aria-label="Upload custom avatar image"
                    />

                    {(!removeCustomAvatar && (customAvatarUrl || currentUser.customAvatarUrl)) && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomAvatarUrl(null);
                          setRemoveCustomAvatar(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--status-negative-border)] bg-[var(--status-negative-bg)] text-[var(--status-negative)] text-xs font-semibold hover:opacity-90 transition-opacity"
                        title="Remove custom photo and revert to Google profile picture or initials"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Revert to Google Photo</span>
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-[var(--text-secondary)] leading-tight">
                    {!removeCustomAvatar && (customAvatarUrl || currentUser.customAvatarUrl)
                      ? "Custom avatar overrides Google profile photo and won't be replaced on Google login."
                      : currentUser.googleAvatarUrl
                      ? "Automatically synced from your Google account. You can override it with a custom photo anytime."
                      : "Using your initials and theme color. Connect Google or upload a photo to customize."}
                  </p>
                </div>
              </div>
            </div>

            {/* Avatar Color Picker */}
            <div role="group" aria-labelledby={`${nameId}-avatar-colors`}>
              <span id={`${nameId}-avatar-colors`} className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                Avatar Theme Color
              </span>
              <div className="flex flex-wrap items-center gap-2.5">
                {BOTANICAL_AVATAR_COLORS.map((swatch) => (
                  <button
                    key={swatch.hex}
                    type="button"
                    aria-label={`Select ${swatch.name} avatar color`}
                    aria-pressed={avatarColor === swatch.hex}
                    onClick={() => setAvatarColor(swatch.hex)}
                    className={`cursor-pointer h-11 w-11 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center transition-transform ${
                      avatarColor === swatch.hex
                        ? "ring-2 ring-[var(--brand-primary)] ring-offset-2 ring-offset-[var(--bg-surface)] scale-105"
                        : "hover:scale-105 opacity-90 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: swatch.hex, color: getAvatarTextColor(swatch.hex) }}
                  >
                    {avatarColor === swatch.hex && <Check className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Email Address */}
            <div>
              <span className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Account Email
              </span>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)]">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Mail className="h-3.5 w-3.5 text-[var(--text-secondary)] shrink-0" />
                  <span className="break-all">{currentUser.email || "No email linked"}</span>
                </div>
                {isGoogleAccount ? (
                  <span className="text-[10px] bg-[var(--status-positive-bg)] text-[var(--status-positive)] border border-[var(--status-positive-border)] px-2 py-0.5 rounded-full font-medium shrink-0 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Google OAuth
                  </span>
                ) : (
                  <span className="text-[10px] bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full font-medium shrink-0">
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Mobile Number & Smart Auto-Claim */}
          <div className="p-4 rounded-2xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                <Smartphone className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                <span>Mobile Number</span>
              </div>
              {currentUser.phone && (
                <span className="text-[10px] bg-[var(--status-positive-bg)] text-[var(--status-positive)] border border-[var(--status-positive-border)] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <Check className="h-2.5 w-2.5" /> Linked
                </span>
              )}
            </div>

            <div>
              <label htmlFor={phoneId} className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Indian Mobile Number (+91)
              </label>
              <div className="flex items-center rounded-xl bg-[var(--bg-surface)] border border-[var(--border-strong)] focus-within:border-[var(--brand-primary)] focus-within:ring-2 focus-within:ring-[var(--status-positive-bg)] overflow-hidden transition-colors">
                <span className="px-3 text-xs font-semibold text-[var(--text-secondary)] bg-[var(--bg-surface-secondary)] border-r border-[var(--border-subtle)] select-none py-2.5 tabular-nums">
                  +91
                </span>
                <input
                  id={phoneId}
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="9876543210"
                  className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-[var(--text-primary)] font-mono outline-none"
                />
              </div>
            </div>

            {/* Smart Auto-Claim Explainer Card */}
            <div className="p-3 rounded-xl bg-[var(--status-positive-bg)] border border-[var(--status-positive-border)] text-[11px] text-[var(--text-secondary)] leading-relaxed flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-[var(--status-positive)] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[var(--status-positive)]">Smart Group Auto-Claim:</strong> If a friend previously added you to their trip or flat group using your phone number, adding your mobile number here will automatically link all past expenses, balances, and settlements to your real account.
              </div>
            </div>
          </div>

          {/* Section 3: UPI ID & QR Code */}
          <div className="p-4 rounded-2xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                <QrCode className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                <span>UPI Payment Address</span>
              </div>
              <div className="flex items-center gap-2">
                {(upiId || currentUser.upiId) && (
                  <button
                    type="button"
                    onClick={handleDeleteUpi}
                    disabled={deletingUpi || saving}
                    className="text-[11px] font-semibold text-[var(--status-negative)] flex items-center gap-1 transition-opacity px-2 py-0.5 rounded-lg bg-[var(--status-negative-bg)] border border-[var(--status-negative-border)] hover:opacity-90"
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
                    className="text-[11px] font-semibold text-[var(--status-positive)] hover:underline flex items-center gap-1"
                  >
                    {copiedUpi ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedUpi ? "Copied" : "Copy UPI"}</span>
                  </button>
                )}
              </div>
            </div>

            <div>
              <label htmlFor={upiIdInputId} className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Virtual Payment Address (VPA)
              </label>
              <div className="flex gap-2">
                <input
                  id={upiIdInputId}
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value.toLowerCase().trim())}
                  placeholder="e.g. 9876543210@ybl or name@okaxis"
                  className="h-10 flex-1 text-xs sm:text-sm bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-xl px-3.5 text-[var(--text-primary)] font-mono placeholder:text-[var(--text-secondary)] outline-none focus:border-[var(--brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--brand-dark)] dark:focus-visible:ring-[var(--brand-primary)] transition-colors"
                />
                {upiId.includes("@") && (
                  <button
                    type="button"
                    onClick={() => setShowQrModal(!showQrModal)}
                    className="px-3 rounded-xl border border-[var(--status-positive-border)] bg-[var(--status-positive-bg)] hover:opacity-90 text-[var(--status-positive)] text-xs font-semibold flex items-center gap-1.5 transition-opacity shrink-0"
                    title="View UPI QR Code"
                  >
                    <QrCode className="h-4 w-4" />
                    <span className="hidden sm:inline">QR Code</span>
                  </button>
                )}
              </div>

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
                    className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--brand-primary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {handle}
                  </button>
                ))}
              </div>
            </div>

            {/* Inline UPI QR Code View */}
            {showQrModal && qrCodeUrl && (
              <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--status-positive-border)] text-center space-y-3">
                <div className="text-xs font-semibold text-[var(--text-primary)]">Your Personal Settlement QR Code</div>
                <div className="inline-block p-3 rounded-xl bg-white border border-[#D8C8B5]">
                  <QrCodeImage
                    src={qrCodeUrl}
                    alt="UPI QR Code"
                    size={176}
                    fallbackLabel="UPI QR unavailable"
                    fallbackValue={upiId.trim()}
                  />
                </div>
                <div className="text-xs font-mono text-[var(--status-positive)] font-semibold">{upiId}</div>
                <div className="text-[11px] text-[var(--text-secondary)]">
                  Friends can scan this code with GPay, PhonePe, or Paytm to pay you back directly!
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Membership Tier & Currency */}
          <div className="p-4 rounded-2xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] space-y-3.5">
            <div className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
              <Crown className="h-3.5 w-3.5 text-[var(--accent-gold-ink)]" />
              <span>Preferences & Membership</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Membership Status Card */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                    <span>{currentUser.isPro ? "SplitRupee Pro" : "Free Account"}</span>
                    {currentUser.isPro && (
                      <span className="text-[11px] bg-[var(--status-warning-bg)] text-[var(--status-warning)] border border-[var(--status-warning-border)] px-1.5 py-0.5 rounded font-semibold">PRO</span>
                    )}
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                    {currentUser.isPro ? "AI Receipt OCR & recurring bills" : "Core group splitting features"}
                  </div>
                </div>
                {!currentUser.isPro && (
                  <a
                    href="/pro"
                    className="px-2.5 py-1 rounded-lg bg-[var(--accent-gold)] hover:bg-[var(--accent-gold-hover)] text-[#171613] text-xs font-semibold shrink-0 transition-colors"
                  >
                    Upgrade
                  </a>
                )}
              </div>

              {/* Base Display Currency */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                <div className="text-xs font-semibold text-[var(--text-primary)] mb-2">Display Currency</div>
                <div className="flex gap-1.5">
                  {(["INR", "USD", "EUR", "GBP"] as const).map((curr) => (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => setPreferredCurrency(curr)}
                      className={`flex-1 py-1 px-1.5 rounded-lg border text-[11px] tabular-nums font-semibold transition-colors ${
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

          {/* Section 5: Security & Account Actions */}
          <div className="p-4 rounded-2xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] space-y-2.5">
            <div className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
              <KeyRound className="h-3.5 w-3.5 text-[var(--accent-gold-ink)]" />
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
                  className="flex-1 h-9 px-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-xs font-medium text-[var(--text-primary)] flex items-center justify-center gap-2 transition-colors"
                >
                  <KeyRound className="h-3.5 w-3.5 text-[var(--accent-gold-ink)]" />
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
                  className="flex-1 h-9 px-3 rounded-xl border border-[var(--status-negative-border)] bg-[var(--status-negative-bg)] hover:opacity-90 text-xs font-semibold text-[var(--status-negative)] flex items-center justify-center gap-2 transition-opacity"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Log Out of Account</span>
                </button>
              )}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-10 px-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] hover:bg-[var(--bg-surface-hover)] text-xs font-medium text-[var(--text-primary)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex h-10 items-center gap-2 px-5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-[var(--brand-ink)] font-semibold text-xs transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </ModalPortal>
  );
}

