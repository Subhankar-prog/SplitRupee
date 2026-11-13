"use client";

import { useState, useEffect, useId, useRef } from "react";
import {
  Settings,
  Users,
  Shield,
  ShieldAlert,
  Trash2,
  LogOut,
  X,
  Loader2,
  Check,
  Share2,
  Crown,
  AlertTriangle,
  Plane,
  Home,
  Heart,
  Tag,
  DollarSign,
  Copy,
  GitMerge,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import type { MemberDTO, GroupTypeName } from "@/lib/types";
import { DEFAULT_AVATAR_COLOR, getAvatarTextColor } from "@/lib/avatarColors";
import { useDialogAccessibility, ModalPortal } from "@/components/ui/primitives";
import UserAvatar from "@/components/ui/UserAvatar";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  group: {
    id: string;
    name: string;
    description?: string | null;
    type: GroupTypeName;
    currency: string;
    inviteCode?: string | null;
    creatorId?: string | null;
  };
  currentUser: { id: string; name: string };
  members: MemberDTO[];
  balances: Record<string, number>;
  onGroupUpdated: (updatedGroup?: any) => void;
  onGroupDeleted: () => void;
  onExitedGroup: () => void;
}

export default function ManageGroupModal({
  isOpen,
  onClose,
  group,
  currentUser,
  members,
  balances,
  onGroupUpdated,
  onGroupDeleted,
  onExitedGroup,
}: Props) {
  const [activeTab, setActiveTab] = useState<"general" | "members" | "danger">("general");
  const baseId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Form State
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description || "");
  const [type, setType] = useState<GroupTypeName>(group.type || "OTHER");
  const [currency, setCurrency] = useState(group.currency || "INR");

  useEffect(() => {
    setName(group.name || "");
    setDescription(group.description || "");
    setType(group.type || "OTHER");
    setCurrency(group.currency || "INR");
  }, [group.id, group.name, group.description, group.type, group.currency]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Danger actions state
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmExitAdmin, setConfirmExitAdmin] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<MemberDTO | null>(null);
  const [removingMember, setRemovingMember] = useState(false);

  // Merge Duplicate Members state
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [sourceMemberId, setSourceMemberId] = useState("");
  const [targetMemberId, setTargetMemberId] = useState("");
  const [merging, setMerging] = useState(false);
  const [mergeError, setMergeError] = useState("");
  const [mergeSuccess, setMergeSuccess] = useState("");

  const handleMergeMembers = async () => {
    if (!sourceMemberId || !targetMemberId) {
      setMergeError("Please select both a duplicate member and an active member.");
      return;
    }
    if (sourceMemberId === targetMemberId) {
      setMergeError("Duplicate member and active member cannot be the same.");
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setMergeError("You're offline. Merging members requires an internet connection.");
      return;
    }

    try {
      setMerging(true);
      setMergeError("");
      setMergeSuccess("");

      const res = await fetch(`/api/groups/${group.id}/merge-members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUserId: sourceMemberId,
          targetUserId: targetMemberId,
          requesterId: currentUser.id,
        }),
      });

      const data = await res.json();
      if (data.offline) {
        throw new Error("You're offline. Merging members requires an internet connection.");
      }
      if (!res.ok || !data.ok) {
        throw new Error(data.message || data.error || "Failed to merge members");
      }

      setMergeSuccess(data.message || "Members merged successfully!");
      setSuccessMsg(data.message || "Members merged successfully!");

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("splitrupee_refresh", { detail: { groupId: group.id } })
        );
      }

      onGroupUpdated();

      setTimeout(() => {
        setShowMergeModal(false);
        setSourceMemberId("");
        setTargetMemberId("");
        setMergeSuccess("");
      }, 1500);
    } catch (err: any) {
      setMergeError(err.message || "Failed to merge members");
    } finally {
      setMerging(false);
    }
  };

  useDialogAccessibility(isOpen, onClose, dialogRef, saving || deleting);

  if (!isOpen) return null;

  // 1. Save Group Details
  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Group name cannot be empty");
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError("You're offline. Updating group settings requires an internet connection.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccessMsg("");

      const res = await fetch(`/api/groups/${group.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          type,
          currency,
          updatedById: currentUser.id,
        }),
      });

      const data = await res.json();
      if (data.offline) {
        throw new Error("You're offline. Updating group settings requires an internet connection.");
      }
      if (!res.ok || !data.ok) {
        throw new Error(data.message || data.error || "Failed to update group");
      }

      setSuccessMsg("Group settings updated successfully!");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("splitrupee_refresh"));
      }
      onGroupUpdated(data.group);
      setTimeout(() => {
        setSuccessMsg("");
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to update group settings");
    } finally {
      setSaving(false);
    }
  };

  // 2. Change Member Role (Make Admin / Demote)
  const handleRoleChange = async (targetUserId: string, newRole: "ADMIN" | "MEMBER") => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError("You're offline. Changing member roles requires an internet connection.");
      return;
    }
    try {
      setError("");
      const res = await fetch(`/api/groups/${group.id}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId,
          role: newRole,
          performedById: currentUser.id,
        }),
      });

      const data = await res.json();
      if (data.offline) {
        throw new Error("You're offline. Changing member roles requires an internet connection.");
      }
      if (!res.ok || !data.ok) {
        throw new Error(data.message || data.error || "Failed to change role");
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("splitrupee_refresh"));
      }
      onGroupUpdated();
    } catch (err: any) {
      setError(err.message || "Failed to change member role");
    }
  };

  // 3. Remove Member
  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError("You're offline. Removing a member requires an internet connection.");
      return;
    }
    try {
      setRemovingMember(true);
      setError("");

      const res = await fetch(
        `/api/groups/${group.id}/members?userId=${encodeURIComponent(memberToRemove.id)}&removedById=${encodeURIComponent(currentUser.id)}`,
        { method: "DELETE" }
      );

      const data = await res.json();
      if (data.offline) {
        throw new Error("You're offline. Removing a member requires an internet connection.");
      }
      if (!res.ok || !data.ok) {
        throw new Error(data.message || data.error || "Failed to remove member");
      }

      setMemberToRemove(null);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("splitrupee_refresh"));
      }
      onGroupUpdated();
    } catch (err: any) {
      setError(err.message || "Failed to remove member");
    } finally {
      setRemovingMember(false);
    }
  };

  // 4. Exit Group as Admin
  const handleExitGroup = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError("You're offline. Exiting a group requires an internet connection.");
      return;
    }
    try {
      setExiting(true);
      setError("");

      const res = await fetch(
        `/api/groups/${group.id}/members?userId=${encodeURIComponent(currentUser.id)}&removedById=${encodeURIComponent(currentUser.id)}`,
        { method: "DELETE" }
      );

      const data = await res.json();
      if (data.offline) {
        throw new Error("You're offline. Exiting a group requires an internet connection.");
      }
      if (!res.ok || !data.ok) {
        throw new Error(data.message || data.error || "Failed to exit group");
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("splitrupee_refresh", { detail: { groupId: group.id } }));
      }

      onExitedGroup();
    } catch (err: any) {
      setError(err.message || "Failed to exit group");
      setExiting(false);
    }
  };

  // 5. Delete Group Forever
  const handleDeleteGroup = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError("You're offline. Deleting a group requires an internet connection.");
      return;
    }
    try {
      setDeleting(true);
      setError("");

      const res = await fetch(`/api/groups/${group.id}?deletedById=${encodeURIComponent(currentUser.id)}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.offline) {
        throw new Error("You're offline. Deleting a group requires an internet connection.");
      }
      if (!res.ok || !data.ok) {
        throw new Error(data.message || data.error || "Failed to delete group");
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("splitrupee_refresh", { detail: { groupId: group.id } }));
      }

      onGroupDeleted();
    } catch (err: any) {
      setError(err.message || "Failed to delete group");
      setDeleting(false);
    }
  };

  const copyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/join/${group.inviteCode || group.id}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const copyInviteCode = () => {
    const code = group.inviteCode || group.id.slice(0, 8);
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const myBalance = balances[currentUser.id] ?? 0;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[var(--overlay-backdrop)] overscroll-contain touch-none sr-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving && !deleting) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${baseId}-modal-title`}
        tabIndex={-1}
        className="w-full max-w-xl max-h-[min(90vh,calc(100dvh-1.5rem))] flex flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-popover overflow-hidden outline-none sr-modal-panel"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)] shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[var(--status-positive-bg)] text-[var(--brand-dark)] dark:text-[var(--brand-primary)] border border-[var(--status-positive-border)]">
              <Shield className="h-5 w-5" />
            </span>
            <div>
              <h3 id={`${baseId}-modal-title`} className="font-display text-base sm:text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <span>Manage Group</span>
                <span className="text-[10px] bg-[var(--status-warning-bg)] text-[var(--status-warning)] border border-[var(--status-warning-border)] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <Crown className="h-3 w-3" /> Admin
                </span>
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">{group.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="h-11 w-11 sm:h-8 sm:w-8 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-1.5 gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === "general"
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-card"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            <span>General Settings</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("members")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === "members"
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-card"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Members & Roles ({members.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("danger")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === "danger"
                ? "bg-[var(--status-negative-bg)] text-[var(--status-negative)] border border-[var(--status-negative-border)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Danger Zone</span>
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-[var(--status-negative-bg)] border border-[var(--status-negative-border)] text-[var(--status-negative)] text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-[var(--status-positive-bg)] border border-[var(--status-positive-border)] text-[var(--status-positive)] text-xs flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: GENERAL SETTINGS */}
          {activeTab === "general" && (
            <form onSubmit={handleSaveDetails} className="space-y-4">
              <div>
                <label htmlFor={`${baseId}-name`} className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                  Group Name
                </label>
                <input
                  id={`${baseId}-name`}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Goa Trip 2026, Flat 402 Expenses"
                  className="h-10 w-full bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-xl px-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--brand-primary)] transition-colors"
                  required
                />
              </div>

              <div>
                <label htmlFor={`${baseId}-desc`} className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                  Group Description
                </label>
                <textarea
                  id={`${baseId}-desc`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add trip itinerary notes, expense rules, or a warm welcome message for group members..."
                  rows={3}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--brand-primary)] transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div role="group" aria-labelledby={`${baseId}-category-label`}>
                  <span id={`${baseId}-category-label`} className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                    Category Type
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(
                      [
                        { id: "TRIP", label: "Trip", icon: Plane },
                        { id: "HOME", label: "Home", icon: Home },
                        { id: "COUPLE", label: "Couple", icon: Heart },
                        { id: "OTHER", label: "Other", icon: Tag },
                      ] as const
                    ).map((t) => {
                      const Icon = t.icon;
                      const isSelected = type === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => setType(t.id)}
                          className={`cursor-pointer flex items-center gap-1.5 p-2 rounded-xl border text-xs font-medium transition-colors ${
                            isSelected
                              ? "bg-[var(--status-positive-bg)] border-[var(--status-positive-border)] text-[var(--brand-dark)] dark:text-[var(--brand-primary)]"
                              : "bg-[var(--bg-surface-secondary)] border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div role="group" aria-labelledby={`${baseId}-currency-label`}>
                  <span id={`${baseId}-currency-label`} className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                    Base Currency
                  </span>
                  <div className="flex gap-2">
                    {(["INR", "USD", "EUR", "GBP"] as const).map((curr) => (
                      <button
                        key={curr}
                        type="button"
                        aria-pressed={currency === curr}
                        onClick={() => setCurrency(curr)}
                        className={`cursor-pointer flex-1 py-2 px-2.5 rounded-xl border text-xs font-semibold tabular-nums transition-colors ${
                          currency === curr
                            ? "bg-[var(--status-positive-bg)] border-[var(--status-positive-border)] text-[var(--brand-dark)] dark:text-[var(--brand-primary)]"
                            : "bg-[var(--bg-surface-secondary)] border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        {curr === "INR" ? "₹ INR" : curr === "USD" ? "$ USD" : curr === "EUR" ? "€ EUR" : "£ GBP"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Invite Code & Link Card */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[var(--text-primary)]">Group Invite Code</div>
                    <div className="font-display tabular-nums text-sm font-semibold text-[var(--brand-dark)] dark:text-[var(--brand-primary)] mt-0.5 tracking-wider">
                      {group.inviteCode || group.id.slice(0, 8)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={copyInviteCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--status-positive-bg)] border border-[var(--status-positive-border)] text-xs font-semibold text-[var(--status-positive)] shrink-0 hover:opacity-90 transition-opacity"
                  >
                    {copiedCode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedCode ? "Copied Code" : "Copy Code"}</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] text-[var(--text-secondary)] truncate">
                      Full invite link for direct web or WhatsApp sharing
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={copyInviteLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-primary)] shrink-0 transition-colors"
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5 text-[var(--status-positive)]" /> : <Share2 className="h-3.5 w-3.5" />}
                    <span>{copiedLink ? "Copied Link" : "Copy Link"}</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex h-10 items-center gap-2 px-5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-[var(--brand-ink)] font-semibold text-xs transition-colors disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: MEMBERS & ROLES */}
          {activeTab === "members" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] pb-1">
                <span>Manage member permissions, admin status, and access</span>
                <span className="font-semibold text-[var(--text-primary)] tabular-nums">{members.length} Total</span>
              </div>

              {/* Merge Duplicate Members Action Card */}
              {members.length >= 2 && (
                <div className="p-3.5 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-lg bg-[var(--status-positive-bg)] text-[var(--brand-dark)] dark:text-[var(--brand-primary)] border border-[var(--status-positive-border)] shrink-0">
                        <GitMerge className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                          <span>Merge Duplicate Members</span>
                          <span className="text-[11px] bg-[var(--status-positive-bg)] text-[var(--status-positive)] border border-[var(--status-positive-border)] px-2 py-0.5 rounded font-semibold">1-Click</span>
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)] truncate">
                          Added someone by phone and they joined with Google? Merge them here
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMergeModal(!showMergeModal);
                        setMergeError("");
                        setMergeSuccess("");
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-[var(--brand-ink)] font-semibold text-xs shrink-0 transition-colors"
                    >
                      {showMergeModal ? "Cancel" : "Merge Members"}
                    </button>
                  </div>

                  {/* Expandable Merge Sub-Panel */}
                  {showMergeModal && (
                    <div className="pt-3 border-t border-[var(--border-subtle)] space-y-3">
                      {mergeError && (
                        <div className="p-2.5 rounded-xl bg-[var(--status-negative-bg)] border border-[var(--status-negative-border)] text-[var(--status-negative)] text-xs flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          <span>{mergeError}</span>
                        </div>
                      )}

                      {mergeSuccess && (
                        <div className="p-2.5 rounded-xl bg-[var(--status-positive-bg)] border border-[var(--status-positive-border)] text-[var(--status-positive)] text-xs flex items-center gap-2">
                          <Check className="h-4 w-4 shrink-0" />
                          <span>{mergeSuccess}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                        {/* Source Member */}
                        <div>
                          <label htmlFor={`${baseId}-source`} className="block text-[11px] font-semibold text-[var(--status-warning)] mb-1">
                            1. Select Duplicate / Old Profile (To Remove)
                          </label>
                          <select
                            id={`${baseId}-source`}
                            value={sourceMemberId}
                            onChange={(e) => setSourceMemberId(e.target.value)}
                            className="h-9 w-full text-xs bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-xl px-3 text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)]"
                          >
                            <option value="">-- Choose duplicate member --</option>
                            {members.map((m) => {
                              const isPlaceholder =
                                m.email?.endsWith("@splitrupee.in") ||
                                m.name.startsWith("Member ") ||
                                m.name.startsWith("user.");
                              const bal = balances[m.id] ?? 0;
                              return (
                                <option
                                  key={m.id}
                                  value={m.id}
                                  disabled={m.id === targetMemberId}
                                >
                                  {m.name} {isPlaceholder ? "(Phone Placeholder)" : ""} -{" "}
                                  {bal > 0 ? `+₹${Math.round(bal)}` : bal < 0 ? `-₹${Math.round(-bal)}` : "₹0"}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        {/* Target Member */}
                        <div>
                          <label htmlFor={`${baseId}-target`} className="block text-[11px] font-semibold text-[var(--status-positive)] mb-1">
                            2. Select Real / Active Account (To Keep)
                          </label>
                          <select
                            id={`${baseId}-target`}
                            value={targetMemberId}
                            onChange={(e) => setTargetMemberId(e.target.value)}
                            className="h-9 w-full text-xs bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-xl px-3 text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)]"
                          >
                            <option value="">-- Choose active member --</option>
                            {members.map((m) => {
                              const bal = balances[m.id] ?? 0;
                              return (
                                <option
                                  key={m.id}
                                  value={m.id}
                                  disabled={m.id === sourceMemberId}
                                >
                                  {m.name} ({m.email || "No email"}) -{" "}
                                  {bal > 0 ? `+₹${Math.round(bal)}` : bal < 0 ? `-₹${Math.round(-bal)}` : "₹0"}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>

                      {/* Live Combined Balance Preview */}
                      {sourceMemberId && targetMemberId && (
                        <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs space-y-1.5">
                          <div className="font-semibold text-[var(--text-primary)] flex items-center justify-between">
                            <span>Balance Transfer Preview:</span>
                            <span className="font-display tabular-nums text-[var(--status-positive)] font-semibold">
                              New Balance: ₹
                              {Math.round(
                                (balances[sourceMemberId] ?? 0) + (balances[targetMemberId] ?? 0)
                              )}
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                            All expenses, splits, debts, and payments from{" "}
                            <strong className="text-[var(--text-primary)]">
                              {members.find((m) => m.id === sourceMemberId)?.name}
                            </strong>{" "}
                            will transfer directly to{" "}
                            <strong className="text-[var(--status-positive)]">
                              {members.find((m) => m.id === targetMemberId)?.name}
                            </strong>
                            . The duplicate profile will be cleanly removed.
                          </p>
                        </div>
                      )}

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowMergeModal(false)}
                          disabled={merging}
                          className="px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleMergeMembers}
                          disabled={merging || !sourceMemberId || !targetMemberId}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-[var(--brand-ink)] text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          {merging ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <UserCheck className="h-3.5 w-3.5" />
                          )}
                          <span>Confirm & Merge</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                {members.map((m) => {
                  const isCurrent = m.id === currentUser.id;
                  const isMemberAdmin = m.role === "ADMIN" || m.id === group.creatorId;
                  const memberBal = balances[m.id] ?? 0;

                  return (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar
                          name={m.name}
                          avatarUrl={m.avatarUrl}
                          avatarColor={m.avatarColor}
                          size="md"
                          shape="square"
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] break-words leading-tight">
                              {m.name}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] text-[var(--text-secondary)]">(You)</span>
                            )}
                            {isMemberAdmin ? (
                              <span className="text-[10px] bg-[var(--status-warning-bg)] text-[var(--status-warning)] border border-[var(--status-warning-border)] px-1.5 py-0.5 rounded font-semibold flex items-center gap-1 shrink-0">
                                <Crown className="h-2.5 w-2.5" /> Admin
                              </span>
                            ) : (
                              <span className="text-[10px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] px-1.5 py-0.5 rounded font-medium shrink-0">
                                Member
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[var(--text-secondary)] flex flex-wrap items-center gap-1.5 mt-0.5">
                            {m.email && <span className="break-all">{m.email}</span>}
                            {m.email && <span>•</span>}
                            <span
                              className={`font-semibold tabular-nums ${
                                memberBal > 0 ? "text-[var(--status-positive)]" : memberBal < 0 ? "text-[var(--status-negative)]" : "text-[var(--text-secondary)]"
                              }`}
                            >
                              {memberBal > 0 ? `+₹${Math.round(memberBal)}` : memberBal < 0 ? `-₹${Math.round(-memberBal)}` : "Settled"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons (only for other members) */}
                      {!isCurrent && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isMemberAdmin ? (
                            <button
                              type="button"
                              onClick={() => handleRoleChange(m.id, "MEMBER")}
                              className="px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[11px] font-medium transition-colors"
                              title="Demote to standard Member"
                            >
                              Demote
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRoleChange(m.id, "ADMIN")}
                              className="px-2.5 py-1.5 rounded-lg border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] hover:opacity-90 text-[var(--status-warning)] text-[11px] font-semibold flex items-center gap-1 transition-opacity"
                              title="Promote to Group Admin"
                            >
                              <Crown className="h-3 w-3" />
                              <span>Make Admin</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setMemberToRemove(m)}
                            className="p-1.5 rounded-lg border border-[var(--status-negative-border)] bg-[var(--status-negative-bg)] text-[var(--status-negative)] hover:opacity-90 transition-opacity"
                            title="Remove member from group"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Remove Member Confirmation Sub-Modal */}
              {memberToRemove && (
                <div className="p-4 rounded-xl bg-[var(--status-negative-bg)] border border-[var(--status-negative-border)] space-y-3">
                  <div className="flex items-center gap-2 text-[var(--status-negative)] text-xs font-semibold">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Confirm Removal of {memberToRemove.name}</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Are you sure you want to remove <strong className="text-[var(--text-primary)]">{memberToRemove.name}</strong> from this group?
                    {(balances[memberToRemove.id] ?? 0) !== 0 && (
                      <span className="block mt-1 text-[var(--status-warning)] tabular-nums">
                        Notice: This member currently has an unsettled balance of ₹
                        {Math.round(balances[memberToRemove.id] ?? 0)}.
                      </span>
                    )}
                  </p>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setMemberToRemove(null)}
                      disabled={removingMember}
                      className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmRemoveMember}
                      disabled={removingMember}
                      className="px-3 py-1.5 rounded-lg bg-[var(--status-negative)] hover:opacity-95 text-white dark:text-[#171613] text-xs font-semibold flex items-center gap-1"
                    >
                      {removingMember && <Loader2 className="h-3 w-3 animate-spin" />}
                      <span>Yes, Remove</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DANGER ZONE */}
          {activeTab === "danger" && (
            <div className="space-y-4">
              {/* Exit Group Card */}
              <div className="p-4 rounded-xl border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LogOut className="h-4 w-4 text-[var(--status-warning)]" />
                    <span className="text-xs font-semibold text-[var(--text-primary)]">Exit Group (Admin Resignation)</span>
                  </div>
                  <span className="text-[10px] text-[var(--status-warning)] font-semibold uppercase">Automatic Handoff</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  As a Group Admin, if you leave this group, our automated engine will <strong className="text-[var(--text-primary)]">randomly appoint one of the remaining members as the new Group Admin</strong>.
                  {myBalance !== 0 && (
                    <span className="block mt-1 font-semibold text-[var(--status-warning)] tabular-nums">
                      Your current standing: {myBalance > 0 ? `Get back ₹${Math.round(myBalance)}` : `Owe ₹${Math.round(-myBalance)}`}.
                    </span>
                  )}
                </p>
                {!confirmExitAdmin ? (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setConfirmExitAdmin(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--status-warning)] text-[var(--status-warning)] hover:text-white dark:hover:text-[#171613] border border-[var(--status-warning-border)] font-semibold text-xs transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Exit Group & Transfer Admin</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--status-warning-border)] space-y-2.5">
                    <div className="flex items-center gap-1.5 font-semibold text-[var(--status-warning)] text-xs">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>Confirm Admin Resignation & Exit</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      Are you sure you want to resign as Group Admin and exit <strong className="text-[var(--text-primary)]">{group.name}</strong>? One of the remaining {members.length - 1} members will be randomly promoted to Admin.
                    </p>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setConfirmExitAdmin(false)}
                        disabled={exiting}
                        className="flex-1 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleExitGroup}
                        disabled={exiting}
                        className="flex-1 py-1.5 rounded-lg bg-[var(--accent-gold)] hover:bg-[var(--accent-gold-hover)] text-[#171613] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        {exiting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        <span>Yes, Confirm Exit</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Delete Group Card */}
              <div className="p-4 rounded-xl border border-[var(--status-negative-border)] bg-[var(--status-negative-bg)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4 text-[var(--status-negative)]" />
                    <span className="text-xs font-semibold text-[var(--text-primary)]">Delete Group Permanently</span>
                  </div>
                  <span className="text-[10px] text-[var(--status-negative)] font-semibold uppercase">Irreversible</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Permanently deletes <strong className="text-[var(--text-primary)]">{group.name}</strong>, erasing all associated expenses, split breakdowns, payment settlements, and activity logs.
                </p>

                {confirmDelete ? (
                  <div className="pt-2 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--status-negative-border)] space-y-2">
                    <p className="text-xs text-[var(--status-negative)] font-semibold">
                      Are you completely sure? This will delete all financial history for all {members.length} members.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        disabled={deleting}
                        className="flex-1 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteGroup}
                        disabled={deleting}
                        className="flex-1 py-1.5 rounded-lg bg-[var(--status-negative)] hover:opacity-95 text-white dark:text-[#171613] text-xs font-semibold flex items-center justify-center gap-1"
                      >
                        {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        <span>Confirm Permanent Delete</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="px-4 py-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--status-negative)] text-[var(--status-negative)] hover:text-white dark:hover:text-[#171613] border border-[var(--status-negative-border)] font-semibold text-xs transition-colors"
                    >
                      Delete This Group
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </ModalPortal>
  );
}
