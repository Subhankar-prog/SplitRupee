"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight, Check, Copy, Home, Loader2, Plane, Plus, Share2, Shapes, ShoppingBag, Utensils, Wifi, WifiOff, Zap,
} from "lucide-react";
import { CATEGORIES, type CategoryName, type ExpenseDTO, type GroupDTO } from "@/lib/types";
import { buildLedger } from "@/lib/debt";
import { buildWhatsAppSummary } from "@/lib/export";
import { formatINR, formatPaise } from "@/lib/money";
import AddExpenseModal from "./AddExpenseModal";

const CATEGORY_STYLE: Record<CategoryName, { icon: typeof Utensils; bar: string }> = {
  Food: { icon: Utensils, bar: "#f59e0b" },
  Rent: { icon: Home, bar: "#38bdf8" },
  Travel: { icon: Plane, bar: "#a78bfa" },
  Utilities: { icon: Zap, bar: "#facc15" },
  Shopping: { icon: ShoppingBag, bar: "#f472b6" },
  Entertainment: { icon: Shapes, bar: "#ec4899" },
  Miscellaneous: { icon: Shapes, bar: "#94a3b8" },
};

const glass = "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl";
type Sync = "live" | "syncing" | "offline";

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

export default function Dashboard() {
  const [groups, setGroups] = useState<GroupDTO[]>([]);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<ExpenseDTO[]>([]);
  const [viewerId, setViewerId] = useState<string>("");
  const [sync, setSync] = useState<Sync>("syncing");
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<CategoryName | "All">("All");
  const [showAdd, setShowAdd] = useState(false);
  const [copied, setCopied] = useState(false);

  const group = groups.find((g) => g.id === groupId) ?? null;

  const loadGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/groups", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error();
      setGroups(json.groups);
      setGroupId((cur) => cur ?? json.groups[0]?.id ?? null);
      setViewerId((cur) => cur || json.groups[0]?.members[0]?.id || "");
      setSync("live");
    } catch {
      setSync("offline");
    } finally {
      setLoaded(true);
    }
  }, []);

  const loadExpenses = useCallback(async () => {
    if (!groupId) return;
    try {
      const res = await fetch(`/api/expenses?groupId=${encodeURIComponent(groupId)}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error();
      setExpenses(json.expenses);
      setSync("live");
    } catch {
      setSync("offline");
    }
  }, [groupId]);

  useEffect(() => { loadGroups(); }, [loadGroups]);
  useEffect(() => {
    if (!groupId) return;
    loadExpenses();
    const t = setInterval(() => { setSync((s) => (s === "offline" ? s : "syncing")); loadExpenses(); }, 8000);
    const onVis = () => document.visibilityState === "visible" && loadExpenses();
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, [groupId, loadExpenses]);

  const members = group?.members ?? [];
  const names = useMemo(() => Object.fromEntries(members.map((m) => [m.id, m.name])), [members]);
  const colors = useMemo(() => Object.fromEntries(members.map((m) => [m.id, m.avatarColor])), [members]);

  const ledger = useMemo(
    () => buildLedger(expenses.map((e) => ({ paidById: e.paidById, splits: e.splits })), members.map((m) => m.id)),
    [expenses, members],
  );

  const byCategory = useMemo(() => {
    const totals = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<CategoryName, number>;
    for (const e of expenses) totals[e.category] += Math.round(e.totalAmount * 100);
    const grand = Object.values(totals).reduce((a, b) => a + b, 0);
    return { totals, grand };
  }, [expenses]);

  const visible = filter === "All" ? expenses : expenses.filter((e) => e.category === filter);
  const myNet = ledger.balances[viewerId] ?? 0;
  const summary = group ? buildWhatsAppSummary(group.name, names, ledger.balances, ledger.transfers) : "";

  async function share() {
    await copyText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  if (!loaded) {
    return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-emerald-400" /></div>;
  }

  if (!group) {
    return (
      <main className="mx-auto grid min-h-screen max-w-md place-items-center p-6 text-center">
        <div className={`${glass} p-8`}>
          <h1 className="text-xl font-semibold">No group yet</h1>
          <p className="mt-2 text-sm text-slate-400">
            {sync === "offline"
              ? "The server could not be reached. Check DATABASE_URL and that the database is running."
              : "Run npm run db:seed to create a sample group, then refresh."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" aria-hidden />
      <main className="relative mx-auto max-w-3xl space-y-5 px-4 pb-28 pt-6">
        {/* Header */}
        <header className={`${glass} p-4`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-slate-400">SplitRupee</p>
              {groups.length > 1 ? (
                <select value={group.id} onChange={(e) => setGroupId(e.target.value)} className="mt-0.5 bg-transparent text-2xl font-semibold outline-none">
                  {groups.map((g) => <option key={g.id} value={g.id} className="bg-slate-900">{g.name}</option>)}
                </select>
              ) : (
                <h1 className="truncate text-2xl font-semibold">{group.name}</h1>
              )}
              <p className="mt-1 text-sm text-slate-400">{members.length} members · {expenses.length} expenses</p>
            </div>
            <div
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
                sync === "offline" ? "border-rose-500/40 text-rose-400" : "border-emerald-500/30 text-emerald-400"
              }`}
              role="status"
            >
              {sync === "offline" ? <WifiOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
              {sync === "live" ? "Live" : sync === "syncing" ? "Syncing" : "Offline"}
              {sync !== "offline" && <span className={`h-1.5 w-1.5 rounded-full bg-emerald-400 ${sync === "syncing" ? "animate-pulse" : ""}`} />}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-400">
              Viewing as
              <select value={viewerId} onChange={(e) => setViewerId(e.target.value)} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-slate-100">
                {members.map((m) => <option key={m.id} value={m.id} className="bg-slate-900">{m.name}</option>)}
              </select>
            </label>
            <p className={`text-lg font-semibold tabular-nums ${myNet > 0 ? "text-emerald-500" : myNet < 0 ? "text-rose-500" : "text-slate-300"}`}>
              {myNet > 0 ? `You get back ${formatPaise(myNet)}` : myNet < 0 ? `You owe ${formatPaise(-myNet)}` : "You're settled up"}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button onClick={() => setShowAdd(true)} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-semibold text-slate-950 hover:bg-emerald-400">
              <Plus className="h-4 w-4" /> Add Expense
            </button>
            <button onClick={share} className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-3 font-medium hover:bg-white/10">
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
              {copied ? "Copied for WhatsApp" : "Share Ledger Summary"}
            </button>
          </div>
        </header>

        {/* Transparency grid */}
        <section className={`${glass} p-4`} aria-labelledby="who-pays">
          <h2 id="who-pays" className="mb-3 text-base font-semibold">Who pays whom</h2>
          {ledger.transfers.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">Everyone is settled up. Add an expense to get started.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {ledger.transfers.map((t) => (
                <li key={`${t.from}-${t.to}`} className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.04] px-3 py-2.5">
                  <span className="h-6 w-6 shrink-0 rounded-full" style={{ background: colors[t.from] }} aria-hidden />
                  <span className="truncate text-sm">{names[t.from]}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-500" aria-label="pays" />
                  <span className="h-6 w-6 shrink-0 rounded-full" style={{ background: colors[t.to] }} aria-hidden />
                  <span className="truncate text-sm">{names[t.to]}</span>
                  <span className="ml-auto pl-2 text-sm font-semibold tabular-nums">{formatPaise(t.amountPaise)}</span>
                </li>
              ))}
            </ul>
          )}

          <h3 className="mb-2 mt-5 text-sm font-medium text-slate-400">Net standings</h3>
          <ul className="divide-y divide-white/5">
            {members
              .map((m) => ({ m, v: ledger.balances[m.id] ?? 0 }))
              .sort((a, b) => b.v - a.v)
              .map(({ m, v }) => (
                <li key={m.id} className="flex items-center gap-3 py-2">
                  <span className="h-7 w-7 rounded-full" style={{ background: m.avatarColor }} aria-hidden />
                  <span className="flex-1 text-sm">{m.name}{m.id === viewerId && <span className="text-slate-500"> (you)</span>}</span>
                  <span className={`text-sm font-semibold tabular-nums ${v > 0 ? "text-emerald-500" : v < 0 ? "text-rose-500" : "text-slate-400"}`}>
                    {v > 0 ? "+" : v < 0 ? "−" : ""}{formatPaise(Math.abs(v))}
                  </span>
                </li>
              ))}
          </ul>
        </section>

        {/* Analytics */}
        <section className={`${glass} p-4`} aria-labelledby="spend">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 id="spend" className="text-base font-semibold">Spending by category</h2>
            <span className="text-sm tabular-nums text-slate-300">{formatPaise(byCategory.grand)}</span>
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            {(["All", ...CATEGORIES] as const).map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                aria-pressed={filter === c}
                className={`rounded-full border px-3 py-1 text-xs transition ${filter === c ? "border-emerald-500 bg-emerald-500/15 text-emerald-300" : "border-white/10 text-slate-400 hover:text-white"}`}
              >
                {c}
              </button>
            ))}
          </div>
          <ul className="space-y-3">
            {CATEGORIES.map((c) => {
              const v = byCategory.totals[c];
              const pct = byCategory.grand > 0 ? (v / byCategory.grand) * 100 : 0;
              const Icon = CATEGORY_STYLE[c].icon;
              const dim = filter !== "All" && filter !== c;
              return (
                <li key={c} className={dim ? "opacity-30 transition" : "transition"}>
                  <div className="mb-1 flex items-center gap-2 text-sm">
                    <Icon className="h-4 w-4" style={{ color: CATEGORY_STYLE[c].bar }} />
                    <span className="flex-1">{c}</span>
                    <span className="tabular-nums text-slate-400">{pct.toFixed(0)}%</span>
                    <span className="w-28 text-right tabular-nums">{formatPaise(v)}</span>
                  </div>
                  <svg viewBox="0 0 100 3" preserveAspectRatio="none" className="h-1.5 w-full" role="img" aria-label={`${c} ${pct.toFixed(0)} percent`}>
                    <rect width="100" height="3" rx="1.5" fill="rgba(255,255,255,0.08)" />
                    <rect width={pct} height="3" rx="1.5" fill={CATEGORY_STYLE[c].bar} style={{ transition: "width 600ms ease" }} />
                  </svg>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Expense log */}
        <section className={`${glass} p-4`} aria-labelledby="log">
          <h2 id="log" className="mb-3 text-base font-semibold">Expenses{filter !== "All" && ` · ${filter}`}</h2>
          {visible.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">No expenses here yet.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {visible.map((e) => {
                const Icon = CATEGORY_STYLE[e.category].icon;
                return (
                  <li key={e.id} className="flex items-center gap-3 py-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/5">
                      <Icon className="h-4 w-4" style={{ color: CATEGORY_STYLE[e.category].bar }} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{e.title}</p>
                      <p className="text-xs text-slate-500">
                        {e.paidBy.name} paid · {e.splitType === "EXACT" ? "exact amounts" : "by percentage"} ·{" "}
                        {new Date(e.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">{formatINR(e.totalAmount)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <details className={`${glass} p-4 text-sm`}>
          <summary className="flex cursor-pointer items-center gap-2 text-slate-300"><Copy className="h-4 w-4" /> Preview WhatsApp message</summary>
          <pre className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-slate-900/70 p-3 text-xs text-slate-300">{summary}</pre>
        </details>
      </main>

      {showAdd && (
        <AddExpenseModal
          group={group}
          defaultPayerId={viewerId || members[0].id}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); loadExpenses(); }}
        />
      )}
    </div>
  );
}
