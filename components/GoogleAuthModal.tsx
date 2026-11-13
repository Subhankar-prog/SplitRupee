"use client";

import React, { useId, useRef, useState } from "react";
import { X, ShieldCheck, User, Loader2, ArrowRight } from "lucide-react";
import { useUser } from "@/lib/userContext";
import { useRouter } from "next/navigation";
import { BOTANICAL_AVATAR_COLORS, getAvatarTextColor } from "@/lib/avatarColors";
import { useDialogAccessibility, ModalPortal } from "@/components/ui/primitives";
import UserAvatar from "@/components/ui/UserAvatar";

interface Props {
  onClose: () => void;
  onSuccess?: (data: any) => void;
}

export default function GoogleAuthModal({ onClose, onSuccess }: Props) {
  const router = useRouter();
  const titleId = useId();
  const nameId = useId();
  const emailId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const { login, refreshUsers } = useUser();
  const [name, setName] = useState("Subhankar Das");
  const [email, setEmail] = useState("subhankar.das@gmail.com");
  const [avatarUrl, setAvatarUrl] = useState(
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customMode, setCustomMode] = useState(false);

  useDialogAccessibility(true, onClose, dialogRef, loading);

  const presetAccounts = [
    {
      name: "Subhankar Das",
      email: "subhankar.das@gmail.com",
      avatarColor: BOTANICAL_AVATAR_COLORS[1].hex,
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80",
      googleId: "google-subhankar-das-101",
    },
    {
      name: "Aarav Sharma",
      email: "aarav.sharma@gmail.com",
      avatarColor: BOTANICAL_AVATAR_COLORS[3].hex,
      avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=160&q=80",
      googleId: "google-aarav-sharma-102",
    },
    {
      name: "Diya Patel",
      email: "diya.patel@gmail.com",
      avatarColor: BOTANICAL_AVATAR_COLORS[7].hex,
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
      googleId: "google-diya-patel-103",
    },
  ];

  async function handleAuthorize(
    selectedName: string,
    selectedEmail: string,
    selectedAvatarUrl?: string,
    selectedGoogleId?: string
  ) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleUser: {
            name: selectedName,
            email: selectedEmail,
            avatarUrl: selectedAvatarUrl,
            googleId: selectedGoogleId,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Google authorization failed");
      }
      onClose();
      if (onSuccess) {
        onSuccess(data);
      } else {
        if (!data.isNewUser && data.user) {
          login(data.user);
          await refreshUsers();
          router.push("/dashboard");
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[var(--overlay-backdrop)] overscroll-contain touch-none sr-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="w-full max-w-md max-h-[min(90vh,calc(100dvh-1.5rem))] flex flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-popover overflow-hidden outline-none sr-modal-panel"
      >
        {/* Header with Google Logo */}
        <div className="flex items-start justify-between p-5 border-b border-[var(--border-subtle)] shrink-0">
          <div className="flex items-center gap-3">
            <svg className="h-7 w-7 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"/>
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
              <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"/>
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
            </svg>
            <div>
              <h3 id={titleId} className="font-display text-base font-semibold text-[var(--text-primary)]">Sign in with Google</h3>
              <p className="text-xs text-[var(--text-secondary)]">Choose an account to continue to SplitRupee</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="grid h-10 w-10 sm:h-8 sm:w-8 place-items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shrink-0"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 space-y-5">

        {/* Setup Tip Banner */}
        <div className="rounded-xl border border-[var(--status-positive-border)] bg-[var(--status-positive-bg)] p-3 text-[11px] text-[var(--text-secondary)] space-y-1">
          <p className="font-semibold text-[var(--status-positive)]">Ready for live Google OAuth</p>
          <p className="leading-relaxed">
            Configure <code className="text-[var(--text-primary)]">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> in <code className="text-[var(--text-primary)]">.env</code> for the live Google chooser, or sign in with an account below:
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-[var(--status-negative-border)] bg-[var(--status-negative-bg)] p-3 text-xs text-[var(--status-negative)]">
            {error}
          </div>
        )}

        {/* Account Selector List */}
        {!customMode ? (
          <div className="space-y-2">
            {presetAccounts.map((acc) => (
              <button
                key={acc.email}
                type="button"
                disabled={loading}
                onClick={() => handleAuthorize(acc.name, acc.email, acc.avatarUrl, acc.googleId)}
                className="w-full flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-3.5 hover:border-[var(--brand-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar
                    name={acc.name}
                    avatarUrl={acc.avatarUrl}
                    avatarColor={acc.avatarColor}
                    size="lg"
                    shape="circle"
                  />
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-primary)]">{acc.name}</p>
                    <p className="text-[11px] text-[var(--text-secondary)]">{acc.email}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--text-secondary)]" />
              </button>
            ))}

            <button
              type="button"
              onClick={() => setCustomMode(true)}
              className="w-full rounded-xl border border-dashed border-[var(--border-strong)] p-3 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--brand-primary)] transition-colors text-center"
            >
              + Use another Google account
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name && email) handleAuthorize(name, email, avatarUrl, `custom-google-${Date.now()}`);
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor={nameId} className="text-xs font-medium text-[var(--text-secondary)]">Google Account Name</label>
              <input
                id={nameId}
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Subhankar Das"
                className="mt-1 h-10 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:border-[var(--brand-primary)]"
              />
            </div>
            <div>
              <label htmlFor={emailId} className="text-xs font-medium text-[var(--text-secondary)]">Google Email Address</label>
              <input
                id={emailId}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="subhankar@gmail.com"
                className="mt-1 h-10 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:border-[var(--brand-primary)]"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCustomMode(false)}
                className="h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] px-4 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 h-10 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-xs font-semibold text-[var(--brand-ink)] transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue as " + name}
              </button>
            </div>
          </form>
        )}
        </div>

        <div className="p-3.5 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0 flex items-center justify-center gap-2 text-[11px] text-[var(--text-secondary)]">
          <ShieldCheck className="h-3.5 w-3.5 text-[var(--status-positive)] shrink-0" />
          <span>To continue, Google will share your name, email address, and profile picture with SplitRupee.</span>
        </div>
      </div>
    </div>
  </ModalPortal>
  );
}
