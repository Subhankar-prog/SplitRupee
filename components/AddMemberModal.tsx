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
      if (!res.ok || !data.ok) throw new Error(data.message || data.error || "Failed to add member");
      
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
              Share an invite link, add contacts, or invite via email / mobile
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
            Add by Email / Phone
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

                {/* Group Invite Code Box */}
                <div className="mt-3 rounded-2xl bg-white/5 border border-white/10 p-3 flex items-center justify-between text-left">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                      Group Invite Code
                    </span>
                    <span className="font-mono font-bold text-sm sm:text-base text-emerald-400 tracking-wider">
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
                    className="rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-300 flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                  >
                    {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
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
              <label className="text-xs font-semibold text-slate-300">Full Name *</label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Mobile Number (Optional)</span>
                <span className="text-[10px] text-slate-400">10-digit</span>
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-11 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Email Address (Optional)</span>
              </label>
              <input
                type="email"
                placeholder="e.g. rahul@example.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
            </div>
            <p className="text-[10.5px] text-emerald-400/90 leading-relaxed bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5">
              💡 You can add by name only, or include their mobile/email so their expenses auto-sync as soon as they sign up.
            </p>
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
