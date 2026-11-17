"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { useUser } from "@/lib/userContext";
import { useDialogAccessibility, ModalPortal } from "@/components/ui/primitives";
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
import { formatINR, roundFigure } from "@/lib/money";
import { addOfflineExpense, getCachedGroupsList } from "@/lib/offlineSync";
import CurrencyPickerModal from "@/components/CurrencyPickerModal";
import UserAvatar from "@/components/ui/UserAvatar";
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
  Scan,
  Loader2,
  CheckCircle2,
  ListOrdered,
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
  const baseId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
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
  const [receiptPreviewError, setReceiptPreviewError] = useState(false);

  useEffect(() => {
    setReceiptPreviewError(false);
  }, [receiptUrl]);

  useDialogAccessibility(true, onClose, dialogRef, loading || isCurrencyPickerOpen);

  // Fetch live exchange rates on mount
  useEffect(() => {
    fetchLiveExchangeRates().then((rates) => {
      setLiveRates(rates);
    });
  }, []);

  // Fetch groups if not provided (strictly scoped to currentUser's active groups, with offline cache fallback)
  useEffect(() => {
    if (providedGroup) {
      setAllGroups([providedGroup]);
      setSelectedGroupId(providedGroup.id);
      return;
    }

    if (!currentUser?.id) return;

    // Immediately populate from offline cache so Add Expense works anywhere offline
    const cachedGroups = getCachedGroupsList().filter((g: any) =>
      !g.members?.length || g.members.some((m: any) => m.id === currentUser.id || m.userId === currentUser.id)
    );
    if (cachedGroups.length > 0) {
      setAllGroups(cachedGroups);
      if (!selectedGroupId) {
        setSelectedGroupId(cachedGroups[0].id);
      }
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return;
    }

    fetch(`/api/groups?userId=${encodeURIComponent(currentUser.id)}&_t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" }
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && Array.isArray(d.groups)) {
          // Strictly filter to groups where currentUser is an active member
          const myGroups = d.groups.filter((g: any) =>
            g.members?.some((m: any) => m.id === currentUser.id || m.userId === currentUser.id)
          );
          setAllGroups(myGroups);
          if (!selectedGroupId && myGroups.length > 0) {
            setSelectedGroupId(myGroups[0].id);
          }
        }
      })
      .catch((err) => console.warn("Failed to fetch user groups (using cached groups):", err));
  }, [providedGroup, selectedGroupId, currentUser?.id]);

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

  // The primary balance / database total is always in whole rounded INR:
  const totalNum = useMemo(() => {
    if (!isForeign) return roundFigure(enteredAmount);
    return roundFigure(enteredAmount * effectiveRate);
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
        const dispAmount = isExpForeign && expRate > 0 ? roundFigure(s.amount / expRate).toString() : roundFigure(s.amount).toString();
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
      const inrExact = isForeign ? roundFigure(foreignExact * effectiveRate) : roundFigure(foreignExact);
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
        next[uid] = roundFigure(eq[i]).toString();
      });
      setExactAmounts(next);
    }
  };

  // AI OCR state
  const [isScanningReceipt, setIsScanningReceipt] = useState(false);
  const [ocrSuccessMsg, setOcrSuccessMsg] = useState<string | null>(null);
  const [scannedItems, setScannedItems] = useState<Array<{ name: string; price: number; qty?: number }>>([]);
  const [showScannedItems, setShowScannedItems] = useState(false);

  async function triggerOcrScan(imagePayload: string) {
    if (!imagePayload || !currentUser?.isPro) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setOcrSuccessMsg("Photo attached locally (Offline mode). AI scanning requires internet, so please enter the bill amount manually.");
      return;
    }
    setIsScanningReceipt(true);
    setOcrSuccessMsg(null);
    setSubmitError(null);

    try {
      const res = await fetch("/api/expenses/scan-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imagePayload,
          currencyHint: currency,
          userId: currentUser?.id,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || json.error || "Failed to scan receipt");
      }

      const d = json.data;
      if (d.merchant) {
        setTitle(d.merchant);
      }

      if (d.totalAmount && d.totalAmount > 0) {
        setAmount(roundFigure(d.totalAmount).toString());
      }

      if (d.category) {
        setCategory(d.category);
      }

      if (d.currency) {
        setCurrency(d.currency);
        setCustomRate(null);
      }

      if (d.date) {
        setDate(d.date);
      }

      if (d.notes) {
        setNotes(d.notes);
      }

      if (d.items && Array.isArray(d.items) && d.items.length > 0) {
        setScannedItems(d.items);
        setShowScannedItems(true);
      }

      setOcrSuccessMsg(
        `AI successfully scanned: ${d.merchant} (${d.currency} ${roundFigure(d.totalAmount)})`
      );
    } catch (err: any) {
      console.warn("[OCR Scan] Failed:", err);
      setSubmitError(err.message || "Could not read receipt with AI. Please enter amount manually.");
    } finally {
      setIsScanningReceipt(false);
    }
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setSubmitError("Receipt photo must be under 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      setReceiptUrl(resultStr);
      if (currentUser?.isPro) {
        triggerOcrScan(resultStr);
      }
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

    const saveOfflineFallback = (noticeText: string) => {
      addOfflineExpense({
        isEdit: Boolean(initialExpense),
        expenseId: initialExpense?.id,
        groupId: activeGroup.id,
        groupName: activeGroup?.name || "Group",
        title: title.trim(),
        totalAmount: totalNum,
        payload,
      });

      setOfflineNotice(noticeText);
      setLoading(false);
      setTimeout(() => {
        onSaved();
      }, 1200);
    };

    const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
    if (isOffline) {
      saveOfflineFallback("Data saved locally (Offline mode). It will sync automatically when reconnected.");
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
      if (json?.offline) {
        saveOfflineFallback("Connection unavailable: Data saved locally. It will sync once internet is restored.");
        return;
      }
      if (!res.ok || !json.ok) {
        throw new Error(json.error || json.issues?.join(", ") || "Failed to save expense");
      }

      onSaved();
    } catch (err: any) {
      if (!navigator.onLine || err.message?.includes("Failed to fetch") || err.message?.includes("network")) {
        saveOfflineFallback("Connection lost: Data saved locally. It will sync once internet is restored.");
        return;
      }
      setSubmitError(err.message || "Failed to save expense");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ModalPortal>
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[var(--overlay-backdrop)] overscroll-contain touch-none sr-modal-backdrop"
        onClick={(e) => {
          if (e.target === e.currentTarget && !loading && !isCurrencyPickerOpen) onClose();
        }}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${baseId}-dialog-title`}
          tabIndex={-1}
          className="relative w-full max-w-lg max-h-[min(92vh,calc(100dvh-1.5rem))] flex flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-popover overflow-hidden outline-none sr-modal-panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border-subtle)] shrink-0">
            <div>
              <h2
                id={`${baseId}-dialog-title`}
                className="font-display text-base sm:text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2"
              >
                <Sparkles className="h-5 w-5 text-[var(--brand-primary)] shrink-0" aria-hidden="true" />
                <span>{initialExpense ? "Edit Expense" : "Add an Expense"}</span>
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {initialExpense
                  ? "Update amounts, payer, or multi-currency split details"
                  : "Split international travel, dining, tickets, or local bills"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="grid h-10 w-10 sm:h-8 sm:w-8 place-items-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-surface-secondary)] hover:text-[var(--text-primary)] transition-colors shrink-0"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <form id={`${baseId}-form`} onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4">
            {offlineNotice && (
              <div className="rounded-xl border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] p-3 text-xs text-[var(--status-warning)] flex items-center gap-2">
                <Cloud className="h-4 w-4 shrink-0" />
                <span>{offlineNotice}</span>
              </div>
            )}

            {submitError && (
              <div className="rounded-xl border border-[var(--status-negative-border)] bg-[var(--status-negative-bg)] p-3 text-xs text-[var(--status-negative)]">
                {submitError}
              </div>
            )}

            {/* AI Receipt Scanning Status Banner (PRO only) */}
            {currentUser?.isPro && isScanningReceipt && (
              <div className="rounded-xl border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] p-3 text-xs text-[var(--status-warning)] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                  <div>
                    <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-[var(--status-warning)]" />
                      Gemini Vision OCR Scanning Receipt...
                    </span>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                      Auto-detecting merchant, amount, category, and items
                    </p>
                  </div>
                </div>
              </div>
            )}

            {currentUser?.isPro && ocrSuccessMsg && (
              <div className="rounded-xl border border-[var(--status-positive-border)] bg-[var(--status-positive-bg)] p-3 text-xs text-[var(--status-positive)] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span className="font-medium truncate">{ocrSuccessMsg}</span>
                </div>
                {scannedItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowScannedItems(!showScannedItems)}
                    className="shrink-0 text-[11px] font-semibold hover:underline flex items-center gap-1"
                  >
                    <ListOrdered className="h-3.5 w-3.5" />
                    <span>{showScannedItems ? "Hide Items" : `${scannedItems.length} Items`}</span>
                  </button>
                )}
              </div>
            )}

            {currentUser?.isPro && showScannedItems && scannedItems.length > 0 && (
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2">
                  <span className="flex items-center gap-1.5 text-[var(--status-warning)]">
                    <Sparkles className="h-3.5 w-3.5" />
                    Itemized Bill Items:
                  </span>
                  <span className="text-[11px] text-[var(--text-secondary)]">{scannedItems.length} items detected</span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 divide-y divide-[var(--border-subtle)]">
                  {scannedItems.map((item, idx) => (
                    <div key={idx} className="pt-1.5 flex items-center justify-between text-xs text-[var(--text-secondary)]">
                      <span className="break-words leading-tight flex-1 mr-2">
                        {item.qty && item.qty > 1 ? `${item.qty}x ` : ""}{item.name}
                      </span>
                      <span className="font-display tabular-nums font-semibold text-[var(--text-primary)]">
                        {currencyInfo.symbol}{roundFigure(Number(item.price))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Group selector */}
            {!providedGroup && allGroups.length > 0 && (
              <div>
                <label htmlFor={`${baseId}-group`} className="text-xs font-medium text-[var(--text-secondary)]">Group</label>
                <select
                  id={`${baseId}-group`}
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  disabled={!!initialExpense}
                  className="mt-1 h-10 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-xs font-medium text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)] transition-colors"
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
                <label htmlFor={`${baseId}-title`} className="text-xs font-medium text-[var(--text-secondary)]">Description / Title</label>
                <input
                  id={`${baseId}-title`}
                  type="text"
                  placeholder="e.g. Dinner in Pokhara, SkyTrain ticket, Uber"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="mt-1 h-10 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:border-[var(--brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--brand-dark)] dark:focus-visible:ring-[var(--brand-primary)] transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor={`${baseId}-amount`} className="text-xs font-medium text-[var(--text-secondary)]">
                    Amount ({currency})
                  </label>
                  {/* Currency Selector Trigger Button */}
                  <button
                    type="button"
                    onClick={() => setIsCurrencyPickerOpen(true)}
                    className="cursor-pointer flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-[var(--brand-dark)] dark:text-[var(--brand-primary)] bg-[var(--status-positive-bg)] border border-[var(--status-positive-border)] hover:opacity-90 transition-opacity"
                    title="Change currency"
                  >
                    <span>{currencyInfo.flag}</span>
                    <span>{currency}</span>
                    <ChevronDown className="h-3 w-3" aria-hidden="true" />
                  </button>
                </div>

                <div className="relative mt-1">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-secondary)] font-semibold text-xs">
                    {currencyInfo.symbol}
                  </span>
                  <input
                    id={`${baseId}-amount`}
                    type="number"
                    step="1"
                    min="1"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    onBlur={() => {
                      if (amount) {
                        const n = parseFloat(amount);
                        if (!isNaN(n)) setAmount(roundFigure(n).toString());
                      }
                    }}
                    required
                    className="h-10 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] pl-8 pr-3 text-sm font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:border-[var(--brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--brand-dark)] dark:focus-visible:ring-[var(--brand-primary)] tabular-nums transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Small live INR amount shown near foreign currency */}
            {isForeign && (
              <div className="rounded-xl border border-[var(--status-positive-border)] bg-[var(--status-positive-bg)] p-2.5 text-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-[var(--text-primary)]">Live INR Equivalent:</span>
                    <span className="font-display font-semibold text-sm text-[var(--status-positive)] tabular-nums">
                      ≈ ₹{roundFigure(totalNum).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} INR
                    </span>
                    <span className="text-[11px] text-[var(--text-secondary)] tabular-nums">
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
                    className="text-[11px] font-medium text-[var(--brand-dark)] dark:text-[var(--brand-primary)] hover:underline flex items-center gap-1"
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>{customRate ? "Custom Rate Active" : "Edit Forex Rate"}</span>
                  </button>
                </div>

                {isEditingRate && (
                  <div className="pt-2 border-t border-[var(--status-positive-border)] flex flex-wrap items-center gap-2 text-xs">
                    <label htmlFor={`${baseId}-fxrate`} className="text-[var(--text-secondary)] text-[11px]">Override rate (Bank statement):</label>
                    <div className="flex items-center gap-1">
                      <span className="text-[var(--text-secondary)]">1 {currency} = ₹</span>
                      <input
                        id={`${baseId}-fxrate`}
                        type="number"
                        step="0.0001"
                        value={customRateInput}
                        onChange={(e) => {
                          setCustomRateInput(e.target.value);
                          const n = parseFloat(e.target.value);
                          if (n > 0) setCustomRate(n);
                        }}
                        className="w-24 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2 py-1 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)] tabular-nums"
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
                        className="text-[10px] text-[var(--status-warning)] hover:underline ml-auto font-medium"
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
                <label htmlFor={`${baseId}-category`} className="text-xs font-medium text-[var(--text-secondary)]">Category</label>
                <select
                  id={`${baseId}-category`}
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryName)}
                  className="mt-1 h-10 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-xs font-medium text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)] transition-colors"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor={`${baseId}-date`} className="text-xs font-medium text-[var(--text-secondary)]">Date</label>
                <input
                  id={`${baseId}-date`}
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-xs font-medium text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)] transition-colors"
                />
              </div>
            </div>

            {/* Paid by */}
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                {members.find((m) => m.id === paidById) && (
                  <UserAvatar
                    name={members.find((m) => m.id === paidById)?.name}
                    avatarUrl={members.find((m) => m.id === paidById)?.avatarUrl}
                    avatarColor={members.find((m) => m.id === paidById)?.avatarColor}
                    size="xs"
                    shape="circle"
                  />
                )}
                <label htmlFor={`${baseId}-paidby`} className="text-xs font-medium text-[var(--text-secondary)]">Paid By</label>
              </div>
              <select
                id={`${baseId}-paidby`}
                value={paidById}
                onChange={(e) => setPaidById(e.target.value)}
                className="h-10 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-xs font-medium text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)] transition-colors"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.id === currentUser?.id ? "(You)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Split Mode Selector */}
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-3.5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span id={`${baseId}-split-method`} className="text-xs font-semibold text-[var(--text-primary)]">Split Method</span>
                  {isForeign && (
                    <p className="text-[10px] text-[var(--text-secondary)]">
                      Balances are kept in INR; foreign shares shown for reference
                    </p>
                  )}
                </div>
                <div role="group" aria-labelledby={`${baseId}-split-method`} className="flex rounded-lg bg-[var(--bg-surface)] p-0.5 border border-[var(--border-subtle)]">
                  {SPLIT_TYPES.map((st) => (
                    <button
                      key={st}
                      type="button"
                      aria-pressed={splitType === st}
                      onClick={() => setSplitType(st)}
                      className={`cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                        splitType === st
                          ? "bg-[var(--brand-primary)] text-[var(--brand-ink)]"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {st === "EQUAL" ? "Equally" : st === "EXACT" ? `Exact ${currencyInfo.symbol}` : "By %"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Split Rows */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(() => {
                  const base = isForeign ? enteredAmount : totalNum;
                  const eq = equalAmounts(base, includedMemberIds.length);
                  const equalMap: Record<string, number> = {};
                  includedMemberIds.forEach((uid, i) => {
                    equalMap[uid] = eq[i];
                  });

                  return members.map((m) => {
                    const isIncluded = includedMemberIds.includes(m.id);
                    const memberShare = equalMap[m.id] ?? 0;
                    const memberShareINR = isForeign ? roundFigure(memberShare * effectiveRate) : memberShare;

                    return (
                      <div
                        key={m.id}
                        className={`flex items-center justify-between gap-2 rounded-xl border p-2.5 text-xs transition-colors ${
                          isIncluded
                            ? "border-[var(--border-subtle)] bg-[var(--bg-surface)]"
                            : "border-transparent bg-transparent opacity-45"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleMember(m.id)}
                          className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                        >
                          <div
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                              isIncluded
                                ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--brand-ink)]"
                                : "border-[var(--border-strong)] bg-transparent"
                            }`}
                          >
                            {isIncluded && <Check className="h-3 w-3 stroke-[2.5]" />}
                          </div>
                          <UserAvatar
                            name={m.name}
                            avatarUrl={m.avatarUrl}
                            avatarColor={m.avatarColor}
                            size="xs"
                            shape="circle"
                          />
                          <span className="font-medium text-[var(--text-primary)] break-words leading-tight">{m.name}</span>
                        </button>

                        {isIncluded && (
                          <div className="shrink-0 flex items-center gap-1.5">
                            {splitType === "EQUAL" && (
                              <div className="text-right">
                                <span className="text-[var(--text-primary)] font-semibold tabular-nums text-xs block">
                                  {isForeign ? `${currencyInfo.symbol}${memberShare}` : `₹${memberShare}`}
                                </span>
                                {isForeign && (
                                  <span className="text-[10px] text-[var(--status-positive)] tabular-nums block">
                                    ≈ ₹{memberShareINR}
                                  </span>
                                )}
                              </div>
                            )}

                            {splitType === "EXACT" && (
                              <div className="flex flex-col items-end gap-0.5">
                                <div className="flex items-center gap-1">
                                  <span className="text-[var(--text-secondary)] font-semibold">{currencyInfo.symbol}</span>
                                  <input
                                    type="number"
                                    step="1"
                                    aria-label={`Exact share amount for ${m.name}`}
                                    placeholder="0"
                                    value={exactAmounts[m.id] ?? ""}
                                    onChange={(e) =>
                                      setExactAmounts({ ...exactAmounts, [m.id]: e.target.value })
                                    }
                                    onBlur={() => {
                                      const val = exactAmounts[m.id];
                                      if (val) {
                                        const n = parseFloat(val);
                                        if (!isNaN(n)) setExactAmounts({ ...exactAmounts, [m.id]: roundFigure(n).toString() });
                                      }
                                    }}
                                    className="w-20 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] px-2 py-1 text-right text-xs text-[var(--text-primary)] tabular-nums outline-none focus:border-[var(--brand-primary)]"
                                  />
                                </div>
                                {isForeign && exactAmounts[m.id] && (
                                  <span className="text-[10px] text-[var(--status-positive)] tabular-nums">
                                    ≈ ₹{roundFigure(parseFloat(exactAmounts[m.id] || "0") * effectiveRate)}
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
                                    aria-label={`Percentage share for ${m.name}`}
                                    placeholder="0"
                                    value={percentages[m.id] ?? ""}
                                    onChange={(e) =>
                                      setPercentages({ ...percentages, [m.id]: e.target.value })
                                    }
                                    className="w-16 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] px-2 py-1 text-right text-xs text-[var(--text-primary)] tabular-nums outline-none focus:border-[var(--brand-primary)]"
                                  />
                                  <span className="text-[var(--text-secondary)] font-semibold">%</span>
                                </div>
                                {percentages[m.id] && (
                                  <span className="text-[10px] text-[var(--status-positive)] tabular-nums">
                                    ≈ ₹{roundFigure((parseFloat(percentages[m.id] || "0") / 100) * totalNum)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>

              {splitType !== "EQUAL" && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={setEqually}
                    className="text-[11px] font-medium text-[var(--brand-dark)] dark:text-[var(--brand-primary)] hover:underline"
                  >
                    Split equally between selected
                  </button>
                </div>
              )}
            </div>

            {/* Bill Receipt Photo Upload */}
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Camera className="h-4 w-4 text-[var(--brand-primary)]" aria-hidden="true" />
                    <span>Bill Receipt Photo</span>
                  </span>
                  {currentUser?.isPro && (
                    <span className="rounded-full bg-[var(--status-warning-bg)] text-[var(--status-warning)] border border-[var(--status-warning-border)] px-2 py-0.5 text-[11px] font-semibold flex items-center gap-1">
                      <Sparkles className="h-3 w-3" aria-hidden="true" /> AI OCR
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {currentUser?.isPro && receiptUrl && (
                    <button
                      type="button"
                      onClick={() => triggerOcrScan(receiptUrl)}
                      disabled={isScanningReceipt}
                      className="text-[11px] text-[var(--status-warning)] hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Scan className="h-3 w-3" />
                      <span>{isScanningReceipt ? "Scanning..." : "Re-Scan with AI"}</span>
                    </button>
                  )}
                  {receiptUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptUrl(null);
                        setOcrSuccessMsg(null);
                        setScannedItems([]);
                        setShowScannedItems(false);
                      }}
                      className="text-[11px] text-[var(--status-negative)] hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  )}
                </div>
              </div>

              {receiptUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-[var(--border-subtle)] min-h-[112px] max-h-36 bg-[var(--bg-surface)] flex items-center justify-center">
                  {receiptPreviewError ? (
                    <div role="status" className="p-4 text-center text-xs text-[var(--text-secondary)]">
                      Receipt preview could not be loaded, though the attachment remains saved.
                    </div>
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={receiptUrl}
                      alt="Bill Receipt"
                      width={480}
                      height={144}
                      onError={() => setReceiptPreviewError(true)}
                      className="h-36 w-full object-cover"
                    />
                  )}
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] p-3 text-center hover:border-[var(--brand-primary)] transition-colors">
                  <ImageIcon className="h-6 w-6 text-[var(--text-secondary)] mb-1" />
                  <span className="text-xs font-medium text-[var(--text-primary)]">
                    Upload image or snap a photo of receipt
                  </span>
                  {currentUser?.isPro ? (
                    <span className="text-[10px] text-[var(--status-warning)] mt-0.5 font-medium flex items-center gap-1">
                      <Sparkles className="h-2.5 w-2.5" /> Auto-extracts total amount, merchant, and dishes with AI
                    </span>
                  ) : (
                    <span className="text-[10px] text-[var(--text-secondary)] mt-0.5 font-medium">
                      Store bill photo with expense details
                    </span>
                  )}
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
              <label htmlFor={`${baseId}-notes`} className="text-xs font-medium text-[var(--text-secondary)]">Notes / Details</label>
              <input
                id={`${baseId}-notes`}
                type="text"
                placeholder="e.g. Pokhara Lakeside cafe, Tip included"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:border-[var(--brand-primary)] transition-colors"
              />
            </div>
          </form>

          {/* Fixed Action Footer */}
          <div className="flex gap-2.5 p-3.5 sm:p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form={`${baseId}-form`}
              disabled={loading}
              className="flex-1 h-10 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-xs font-semibold text-[var(--brand-ink)] disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loading ? "Saving..." : initialExpense ? "Save Changes" : "Create Expense"}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>

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
