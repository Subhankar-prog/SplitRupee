"use client";

import React, { useState } from "react";
import { useUser } from "@/lib/userContext";
import { X, Plane, Home, Heart, Tag, Check, Users, Plus } from "lucide-react";
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
  const { users, currentUser } = useUser();
  const [name, setName] = useState("");
  const [type, setType] = useState<GroupTypeName>("TRIP");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
    currentUser ? [currentUser.id] : []
  );
  const [extraEmail, setExtraEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleUser = (id: string) => {
    if (selectedUserIds.includes(id)) {
      if (selectedUserIds.length > 1) {
        setSelectedUserIds(selectedUserIds.filter((u) => u !== id));
      }
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a group name");
      return;
    }
    if (selectedUserIds.length === 0) {
      setError("Please select at least one member");
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
          type,
          currency: "INR",
          memberUserIds: selectedUserIds,
          createdById: currentUser?.id,
        }),
      });

      const data = await res.json();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-400" />
              Create New Group
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Organize expenses with roommates, trips, or friends
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
              {error}
            </div>
          )}

          {/* Group Name */}
          <div>
            <label className="text-xs font-semibold text-slate-300">Group Name</label>
            <input
              type="text"
              placeholder="e.g. Manali Road Trip 🏔️ or Flat 402 Rent"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Group Type */}
          <div>
            <label className="text-xs font-semibold text-slate-300">Group Type</label>
            <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {GROUP_TYPES.map((gt) => {
                const Icon = gt.icon;
                const isSelected = type === gt.type;
                return (
                  <button
                    key={gt.type}
                    type="button"
                    onClick={() => setType(gt.type)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-xs font-medium transition ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-500/15 text-emerald-300"
                        : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{gt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Select Members */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Group Members ({selectedUserIds.length} selected)
              </label>
              <span className="text-[11px] text-slate-500">
                Click to add or remove
              </span>
            </div>

            <div className="mt-2 max-h-40 overflow-y-auto space-y-1.5 rounded-xl border border-white/10 bg-white/[0.02] p-2">
              {users.map((u) => {
                const isSelected = selectedUserIds.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleUser(u.id)}
                    className={`w-full flex items-center justify-between rounded-lg p-2 text-left transition border ${
                      isSelected
                        ? "border-emerald-500/40 bg-emerald-500/10 text-white"
                        : "border-transparent bg-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-slate-950 shadow"
                        style={{ background: u.avatarColor || "#10b981" }}
                      >
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium truncate">{u.name}</span>
                    </div>
                    {isSelected && (
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-slate-950">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition"
            >
              {loading ? "Creating..." : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
