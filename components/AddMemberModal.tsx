"use client";

import React, { useState } from "react";
import { useUser } from "@/lib/userContext";
import { X, UserPlus, Check, Mail, Link as LinkIcon, Share2, QrCode, Copy } from "lucide-react";
import type { MemberDTO } from "@/lib/types";

export default function AddMemberModal({
  groupId,
  inviteCode,
  groupName,
  existingMembers,
  onClose,
  onAdded,
}: {
  groupId: string;
  inviteCode?: string | null;
  groupName?: string;
  existingMembers: MemberDTO[];
  onClose: () => void;
  onAdded: (newMember?: any) => void;
}) {
  const { currentUser, refreshUsers } = useUser();
  const [tab, setTab] = useState<"link" | "new">("link");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const effectiveCode = inviteCode || groupId;
  const joinUrl = typeof window !== "undefined"
    ? `${window.location.origin}/join/${effectiveCode}`
    : `http://localhost:3000/join/${effectiveCode}`;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    joinUrl
  )}`;

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  }

  function handleShareWhatsApp() {
    const text = `Join our group "${groupName || "SplitRupee"}" to split bills and track expenses: ${joinUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  }

  async function handleCreateAndAdd(e: React.FormEvent) {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim().replace(/\D/g, "").slice(-10);

    if (!cleanName) {
      setError("Member name is required");
      return;
    }
    if (cleanEmail && (!cleanEmail.includes("@") || !cleanEmail.includes("."))) {
      setError("Please enter a valid email address");
      return;
    }
    if (cleanPhone && cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    // Check if already in existingMembers list
    const isAlreadyMember = existingMembers?.some((m) => {
      const matchEmail = cleanEmail && m.email && m.email.toLowerCase() === cleanEmail.toLowerCase();
      const matchPhone = cleanPhone && m.phone && m.phone.replace(/\D/g, "").slice(-10) === cleanPhone;
      return matchEmail || matchPhone;
    });

    if (isAlreadyMember) {
      setError("This member is already in the group.");
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError("You're offline. Adding a new member requires an internet connection.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail || undefined,
          phone: cleanPhone || undefined,
          addedById: currentUser?.id,
        }),
      });
      const data = await res.json();
      if (data.offline) throw new Error("You're offline. Adding a new member requires an internet connection.");
      if (!res.ok || !data.ok) throw new Error(data.message || data.error || "Failed to add member");
      
      // Reset form fields
      setName("");
      setEmail("");
      setPhone("");
      setError("");

      // Notify parent immediately with newly added member
      onAdded(data.member);

      // Trigger user context refresh in background
      refreshUsers().catch(() => {});
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("splitrupee_refresh"));
      }
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[var(--overlay-backdrop)] p-0 sm:p-4 backdrop-blur-sm overflow-hidden animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-6 shadow-popover max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto"
      >
        <div className="sm:hidden flex justify-center mb-2 -mt-1">
          <div className="h-1 w-10 rounded-full bg-[var(--border-strong)]" />
        </div>
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="font-display text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-[var(--brand-primary)]" />
              Invite & Add Members
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Share an invite link, add contacts, or invite via email / mobile
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-xl border border-[var(--status-negative-border)] bg-[var(--status-negative-bg)] p-3 text-xs text-[var(--status-negative)]">
            {error}
          </div>
        )}

        {/* Tab switch */}
        <div className="mt-4 flex rounded-xl bg-[var(--bg-surface-secondary)] p-1 border border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => setTab("link")}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
              tab === "link"
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-card"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Invite Link & QR
          </button>
          <button
            type="button"
            onClick={() => setTab("new")}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
              tab === "new"
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-card"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Add by Email / Phone
          </button>
        </div>

        {tab === "link" && (
          <div className="mt-4 space-y-4 text-center">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-4">
              <div className="bg-white p-2 rounded-xl border border-[#E6E9E3]">
                <img src={qrCodeUrl} alt="Group Invite QR Code" className="h-28 w-28 object-contain" />
              </div>
              <div className="w-full">
                <p className="text-xs text-[var(--text-secondary)] font-medium truncate">
                  {joinUrl}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex-1 flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5 text-[var(--status-positive)]" /> : <LinkIcon className="h-3.5 w-3.5" />}
                    <span>{copiedLink ? "Copied Link!" : "Copy Link"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="flex-1 flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[var(--brand-dark)] dark:bg-[var(--brand-primary)] text-xs font-semibold text-white dark:text-[#171F1D] hover:opacity-95 transition-opacity"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </button>
                </div>

                {/* Group Invite Code Box */}
                <div className="mt-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3 flex items-center justify-between text-left">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold block">
                      Group Invite Code
                    </span>
                    <span className="font-display tabular-nums font-semibold text-sm sm:text-base text-[var(--brand-dark)] dark:text-[var(--brand-primary)] tracking-wider">
                      {effectiveCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(effectiveCode);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      } catch {}
                    }}
                    className="rounded-lg bg-[var(--status-positive-bg)] border border-[var(--status-positive-border)] px-3 py-1.5 text-xs font-semibold text-[var(--status-positive)] flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                  >
                    {copiedCode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedCode ? "Copied Code!" : "Copy Code"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "new" && (
          <form onSubmit={handleCreateAndAdd} className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)]">Full Name *</label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/70 outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--status-positive-bg)] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] flex items-center justify-between">
                <span>Mobile Number (Optional)</span>
                <span className="text-[11px] opacity-80">10-digit</span>
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-2.5 text-xs text-[var(--text-secondary)] tabular-nums">+91</span>
                <input
                  type="tel"
                  maxLength={16}
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    // If user enters/pastes number with +91 or country code or leading 0, extract the 10 digits
                    if (digits.length > 10) {
                      setPhone(digits.slice(-10));
                    } else {
                      setPhone(digits);
                    }
                  }}
                  className="h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] pl-11 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/70 outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--status-positive-bg)] tabular-nums transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] flex items-center justify-between">
                <span>Email Address (Optional)</span>
              </label>
              <input
                type="email"
                placeholder="e.g. rahul@example.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/70 outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--status-positive-bg)] transition-colors"
              />
            </div>
            <p className="text-[11px] text-[var(--status-positive)] leading-relaxed bg-[var(--status-positive-bg)] border border-[var(--status-positive-border)] rounded-xl p-2.5">
              You can add by name only, or include their mobile/email so their expenses auto-sync as soon as they sign up.
            </p>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 h-10 rounded-xl bg-[var(--brand-dark)] dark:bg-[var(--brand-primary)] text-xs font-semibold text-white dark:text-[#171F1D] hover:opacity-95 disabled:opacity-50 transition-opacity"
              >
                {loading ? "Adding..." : "Add to Group"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
