"use client";

import { useState, useEffect } from "react";
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
  DollarSign
} from "lucide-react";
import type { MemberDTO, GroupTypeName } from "@/lib/types";

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

  // Danger actions state
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmExitAdmin, setConfirmExitAdmin] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<MemberDTO | null>(null);
  const [removingMember, setRemovingMember] = useState(false);

  if (!isOpen) return null;

  // 1. Save Group Details
  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Group name cannot be empty");
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
    try {
      setRemovingMember(true);
      setError("");

      const res = await fetch(
        `/api/groups/${group.id}/members?userId=${encodeURIComponent(memberToRemove.id)}&removedById=${encodeURIComponent(currentUser.id)}`,
        { method: "DELETE" }
      );

      const data = await res.json();
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
    try {
      setExiting(true);
      setError("");

      const res = await fetch(
        `/api/groups/${group.id}/members?userId=${encodeURIComponent(currentUser.id)}&removedById=${encodeURIComponent(currentUser.id)}`,
        { method: "DELETE" }
      );

      const data = await res.json();
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
    try {
      setDeleting(true);
      setError("");

      const res = await fetch(`/api/groups/${group.id}?deletedById=${encodeURIComponent(currentUser.id)}`, {
        method: "DELETE",
      });

      const data = await res.json();
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

  const myBalance = balances[currentUser.id] ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border border-white/10 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Shield className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Manage Group</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Crown className="h-3 w-3 text-amber-400" /> Admin
                </span>
              </h3>
              <p className="text-xs text-slate-400">{group.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-slate-950/40 p-1.5 gap-1 shrink-0">
          <button
            onClick={() => setActiveTab("general")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              activeTab === "general"
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            <span>General Settings</span>
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              activeTab === "members"
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Members & Roles ({members.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("danger")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              activeTab === "danger"
                ? "bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Danger Zone</span>
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: GENERAL SETTINGS */}
          {activeTab === "general" && (
            <form onSubmit={handleSaveDetails} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Group Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Goa Trip 2026, Flat 402 Expenses"
                  className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Group Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add trip itinerary notes, expense rules, or a warm welcome message for group members..."
                  rows={3}
                  className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Category Type
                  </label>
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
                          onClick={() => setType(t.id)}
                          className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-semibold transition ${
                            isSelected
                              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm"
                              : "bg-slate-950/50 border-white/5 text-slate-400 hover:text-white"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Base Currency
                  </label>
                  <div className="flex gap-2">
                    {(["INR", "USD", "EUR", "GBP"] as const).map((curr) => (
                      <button
                        key={curr}
                        type="button"
                        onClick={() => setCurrency(curr)}
                        className={`flex-1 py-2 px-2.5 rounded-xl border text-xs font-bold font-mono transition ${
                          currency === curr
                            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm"
                            : "bg-slate-950/50 border-white/5 text-slate-400 hover:text-white"
                        }`}
                      >
                        {curr === "INR" ? "₹ INR" : curr === "USD" ? "$ USD" : curr === "EUR" ? "€ EUR" : "£ GBP"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Invite Link Card */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white">Private Group Invite Link</div>
                  <div className="text-[11px] text-slate-400 truncate">
                    Share with friends so they can join this group directly
                  </div>
                </div>
                <button
                  type="button"
                  onClick={copyInviteLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 shrink-0 transition"
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
                  <span>{copiedLink ? "Copied" : "Copy Link"}</span>
                </button>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
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
              <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                <span>Manage member permissions, admin status, and access</span>
                <span className="font-semibold text-white">{members.length} Total</span>
              </div>

              <div className="space-y-2">
                {members.map((m) => {
                  const isCurrent = m.id === currentUser.id;
                  const isMemberAdmin = m.role === "ADMIN" || m.id === group.creatorId;
                  const memberBal = balances[m.id] ?? 0;

                  return (
                    <div
                      key={m.id}
                      className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold text-slate-950 shrink-0"
                          style={{ backgroundColor: m.avatarColor || "#10b981" }}
                        >
                          {m.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-semibold text-white truncate">
                              {m.name}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] text-slate-400 font-mono">(You)</span>
                            )}
                            {isMemberAdmin ? (
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold flex items-center gap-1 shrink-0">
                                <Crown className="h-2.5 w-2.5 text-amber-400" /> Admin
                              </span>
                            ) : (
                              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-medium shrink-0">
                                Member
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2">
                            {m.email && <span className="truncate">{m.email}</span>}
                            <span>•</span>
                            <span
                              className={`font-semibold ${
                                memberBal > 0 ? "text-emerald-400" : memberBal < 0 ? "text-rose-400" : "text-slate-400"
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
                              className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition"
                              title="Demote to standard Member"
                            >
                              Demote
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRoleChange(m.id, "ADMIN")}
                              className="px-2.5 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[11px] font-bold flex items-center gap-1 transition"
                              title="Promote to Group Admin"
                            >
                              <Crown className="h-3 w-3" />
                              <span>Make Admin</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setMemberToRemove(m)}
                            className="p-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
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
                <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-rose-300 text-xs font-bold">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Confirm Removal of {memberToRemove.name}</span>
                  </div>
                  <p className="text-xs text-rose-200/80 leading-relaxed">
                    Are you sure you want to remove <strong className="text-white">{memberToRemove.name}</strong> from this group?
                    {(balances[memberToRemove.id] ?? 0) !== 0 && (
                      <span className="block mt-1 text-amber-300">
                        ⚠️ Notice: This member currently has an unsettled balance of ₹
                        {Math.round(balances[memberToRemove.id] ?? 0)}.
                      </span>
                    )}
                  </p>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setMemberToRemove(null)}
                      disabled={removingMember}
                      className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-slate-300 hover:bg-white/10"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmRemoveMember}
                      disabled={removingMember}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1"
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
              <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LogOut className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">Exit Group (Admin Resignation)</span>
                  </div>
                  <span className="text-[10px] text-amber-400 font-semibold uppercase">Automatic Handoff</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  As a Group Admin, if you leave this group, our automated engine will <strong>randomly appoint one of the remaining members as the new Group Admin</strong>.
                  {myBalance !== 0 && (
                    <span className="block mt-1 font-semibold text-amber-300">
                      Your current standing: {myBalance > 0 ? `Get back ₹${Math.round(myBalance)}` : `Owe ₹${Math.round(-myBalance)}`}.
                    </span>
                  )}
                </p>
                {!confirmExitAdmin ? (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setConfirmExitAdmin(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 font-bold text-xs transition"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Exit Group & Transfer Admin</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 p-3.5 rounded-2xl bg-amber-950/80 border border-amber-500/40 space-y-2.5 animate-in fade-in">
                    <div className="flex items-center gap-1.5 font-bold text-amber-300 text-xs">
                      <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                      <span>Confirm Admin Resignation & Exit</span>
                    </div>
                    <p className="text-xs text-amber-200/90 leading-relaxed">
                      Are you sure you want to resign as Group Admin and exit <strong className="text-white">{group.name}</strong>? One of the remaining {members.length - 1} members will be randomly promoted to Admin.
                    </p>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setConfirmExitAdmin(false)}
                        disabled={exiting}
                        className="flex-1 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-slate-300 hover:bg-white/10 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleExitGroup}
                        disabled={exiting}
                        className="flex-1 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition"
                      >
                        {exiting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        <span>Yes, Confirm Exit</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Delete Group Card */}
              <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4 text-rose-400" />
                    <span className="text-xs font-bold text-white">Delete Group Permanently</span>
                  </div>
                  <span className="text-[10px] text-rose-400 font-bold uppercase">Irreversible</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Permanently deletes <strong className="text-white">{group.name}</strong>, erasing all associated expenses, split breakdowns, payment settlements, and activity logs.
                </p>

                {confirmDelete ? (
                  <div className="pt-2 p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 space-y-2">
                    <p className="text-xs text-rose-200 font-bold">
                      Are you completely sure? This will delete all financial history for all {members.length} members.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        disabled={deleting}
                        className="flex-1 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-slate-300 hover:bg-white/10"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteGroup}
                        disabled={deleting}
                        className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-md"
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
                      className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 font-bold text-xs transition"
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
  );
}
