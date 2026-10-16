"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useUser } from "@/lib/userContext";
import {
  CATEGORIES,
  SPLIT_TYPES,
  type CategoryName,
  type ExpenseDTO,
  type GroupDTO,
  type MemberDTO,
  type SplitTypeName,
} from "@/lib/types";
import {
  equalAmounts,
  equalPercentages,
  validateSplitInput,
  type SplitInput,
} from "@/lib/split";
import { formatINR } from "@/lib/money";
import { addOfflineExpense } from "@/lib/offlineSync";
import CurrencyPickerModal from "@/components/CurrencyPickerModal";
import {
  getCurrency,
  getRateToINR,
  convertToINR,
  fetchLiveExchangeRates,
  formatCurrencyAmount,
} from "@/lib/currencies";
import {
  X,
  Plus,
  Utensils,
  Home,
  Plane,
  Zap,
  ShoppingBag,
  Film,
  Shapes,
  Check,
  Calendar,
  FileText,
  Sparkles,
  Camera,
  Image as ImageIcon,
  Trash2,
  Cloud,
  WifiOff,
  Globe,
  ChevronDown,
  Edit3,
  RefreshCw,
} from "lucide-react";

const CATEGORY_ICONS: Record<CategoryName, typeof Utensils> = {
  Food: Utensils,
  Rent: Home,
  Travel: Plane,
  Utilities: Zap,
  Shopping: ShoppingBag,
  Entertainment: Film,
  Miscellaneous: Shapes,
};

