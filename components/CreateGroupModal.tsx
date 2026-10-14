"use client";

import React, { useState } from "react";
import { useUser } from "@/lib/userContext";
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
  const [name, setName] = useState("");
  const [type, setType] = useState<GroupTypeName>("TRIP");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
          memberUserIds: [currentUser.id],
          createdById: currentUser.id,
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

          {/* Invite Members Guidance Card */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <UserPlus className="h-4 w-4 shrink-0" />
              <span>Inviting Group Members</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              You will automatically be added as the group creator. Once the group is created, you can invite your flatmates, friends, or travel companions anytime via private invite link or WhatsApp.
            </p>
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
