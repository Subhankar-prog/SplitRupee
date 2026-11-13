"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Users,
  Receipt,
  Copy,
  Check,
} from "lucide-react";
import { formatINR, roundFigure } from "@/lib/money";

interface ItemRow {
  id: string;
  name: string;
  amount: number;
}

export default function CalculatorPage() {
  const [billAmount, setBillAmount] = useState<number>(3600);
  const [tipPercent, setTipPercent] = useState<number>(10);
  const [gstPercent, setGstPercent] = useState<number>(5);
  const [numPeople, setNumPeople] = useState<number>(4);
  const [copied, setCopied] = useState(false);

  // Advanced Itemized Mode
  const [mode, setMode] = useState<"quick" | "itemized">("quick");
  const [items, setItems] = useState<ItemRow[]>([
    { id: "1", name: "Butter Chicken & Naan", amount: 1450 },
    { id: "2", name: "Mocktails & Beverages", amount: 850 },
    { id: "3", name: "Biryani Platter", amount: 1300 },
  ]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");

  const subtotal =
    mode === "quick"
      ? roundFigure(billAmount)
      : roundFigure(items.reduce((acc, item) => acc + (item.amount || 0), 0));

  const gstAmount = roundFigure((subtotal * gstPercent) / 100);
  const tipAmount = roundFigure((subtotal * tipPercent) / 100);
  const grandTotal = roundFigure(subtotal + gstAmount + tipAmount);
  const perPerson = numPeople > 0 ? roundFigure(grandTotal / numPeople) : 0;

  const addItem = () => {
    if (!newItemName || !newItemAmount) return;
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        name: newItemName,
        amount: roundFigure(parseFloat(newItemAmount) || 0),
      },
    ]);
    setNewItemName("");
    setNewItemAmount("");
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const copySummary = () => {
    const text = `SplitRupee Bill Split Summary\nSubtotal: ${formatINR(
      subtotal
    )}\nGST (${gstPercent}%): ${formatINR(gstAmount)}\nTip (${tipPercent}%): ${formatINR(
      tipAmount
    )}\nGrand Total: ${formatINR(grandTotal)}\nSplit across ${numPeople} people = ${formatINR(
      perPerson
    )} each!`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <p className="text-xs font-semibold text-[var(--brand-dark)] dark:text-[var(--brand-primary)]">Online Split Calculator</p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
          Bill, GST &amp; Tip Split Calculator
        </h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-xl mx-auto">
          Instantly calculate group shares with taxes, service charges, and tips. No signup required.
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] p-1 text-xs font-medium">
          <button
            type="button"
            aria-pressed={mode === "quick"}
            onClick={() => setMode("quick")}
            className={`min-h-[44px] sm:min-h-0 rounded-md px-5 py-2 transition-colors ${
              mode === "quick"
                ? "bg-[var(--brand-primary)] text-[var(--brand-ink)] font-semibold shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Quick Total Split
          </button>
          <button
            type="button"
            aria-pressed={mode === "itemized"}
            onClick={() => setMode("itemized")}
            className={`min-h-[44px] sm:min-h-0 rounded-md px-5 py-2 transition-colors ${
              mode === "itemized"
                ? "bg-[var(--brand-primary)] text-[var(--brand-ink)] font-semibold shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Itemized Bill Breakdown
          </button>
        </div>
      </div>

      {/* Main Calculator Card */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12 rounded-2xl border border-[color:var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-[var(--shadow-card)]">
        {/* Left Inputs (7 cols) */}
        <div className="md:col-span-7 space-y-6">
          {mode === "quick" ? (
            <div>
              <label
                htmlFor="calc-bill-amount"
                className="block text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)] mb-2"
              >
                Total Bill Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display text-xl font-semibold text-[var(--text-secondary)]">
                  ₹
                </span>
                <input
                  id="calc-bill-amount"
                  type="number"
                  min="0"
                  step="10"
                  value={billAmount || ""}
                  onChange={(e) => setBillAmount(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] py-3.5 pl-10 pr-4 font-display text-2xl font-bold tabular-nums text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--brand-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-dark)] dark:focus-visible:ring-[var(--brand-primary)]"
                  placeholder="0.00"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div id="calc-items-heading" className="block text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                Itemized Dishes &amp; Items
              </div>
              <div className="space-y-2" role="list" aria-labelledby="calc-items-heading">
                {items.map((item) => (
                  <div
                    key={item.id}
                    role="listitem"
                    className="flex items-center justify-between rounded-lg border border-[color:var(--border-subtle)] bg-[var(--bg-surface-secondary)] px-3.5 py-2.5 text-xs"
                  >
                    <span className="font-medium text-[var(--text-primary)]">{item.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-display font-semibold tabular-nums text-[var(--status-positive)]">
                        {formatINR(item.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="cursor-pointer h-11 w-11 sm:h-7 sm:w-7 flex items-center justify-center rounded-md text-[var(--text-secondary)] hover:text-[var(--status-negative)] transition-colors"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add item inputs */}
              <div className="flex gap-2">
                <input
                  type="text"
                  aria-label="Dish or item name"
                  placeholder="Dish / item name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="flex-1 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--brand-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-dark)] dark:focus-visible:ring-[var(--brand-primary)]"
                />
                <input
                  type="number"
                  aria-label="Dish or item amount in rupees"
                  placeholder="₹ Amount"
                  value={newItemAmount}
                  onChange={(e) => setNewItemAmount(e.target.value)}
                  className="w-28 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] px-3 py-2 text-xs tabular-nums text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--brand-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-dark)] dark:focus-visible:ring-[var(--brand-primary)]"
                />
                <button
                  type="button"
                  onClick={addItem}
                  className="cursor-pointer min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center rounded-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-3 py-2 text-xs font-semibold text-[var(--brand-ink)] transition-colors"
                  aria-label="Add itemized item"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {/* Number of People Slider */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between text-xs font-medium">
              <label htmlFor="calc-num-people" className="text-[var(--text-secondary)] flex items-center gap-1.5">
                <Users className="h-4 w-4 text-[var(--brand-primary)]" aria-hidden="true" /> Split Between
              </label>
              <span className="font-display text-sm font-semibold tabular-nums text-[var(--text-primary)] bg-[var(--bg-surface-secondary)] border border-[color:var(--border-subtle)] px-2.5 py-0.5 rounded-md">
                {numPeople} {numPeople === 1 ? "person" : "people"}
              </span>
            </div>
            <input
              id="calc-num-people"
              type="range"
              min="1"
              max="20"
              value={numPeople}
              onChange={(e) => setNumPeople(parseInt(e.target.value) || 1)}
              className="w-full accent-[var(--brand-primary)] cursor-pointer"
            />
          </div>

          {/* GST and Tip Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2" role="group" aria-labelledby="calc-gst-label">
              <span id="calc-gst-label" className="block text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                GST / VAT (%)
              </span>
              <div className="flex gap-1.5">
                {[0, 5, 12, 18].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    aria-pressed={gstPercent === pct}
                    onClick={() => setGstPercent(pct)}
                    className={`cursor-pointer flex-1 min-h-[44px] sm:min-h-[36px] rounded-lg py-1.5 text-xs font-medium tabular-nums border transition-colors ${
                      gstPercent === pct
                        ? "border-[var(--brand-primary)] bg-[var(--status-positive-bg)] text-[var(--status-positive)]"
                        : "border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] text-[var(--text-primary)] hover:border-[var(--brand-primary)]"
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2" role="group" aria-labelledby="calc-tip-label">
              <span id="calc-tip-label" className="block text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                Tip / Service (%)
              </span>
              <div className="flex gap-1.5">
                {[0, 5, 10, 15].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    aria-pressed={tipPercent === pct}
                    onClick={() => setTipPercent(pct)}
                    className={`cursor-pointer flex-1 min-h-[44px] sm:min-h-[36px] rounded-lg py-1.5 text-xs font-medium tabular-nums border transition-colors ${
                      tipPercent === pct
                        ? "border-[var(--brand-primary)] bg-[var(--status-positive-bg)] text-[var(--status-positive)]"
                        : "border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] text-[var(--text-primary)] hover:border-[var(--brand-primary)]"
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Output Summary (5 cols) */}
        <div className="md:col-span-5 flex flex-col justify-between rounded-xl border border-[color:var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 pb-3.5 border-b border-[color:var(--border-subtle)]">
              <Receipt className="h-4 w-4 text-[var(--brand-primary)]" />
              <h3 className="font-display text-sm font-semibold text-[var(--text-primary)]">Bill Summary</h3>
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Subtotal</span>
                <span className="font-medium tabular-nums text-[var(--text-primary)]">{formatINR(subtotal)}</span>
              </div>
              {gstPercent > 0 && (
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>GST ({gstPercent}%)</span>
                  <span className="tabular-nums text-[var(--text-primary)]">{formatINR(gstAmount)}</span>
                </div>
              )}
              {tipPercent > 0 && (
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Tip ({tipPercent}%)</span>
                  <span className="tabular-nums text-[var(--text-primary)]">{formatINR(tipAmount)}</span>
                </div>
              )}
              <div className="pt-2.5 border-t border-[color:var(--border-subtle)] flex justify-between text-sm font-semibold text-[var(--text-primary)]">
                <span>Grand Total</span>
                <span className="font-display tabular-nums text-[var(--status-positive)]">{formatINR(grandTotal)}</span>
              </div>
            </div>

            {/* Big per person result */}
            <div className="mt-5 rounded-xl border border-[color:var(--border-strong)] bg-[var(--bg-surface)] p-4 text-center space-y-1 shadow-sm">
              <span className="text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                Each Person Pays
              </span>
              <div className="font-display text-3xl font-bold tabular-nums text-[var(--brand-primary)]">
                {formatINR(perPerson)}
              </div>
              <span className="text-[11px] text-[var(--text-secondary)]">
                split equally for {numPeople} {numPeople === 1 ? "person" : "people"}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={copySummary}
              className="w-full min-h-[44px] sm:min-h-0 flex items-center justify-center gap-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] py-2.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-[var(--status-positive)]" />
                  <span className="text-[var(--status-positive)]">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-[var(--text-secondary)]" />
                  <span>Copy WhatsApp Summary</span>
                </>
              )}
            </button>

            <Link
              href="/signup"
              className="w-full min-h-[44px] sm:min-h-0 flex items-center justify-center rounded-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] py-2.5 text-xs font-semibold text-[var(--brand-ink)] transition-colors shadow-sm"
            >
              <span>Save &amp; Split in SplitRupee App</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
