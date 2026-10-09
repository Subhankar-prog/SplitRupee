"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/lib/userContext";
import { Users, CheckCircle2, ArrowRight, Loader2, Sparkles, Plane, Home, Heart, Tag } from "lucide-react";

export default function JoinGroupPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const { currentUser, users, setCurrentUser } = useUser();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleJoin(targetUserId?: string) {
    const uid = targetUserId || currentUser?.id;
    if (!uid) {
      setError("Please select or create an account first");
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
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to join group");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/groups/${data.group.id}`);
      }, 1000);
    } catch (e: any) {
      setError(e.message || "Failed to join group");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/95 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
          <Users className="h-8 w-8" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            You're Invited to Join a Group!
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Invite Code: <span className="font-mono text-emerald-400 font-bold">{code}</span>
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
            {error}
          </div>
        )}

        {success ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300 space-y-1">
            <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-400" />
            <p className="text-sm font-semibold">Joined Group Successfully!</p>
            <p className="text-xs text-slate-400">Redirecting to group dashboard...</p>
          </div>
        ) : (
          <>
            {currentUser ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl font-bold text-slate-950 text-xs shadow"
                    style={{ background: currentUser.avatarColor || "#10b981" }}
                  >
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-400">{currentUser.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleJoin()}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition shadow-lg shadow-emerald-500/20"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  <span>Join Group as {currentUser.name}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-left">
                <p className="text-xs font-semibold text-slate-300 text-center">
                  Select which profile to join with:
                </p>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setCurrentUser(u);
                        handleJoin(u.id);
                      }}
                      className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-2.5 hover:border-emerald-500/40 hover:bg-emerald-500/10 transition text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-lg font-bold text-slate-950 text-[11px]"
                          style={{ background: u.avatarColor || "#10b981" }}
                        >
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold text-white">{u.name}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-400">Join →</span>
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
