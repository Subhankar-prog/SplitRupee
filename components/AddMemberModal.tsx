"use client";

import React, { useState } from "react";
import { useUser } from "@/lib/userContext";
import { X, UserPlus, Check, Mail, Link as LinkIcon, Share2, QrCode } from "lucide-react";
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
  onAdded: () => void;
}) {
  const { currentUser, refreshUsers } = useUser();
  const [tab, setTab] = useState<"link" | "new">("link");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

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
    if (!name.trim() || !email.trim()) {
      setError("Name and Email are required");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), addedById: currentUser?.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to add member");
      await refreshUsers();
      onAdded();
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 p-0 sm:p-4 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-white/10 bg-slate-900/98 p-4 sm:p-6 shadow-2xl backdrop-blur-2xl max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto">
        <div className="sm:hidden flex justify-center mb-2 -mt-1">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-emerald-400" />
              Invite & Add Members
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Share an invite link, add contacts, or invite via email
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
            {error}
          </div>
        )}

        {/* Tab switch */}
        <div className="mt-4 flex rounded-xl bg-white/5 p-1 border border-white/10">
          <button
            onClick={() => setTab("link")}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
              tab === "link" ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Invite Link & QR
          </button>
          <button
            onClick={() => setTab("new")}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
              tab === "new" ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Add by Name / Email
          </button>
        </div>

        {tab === "link" && (
          <div className="mt-4 space-y-4 text-center">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="bg-white p-2 rounded-2xl shadow-md">
                <img src={qrCodeUrl} alt="Group Invite QR Code" className="h-28 w-28 object-contain" />
              </div>
              <div className="w-full">
                <p className="text-xs text-slate-300 font-semibold truncate">
                  {joinUrl}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <LinkIcon className="h-3.5 w-3.5" />}
                    <span>{copiedLink ? "Copied Link!" : "Copy Link"}</span>
                  </button>
                  <button
                    onClick={handleShareWhatsApp}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition shadow"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}



        {tab === "new" && (
          <form onSubmit={handleCreateAndAdd} className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300">Name</label>
              <input
                type="text"
                placeholder="e.g. Sumanth Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <input
                type="email"
                placeholder="e.g. sumanth@example.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-emerald-500 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition"
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