export default function AddExpenseModal({
  group: providedGroup,
  initialExpense,
  defaultPayerId,
  onClose,
  onSaved,
}: {
  group?: GroupDTO | null;
  initialExpense?: ExpenseDTO | null;
  defaultPayerId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { currentUser } = useUser();
  const [allGroups, setAllGroups] = useState<GroupDTO[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    initialExpense?.groupId || providedGroup?.id || ""
  );

  // Currency & Forex states
  const initialCurrency = initialExpense?.currency || "INR";
  const [currency, setCurrency] = useState<string>(initialCurrency);
  const [customRate, setCustomRate] = useState<number | null>(
    initialExpense?.currency && initialExpense.currency !== "INR" && initialExpense.exchangeRate
      ? initialExpense.exchangeRate
      : null
  );
  const [isEditingRate, setIsEditingRate] = useState<boolean>(false);
  const [customRateInput, setCustomRateInput] = useState<string>(
    initialExpense?.currency && initialExpense.currency !== "INR" && initialExpense.exchangeRate
      ? initialExpense.exchangeRate.toString()
      : ""
  );
  const [isCurrencyPickerOpen, setIsCurrencyPickerOpen] = useState<boolean>(false);
  const [liveRates, setLiveRates] = useState<Record<string, number>>({});

  // Form states
  const [title, setTitle] = useState(initialExpense?.title || "");
  const [amount, setAmount] = useState<string>(() => {
    if (!initialExpense) return "";
    if (initialExpense.currency && initialExpense.currency !== "INR" && initialExpense.originalAmount) {
      return initialExpense.originalAmount.toString();
    }
    return initialExpense.totalAmount.toString();
  });
  const [category, setCategory] = useState<CategoryName>(
    initialExpense?.category || "Food"
  );
  const [paidById, setPaidById] = useState<string>(
    initialExpense?.paidById || defaultPayerId || currentUser?.id || ""
  );
  const [splitType, setSplitType] = useState<SplitTypeName>(
    initialExpense?.splitType || "EQUAL"
  );
  const [notes, setNotes] = useState(initialExpense?.notes || "");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(
    (initialExpense as any)?.receiptUrl || null
  );
  const [date, setDate] = useState(
    initialExpense?.date
      ? new Date(initialExpense.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );

  // Splits state
  const [includedMemberIds, setIncludedMemberIds] = useState<string[]>([]);
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);

  // Fetch live exchange rates on mount
  useEffect(() => {
    fetchLiveExchangeRates().then((rates) => {
      setLiveRates(rates);
    });
  }, []);

  // Fetch groups if not provided
  useEffect(() => {
    if (!providedGroup) {
      fetch("/api/groups")
        .then((r) => r.json())
        .then((d) => {
          if (d.ok && d.groups.length > 0) {
            setAllGroups(d.groups);
            if (!selectedGroupId) {
              setSelectedGroupId(d.groups[0].id);
            }
          }
        });
    }
  }, [providedGroup, selectedGroupId]);

  const activeGroup = providedGroup || allGroups.find((g) => g.id === selectedGroupId) || null;
  const members = activeGroup?.members || [];

  // Currency helper calculations
  const isForeign = currency !== "INR";
  const currencyInfo = useMemo(() => getCurrency(currency), [currency]);

  const effectiveRate = useMemo(() => {
    if (!isForeign) return 1.0;
    return getRateToINR(currency, customRate);
  }, [isForeign, currency, customRate, liveRates]);

  const enteredAmount = parseFloat(amount) || 0;

  // The primary balance / database total is always in INR:
  const totalNum = useMemo(() => {
    if (!isForeign) return enteredAmount;
    return Math.round(enteredAmount * effectiveRate * 100) / 100;
  }, [isForeign, enteredAmount, effectiveRate]);

  // Initialize splits on group or initialExpense change
  useEffect(() => {
    if (members.length === 0) return;

    if (initialExpense) {
      setPaidById(initialExpense.paidById);
      const activeIds = initialExpense.splits.map((s) => s.userId);
      setIncludedMemberIds(activeIds);

      const exacts: Record<string, string> = {};
      const pcts: Record<string, string> = {};
      const isExpForeign = initialExpense.currency && initialExpense.currency !== "INR";
      const expRate = initialExpense.exchangeRate || 1.0;

      initialExpense.splits.forEach((s) => {
        const dispAmount = isExpForeign && expRate > 0 ? (s.amount / expRate).toFixed(2) : s.amount.toString();
        exacts[s.userId] = dispAmount;
        if (s.percentage !== null) pcts[s.userId] = s.percentage.toString();
      });
      setExactAmounts(exacts);
      setPercentages(pcts);
    } else {
      if (!paidById || !members.some((m) => m.id === paidById)) {
        setPaidById(currentUser?.id && members.some((m) => m.id === currentUser.id) ? currentUser.id : members[0].id);
      }
      setIncludedMemberIds(members.map((m) => m.id));
    }
  }, [members, initialExpense, currentUser]);

  // Split inputs construction for validator (values always normalized to INR for accurate ledger math)
  const splitInputs: SplitInput[] = useMemo(() => {
    if (splitType === "EQUAL") {
      return includedMemberIds.map((uid) => ({ userId: uid }));
    }
    if (splitType === "PERCENTAGE") {
      return includedMemberIds.map((uid) => ({
        userId: uid,
        percentage: parseFloat(percentages[uid] ?? "") || 0,
      }));
    }
    // EXACT: If foreign currency, convert exact foreign amount to INR
    return includedMemberIds.map((uid) => {
      const foreignExact = parseFloat(exactAmounts[uid] ?? "") || 0;
      const inrExact = isForeign ? Math.round(foreignExact * effectiveRate * 100) / 100 : foreignExact;
      return {
        userId: uid,
        amount: inrExact,
      };
    });
  }, [splitType, includedMemberIds, exactAmounts, percentages, isForeign, effectiveRate]);

  const toggleMember = (uid: string) => {
    if (includedMemberIds.includes(uid)) {
      if (includedMemberIds.length > 1) {
        setIncludedMemberIds(includedMemberIds.filter((id) => id !== uid));
      }
    } else {
      setIncludedMemberIds([...includedMemberIds, uid]);
    }
  };

  const setEqually = () => {
    if (enteredAmount <= 0 || includedMemberIds.length === 0) return;
    if (splitType === "PERCENTAGE") {
      const pcts = equalPercentages(includedMemberIds.length);
      const next: Record<string, string> = {};
      includedMemberIds.forEach((uid, i) => {
        next[uid] = pcts[i].toFixed(2);
      });
      setPercentages(next);
    } else if (splitType === "EXACT") {
      const baseToSplit = isForeign ? enteredAmount : totalNum;
      const eq = equalAmounts(baseToSplit, includedMemberIds.length);
      const next: Record<string, string> = {};
      includedMemberIds.forEach((uid, i) => {
        next[uid] = eq[i].toFixed(2);
      });
      setExactAmounts(next);
    }
  };

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setSubmitError("Receipt photo must be under 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setReceiptUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeGroup) {
      setSubmitError("Please select a group");
      return;
    }
    if (enteredAmount <= 0 || totalNum <= 0) {
      setSubmitError("Please enter a valid bill amount");
      return;
    }
    if (includedMemberIds.length === 0) {
      setSubmitError("Select at least one member to split with");
      return;
    }

    const val = validateSplitInput(totalNum, splitType, splitInputs);
    if (!val.ok) {
      setSubmitError(val.errors.join("; "));
      return;
    }

    setSubmitError(null);
    setLoading(true);

    const payload = {
      groupId: activeGroup.id,
      paidById,
      title: title.trim(),
      totalAmount: totalNum,
      originalAmount: isForeign ? enteredAmount : null,
      currency: currency,
      exchangeRate: isForeign ? effectiveRate : 1.0,
      splitType,
      category,
      notes: notes.trim() || undefined,
      receiptUrl: receiptUrl || undefined,
      date: new Date(date).toISOString(),
      splits: val.splits.map((s) => ({
        userId: s.userId,
        amount: s.amountPaise / 100,
        percentage: s.percentage,
      })),
    };

    const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

    if (isOffline) {
      addOfflineExpense({
        isEdit: Boolean(initialExpense),
        expenseId: initialExpense?.id,
        groupId: selectedGroupId,
        groupName: activeGroup?.name || "Group",
        title: title.trim(),
        totalAmount: totalNum,
        payload,
      });

      setOfflineNotice("Data saved locally (Offline mode). It will sync automatically when reconnected.");
      setLoading(false);
      setTimeout(() => {
        onSaved();
      }, 1400);
      return;
    }

    try {
      const url = initialExpense ? `/api/expenses/${initialExpense.id}` : "/api/expenses";
      const method = initialExpense ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || json.issues?.join(", ") || "Failed to save expense");
      }

      onSaved();
    } catch (err: any) {
      if (!navigator.onLine || err.message?.includes("Failed to fetch") || err.message?.includes("network")) {
        addOfflineExpense({
          isEdit: Boolean(initialExpense),
          expenseId: initialExpense?.id,
          groupId: selectedGroupId,
          groupName: activeGroup?.name || "Group",
          title: title.trim(),
          totalAmount: totalNum,
          payload,
        });

        setOfflineNotice("Connection lost: Data saved locally. It will sync once internet is restored.");
        setTimeout(() => {
          onSaved();
        }, 1400);
        return;
      }
      setSubmitError(err.message || "Failed to save expense");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 p-0 sm:p-4 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200">
        <div className="relative w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-white/10 bg-slate-900/98 p-4 sm:p-6 shadow-2xl backdrop-blur-2xl max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto sm:my-4">
          {/* Drag handle on mobile */}
          <div className="sm:hidden flex justify-center mb-2 -mt-1">
            <div className="h-1 w-10 rounded-full bg-white/20" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-400" />
                {initialExpense ? "Edit Expense" : "Add an Expense"}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {initialExpense
                  ? "Update amounts, payer, or multi-currency split details"
                  : "Split international travel, dining, tickets, or local bills"}
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
            {offlineNotice && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/15 p-3 text-xs text-amber-200 flex items-center gap-2 animate-in fade-in">
                <Cloud className="h-4 w-4 text-amber-400 shrink-0 animate-pulse" />
                <span>{offlineNotice}</span>
              </div>
            )}

            {submitError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                {submitError}
              </div>
            )}

            {/* Group selector */}
            {!providedGroup && allGroups.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-slate-300">Group</label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  disabled={!!initialExpense}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-medium text-white outline-none focus:border-emerald-500"
                >
                  {allGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Title & Amount with Currency Picker Trigger */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-300">Description / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Dinner in Pokhara, SkyTrain ticket, Uber"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Amount ({currency})
                  </label>
                  {/* Currency Selector Trigger Button */}
                  <button
                    type="button"
                    onClick={() => setIsCurrencyPickerOpen(true)}
                    className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition border border-emerald-500/30"
                    title="Change currency"
                  >
                    <span>{currencyInfo.flag}</span>
                    <span>{currency}</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>

                <div className="relative mt-1">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-bold text-xs">
                    {currencyInfo.symbol}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-8 pr-3 text-sm font-semibold text-white placeholder-slate-500 outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Small live INR amount shown near foreign currency */}
            {isForeign && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-300 animate-in fade-in space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white">Live INR Equivalent:</span>
                    <span className="font-extrabold text-sm text-emerald-400 tabular-nums">
                      ≈ ₹{totalNum.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} INR
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      (1 {currency} = ₹{effectiveRate.toFixed(4)})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isEditingRate && customRate) {
                        setCustomRateInput(customRate.toString());
                      } else if (!isEditingRate) {
                        setCustomRateInput(effectiveRate.toFixed(4));
                      }
                      setIsEditingRate(!isEditingRate);
                    }}
                    className="text-[11px] font-semibold text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>{customRate ? "Custom Rate Active" : "Edit Forex Rate"}</span>
                  </button>
                </div>

                {isEditingRate && (
                  <div className="pt-2 border-t border-emerald-500/20 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-300 text-[11px]">Override rate (Bank statement):</span>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">1 {currency} = ₹</span>
                      <input
                        type="number"
                        step="0.0001"
                        value={customRateInput}
                        onChange={(e) => {
                          setCustomRateInput(e.target.value);
                          const n = parseFloat(e.target.value);
                          if (n > 0) setCustomRate(n);
                        }}
                        className="w-24 rounded-lg border border-white/20 bg-slate-950 px-2 py-1 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                    {customRate && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomRate(null);
                          setCustomRateInput("");
                          setIsEditingRate(false);
                        }}
                        className="text-[10px] text-amber-300 hover:underline ml-auto"
                      >
                        Reset to Live Rate
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Category & Date */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-300">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryName)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-medium text-white outline-none focus:border-emerald-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-medium text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Paid by */}
            <div>
              <label className="text-xs font-semibold text-slate-300">Paid By</label>
              <select
                value={paidById}
                onChange={(e) => setPaidById(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-xs font-medium text-white outline-none focus:border-emerald-500"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.id === currentUser?.id ? "(You)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Split Mode Selector */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Split Method</label>
                  {isForeign && (
                    <p className="text-[10px] text-slate-400">
                      Balances are kept in INR; foreign shares shown for reference
                    </p>
                  )}
                </div>
                <div className="flex rounded-lg bg-white/5 p-0.5 border border-white/10">
                  {SPLIT_TYPES.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSplitType(st)}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                        splitType === st
                          ? "bg-emerald-500 text-slate-950 shadow"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {st === "EQUAL" ? "Equally" : st === "EXACT" ? `Exact ${currencyInfo.symbol}` : "By %"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Split Rows */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {members.map((m) => {
                  const isIncluded = includedMemberIds.includes(m.id);
                  const equalShareINR =
                    totalNum > 0 && includedMemberIds.length > 0
                      ? (totalNum / includedMemberIds.length).toFixed(2)
                      : "0.00";
                  const equalShareForeign =
                    enteredAmount > 0 && includedMemberIds.length > 0
                      ? (enteredAmount / includedMemberIds.length).toFixed(2)
                      : "0.00";

                  return (
                    <div
                      key={m.id}
                      className={`flex items-center justify-between gap-2 rounded-xl border p-2 text-xs transition ${
                        isIncluded
                          ? "border-white/10 bg-white/[0.04]"
                          : "border-transparent bg-transparent opacity-40"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleMember(m.id)}
                        className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                      >
                        <div
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                            isIncluded
                              ? "border-emerald-500 bg-emerald-500 text-slate-950"
                              : "border-slate-600 bg-transparent"
                          }`}
                        >
                          {isIncluded && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                        <span className="font-medium text-slate-200 truncate">{m.name}</span>
                      </button>

                      {isIncluded && (
                        <div className="shrink-0 flex items-center gap-1.5">
                          {splitType === "EQUAL" && (
                            <div className="text-right">
                              <span className="text-slate-200 font-semibold tabular-nums text-xs block">
                                {isForeign ? `${currencyInfo.symbol}${equalShareForeign}` : `₹${equalShareINR}`}
                              </span>
                              {isForeign && (
                                <span className="text-[10px] text-emerald-400 font-mono block">
                                  ≈ ₹{equalShareINR}
                                </span>
                              )}
                            </div>
                          )}

                          {splitType === "EXACT" && (
                            <div className="flex flex-col items-end gap-0.5">
                              <div className="flex items-center gap-1">
                                <span className="text-slate-500 font-bold">{currencyInfo.symbol}</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={exactAmounts[m.id] ?? ""}
                                  onChange={(e) =>
                                    setExactAmounts({ ...exactAmounts, [m.id]: e.target.value })
                                  }
                                  className="w-20 rounded-lg border border-white/10 bg-slate-950 px-2 py-1 text-right text-xs text-white outline-none focus:border-emerald-500"
                                />
                              </div>
                              {isForeign && exactAmounts[m.id] && (
                                <span className="text-[10px] text-emerald-400 font-mono">
                                  ≈ ₹{(parseFloat(exactAmounts[m.id] || "0") * effectiveRate).toFixed(2)}
                                </span>
                              )}
                            </div>
                          )}

                          {splitType === "PERCENTAGE" && (
                            <div className="flex flex-col items-end gap-0.5">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="0"
                                  value={percentages[m.id] ?? ""}
                                  onChange={(e) =>
                                    setPercentages({ ...percentages, [m.id]: e.target.value })
                                  }
                                  className="w-16 rounded-lg border border-white/10 bg-slate-950 px-2 py-1 text-right text-xs text-white outline-none focus:border-emerald-500"
                                />
                                <span className="text-slate-500 font-bold">%</span>
                              </div>
                              {percentages[m.id] && (
                                <span className="text-[10px] text-emerald-400 font-mono">
                                  ≈ ₹{((parseFloat(percentages[m.id] || "0") / 100) * totalNum).toFixed(2)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {splitType !== "EQUAL" && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={setEqually}
                    className="text-[11px] font-semibold text-emerald-400 hover:underline"
                  >
                    Split equally between selected
                  </button>
                </div>
              )}
            </div>

            {/* Bill Receipt Photo Upload */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-emerald-400" />
                  <span>Attach Bill Receipt Photo</span>
                </label>
                {receiptUrl && (
                  <button
                    type="button"
                    onClick={() => setReceiptUrl(null)}
                    className="text-[11px] text-rose-400 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                )}
              </div>

              {receiptUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-white/10 max-h-36 bg-slate-950 flex items-center justify-center">
                  <img src={receiptUrl} alt="Bill Receipt" className="h-36 w-full object-cover" />
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-3 text-center hover:border-emerald-500/50 hover:bg-emerald-500/5 transition">
                  <ImageIcon className="h-6 w-6 text-slate-400 mb-1" />
                  <span className="text-xs font-medium text-slate-300">
                    Upload image or snap a photo of receipt
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5">PNG, JPG, WEBP up to 5MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-slate-300">Notes / Details</label>
              <input
                type="text"
                placeholder="e.g. Pokhara Lakeside cafe, Tip included"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
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
                className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition shadow-lg shadow-emerald-500/20"
              >
                {loading ? "Saving..." : initialExpense ? "Save Changes" : "Create Expense"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Global Currency Picker Modal with Instant Search */}
      <CurrencyPickerModal
        isOpen={isCurrencyPickerOpen}
        selectedCurrency={currency}
        onSelect={(code) => {
          setCurrency(code);
          setCustomRate(null);
          setIsEditingRate(false);
          setCustomRateInput("");
        }}
        onClose={() => setIsCurrencyPickerOpen(false)}
      />
    </>
  );
}
