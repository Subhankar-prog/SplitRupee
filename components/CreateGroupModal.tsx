"use client";

import React, { useId, useRef, useState } from "react";
import { useUser } from "@/lib/userContext";
import { useDialogAccessibility, ModalPortal } from "@/components/ui/primitives";
import { X, Plane, Home, Heart, Tag, Check, Users, Plus, UserPlus, Info } from "lucide-react";
import type { GroupTypeName } from "@/lib/types";

const GROUP_TYPES: { type: GroupTypeName; label: string; icon: typeof Plane }[] = [
  { type: "TRIP", label: "Trip", icon: Plane },
  { type: "HOME", label: "Home / Flat", icon: Home },
  { type: "COUPLE", label: "Couple", icon: Heart },
  { type: "OTHER", label: "Other / Project", icon: Tag },
];

export default function CreateGroupModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (groupId: string) => void;
}) {
  const { currentUser } = useUser();
  const baseId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<GroupTypeName>("TRIP");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useDialogAccessibility(true, onClose, dialogRef, loading);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a group name");
      return;
    }
    if (!currentUser) {
      setError("You must be logged in to create a group");
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError("You're offline. Creating a new shared group requires an internet connection.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          type,
          currency: "INR",
          memberUserIds: [currentUser.id],
          createdById: currentUser.id,
        }),
      });

      const data = await res.json();
      if (data.offline) {
        throw new Error("You're offline. Creating a new shared group requires an internet connection.");
      }
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to create group");
      }

      onCreated(data.group.id);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
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
        aria-labelledby={`${baseId}-title`}
        tabIndex={-1}
        className="relative w-full max-w-lg max-h-[min(92vh,calc(100dvh-1.5rem))] flex flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-popover overflow-hidden outline-none sr-modal-panel"
      >
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border-subtle)] shrink-0">
          <div>
            <h2
              id={`${baseId}-title`}
              className="font-display text-base sm:text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2"
            >
              <Users className="h-5 w-5 text-[var(--brand-primary)] shrink-0" aria-hidden="true" />
              <span>Create New Group</span>
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Organize expenses with roommates, trips, or friends
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="grid h-10 w-10 sm:h-8 sm:w-8 place-items-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-surface-secondary)] hover:text-[var(--text-primary)] transition-colors shrink-0"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form id={`${baseId}-form`} onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4">
          {error && (
            <div className="rounded-xl border border-[var(--status-negative-border)] bg-[var(--status-negative-bg)] p-3 text-xs text-[var(--status-negative)]">
              {error}
            </div>
          )}

          {/* Group Name */}
          <div>
            <label htmlFor={`${baseId}-name`} className="text-xs font-medium text-[var(--text-secondary)]">Group Name</label>
            <input
              id={`${baseId}-name`}
              type="text"
              placeholder="e.g. Manali Road Trip or Flat 402 Rent"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 h-10 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:border-[var(--brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--brand-dark)] dark:focus-visible:ring-[var(--brand-primary)] transition-colors"
            />
          </div>

          {/* Group Description */}
          <div>
            <label htmlFor={`${baseId}-desc`} className="text-xs font-medium text-[var(--text-secondary)]">
              Description <span className="text-[11px] font-normal opacity-80">(Optional)</span>
            </label>
            <textarea
              id={`${baseId}-desc`}
              placeholder="Add trip dates, apartment rules, or a short note..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:border-[var(--brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--brand-dark)] dark:focus-visible:ring-[var(--brand-primary)] resize-none transition-colors"
            />
          </div>

          {/* Group Type */}
          <div role="group" aria-labelledby={`${baseId}-type-label`}>
            <span id={`${baseId}-type-label`} className="text-xs font-medium text-[var(--text-secondary)]">Group Type</span>
            <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {GROUP_TYPES.map((gt) => {
                const Icon = gt.icon;
                const isSelected = type === gt.type;
                return (
                  <button
                    key={gt.type}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setType(gt.type)}
                    className={`cursor-pointer flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-xs font-medium transition-colors ${
                      isSelected
                        ? "border-[var(--brand-primary)] bg-[var(--status-positive-bg)] text-[var(--brand-dark)] dark:text-[var(--brand-primary)]"
                        : "border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{gt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Invite Members Guidance Card */}
          <div className="rounded-xl border border-[var(--status-positive-border)] bg-[var(--status-positive-bg)] p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--status-positive)]">
              <UserPlus className="h-4 w-4 shrink-0" />
              <span>Inviting Group Members</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              You will automatically be added as the group creator. Once the group is created, you can invite your flatmates, friends, or travel companions anytime via private invite link or WhatsApp.
            </p>
          </div>
        </form>

        {/* Fixed Action Footer */}
        <div className="flex gap-2.5 p-3.5 sm:p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form={`${baseId}-form`}
            disabled={loading}
            className="flex-1 h-10 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-xs font-semibold text-[var(--brand-ink)] disabled:opacity-50 transition-colors cursor-pointer"
          >
            {loading ? "Creating..." : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  </ModalPortal>
  );
}
