"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/lib/userContext";
import { DEFAULT_AVATAR_COLOR, getAvatarTextColor } from "@/lib/avatarColors";
import { Users, CheckCircle2, ArrowRight, Loader2, Sparkles, Plane, Home, Heart, Tag } from "lucide-react";

import Link from "next/link";

export default function JoinGroupPage({ params: routeParams }: { params?: { code?: string } }) {
  const hookParams = useParams();
  const router = useRouter();
  const rawCode = routeParams?.code || hookParams?.code;
  const pathCode = typeof window !== "undefined" ? window.location.pathname.split("/join/")[1]?.split("/")[0]?.split("?")[0] : "";
  const unresolvedCode = (Array.isArray(rawCode) ? rawCode[0] : rawCode) || pathCode || "";
  const code = unresolvedCode ? decodeURIComponent(unresolvedCode).trim() : "";
  const { currentUser, users, setCurrentUser } = useUser();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("Joined Group Successfully!");

  async function handleJoin(targetUserId?: string) {
    const uid = targetUserId || currentUser?.id;
    if (!uid) {
      setError("Please select or create an account first");
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError("You're offline. Internet connection is required to join a group.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: code, userId: uid }),
      });
      const data = await res.json();
      if (data.offline) {
        throw new Error("You're offline. Internet connection is required to join a group.");
      }
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to join group");
      }

      if (data.alreadyMember) {
        setSuccessMessage("You are already a member of this group!");
      } else {
        setSuccessMessage("Joined Group Successfully!");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/groups/${data.group.id}`);
      }, 800);
    } catch (e: any) {
      setError(e.message || "Failed to join group");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-[var(--shadow-popover)] text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--status-positive-bg)] text-[var(--brand-dark)] dark:text-[var(--brand-primary)] border border-[var(--status-positive-border)]">
          <Users className="h-7 w-7" />
        </div>

        <div>
          <h1 className="font-display text-xl font-semibold text-[var(--text-primary)] tracking-tight">
            You&apos;re Invited to Join a Group
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Invite Code: <span className="font-mono text-[var(--brand-dark)] dark:text-[var(--brand-primary)] font-semibold">{code}</span>
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-[var(--status-negative-border)] bg-[var(--status-negative-bg)] p-3.5 text-xs text-[var(--status-negative)] space-y-2.5">
            <p className="font-medium">{error}</p>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Please check the code or ask the group admin to copy their Invite Code from the group header.
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <Link
                href="/dashboard"
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] px-3 py-1.5 text-xs text-[var(--text-primary)] font-medium transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/groups"
                className="rounded-lg bg-[var(--status-positive-bg)] border border-[var(--status-positive-border)] px-3 py-1.5 text-xs text-[var(--status-positive)] font-medium transition-opacity hover:opacity-90"
              >
                Your Groups
              </Link>
            </div>
          </div>
        )}

        {success ? (
          <div className="rounded-2xl border border-[var(--status-positive-border)] bg-[var(--status-positive-bg)] p-4 text-[var(--status-positive)] space-y-1">
            <CheckCircle2 className="mx-auto h-6 w-6" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">{successMessage}</p>
            <p className="text-xs text-[var(--text-secondary)]">Redirecting to group dashboard...</p>
          </div>
        ) : (
          <>
            {currentUser ? (
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-4 space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl font-semibold text-xs"
                    style={{
                      background: currentUser.avatarColor || DEFAULT_AVATAR_COLOR,
                      color: getAvatarTextColor(currentUser.avatarColor || DEFAULT_AVATAR_COLOR),
                    }}
                  >
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-[var(--text-primary)]">{currentUser.name}</p>
                    <p className="text-[11px] text-[var(--text-secondary)]">{currentUser.email}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleJoin()}
                  disabled={loading}
                  className="w-full h-10 flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-xs font-semibold text-[var(--brand-ink)] disabled:opacity-50 transition-colors"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  <span>Join Group as {currentUser.name}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-left">
                <p className="text-xs font-medium text-[var(--text-secondary)] text-center">
                  Select which profile to join with:
                </p>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {users.map((u) => (
                    <button
                      type="button"
                      key={u.id}
                      onClick={() => {
                        setCurrentUser(u);
                        handleJoin(u.id);
                      }}
                      className="w-full flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-2.5 hover:border-[var(--brand-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-lg font-semibold text-[11px]"
                          style={{
                            background: u.avatarColor || DEFAULT_AVATAR_COLOR,
                            color: getAvatarTextColor(u.avatarColor || DEFAULT_AVATAR_COLOR),
                          }}
                        >
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold text-[var(--text-primary)]">{u.name}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-[var(--brand-dark)] dark:text-[var(--brand-primary)]">Join →</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
