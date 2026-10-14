"use client";

import React, { useState } from "react";
import { X, ShieldCheck, User, Loader2, ArrowRight } from "lucide-react";
import { useUser } from "@/lib/userContext";
import { useRouter } from "next/navigation";

interface Props {
  onClose: () => void;
  onSuccess?: (data: any) => void;
}

export default function GoogleAuthModal({ onClose, onSuccess }: Props) {
  const router = useRouter();
  const { login, refreshUsers } = useUser();
  const [name, setName] = useState("Subhankar Das");
  const [email, setEmail] = useState("subhankar.das@gmail.com");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customMode, setCustomMode] = useState(false);

  const presetAccounts = [
    { name: "Subhankar Das", email: "subhankar.das@gmail.com", avatar: "#10b981" },
    { name: "Aarav Sharma", email: "aarav.sharma@gmail.com", avatar: "#0ea5e9" },
    { name: "Diya Patel", email: "diya.patel@gmail.com", avatar: "#f43f5e" },
  ];

  async function handleAuthorize(selectedName: string, selectedEmail: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleUser: { name: selectedName, email: selectedEmail },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header with Google Logo */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <svg className="h-7 w-7" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"/>
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
              <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"/>
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
            </svg>
            <div>
              <h3 className="text-base font-bold text-white">Sign in with Google</h3>
              <p className="text-xs text-slate-400">Choose an account to continue to SplitRupee</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-xl bg-white/5 text-slate-400 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Setup Tip Banner */}
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-[11px] text-emerald-300 space-y-1">
          <p className="font-semibold text-emerald-200">🚀 Ready for real accounts.google.com popup</p>
          <p className="text-emerald-400/80 leading-relaxed">
            Add <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to your <code>.env</code> to open Google's live account chooser. In the meantime, you can test one-click sign in below:
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
            {error}
          </div>
        )}

        {/* Account Selector List */}
        {!customMode ? (
          <div className="space-y-2">
            {presetAccounts.map((acc) => (
              <button
                key={acc.email}
                disabled={loading}
                onClick={() => handleAuthorize(acc.name, acc.email)}
                className="w-full flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3.5 hover:border-emerald-500/40 hover:bg-emerald-500/10 transition text-left"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full font-bold text-slate-950 text-sm shadow"
                    style={{ background: acc.avatar }}
                  >
                    {acc.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{acc.name}</p>
                    <p className="text-[11px] text-slate-400">{acc.email}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </button>
            ))}

            <button
              onClick={() => setCustomMode(true)}
              className="w-full rounded-xl border border-dashed border-white/15 p-3 text-xs text-slate-400 hover:text-white hover:border-white/30 transition text-center"
            >
              + Use another Google account
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name && email) handleAuthorize(name, email);
            }}
            className="space-y-4"
          >
            <div>
              <label className="text-xs font-semibold text-slate-300">Google Account Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Subhankar Das"
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300">Google Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="subhankar@gmail.com"
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCustomMode(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-slate-300 hover:bg-white/10"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue as " + name}
              </button>
            </div>
          </form>
        )}

        <div className="pt-2 border-t border-white/5 flex items-center justify-center gap-2 text-[10px] text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>To continue, Google will share your name, email address, and profile picture with SplitRupee.</span>
        </div>
      </div>
    </div>
  );
}
