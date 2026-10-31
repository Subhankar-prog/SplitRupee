"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calculator,
  Plus,
  Trash2,
  Users,
  Percent,
  Receipt,
  ArrowRight,
  Share2,
  Copy,
  Check,
  Sparkles,
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
    const text = `SplitRupee Bill Split Summary 🧾\nSubtotal: ${formatINR(
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
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
          <Calculator className="h-3.5 w-3.5" />
          <span>Free Online Split Calculator</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          Bill, GST & Tip Split Calculator
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Instantly calculate group shares with taxes, service charges, and tips. No signup required.
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="flex justify-center">
        <div className="flex rounded-2xl border border-white/10 bg-white/5 p-1 text-xs font-semibold">
          <button
            onClick={() => setMode("quick")}
            className={`rounded-xl px-5 py-2 transition ${
              mode === "quick"
                ? "bg-emerald-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Quick Total Split
          </button>
          <button
            onClick={() => setMode("itemized")}
            className={`rounded-xl px-5 py-2 transition ${
              mode === "itemized"
                ? "bg-emerald-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Itemized Bill Breakdown
          </button>
        </div>
      </div>

      {/* Main Calculator Card */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-12 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
        {/* Left Inputs (7 cols) */}
        <div className="md:col-span-7 space-y-6">
          {mode === "quick" ? (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Total Bill Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={billAmount || ""}
                  onChange={(e) => setBillAmount(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-2xl border border-white/15 bg-white/5 py-3.5 pl-10 pr-4 text-2xl font-extrabold text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="0.00"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Itemized Dishes & Items
              </label>
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-xs"
                  >
                    <span className="font-semibold text-slate-200">{item.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-emerald-400">
                        {formatINR(item.amount)}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add item inputs */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Dish / item name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="₹ Amount"
                  value={newItemAmount}
                  onChange={(e) => setNewItemAmount(e.target.value)}
                  className="w-28 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
                <button
                  onClick={addItem}
                  className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Number of People Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-emerald-400" /> Split Between
              </span>
              <span className="text-white font-bold text-sm bg-white/10 px-2.5 py-0.5 rounded-lg">
                {numPeople} {numPeople === 1 ? "person" : "people"}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              value={numPeople}
              onChange={(e) => setNumPeople(parseInt(e.target.value) || 1)}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* GST and Tip Selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-400 uppercase">
                GST / VAT (%)
              </label>
              <div className="flex gap-1.5">
                {[0, 5, 12, 18].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setGstPercent(pct)}
                    className={`flex-1 rounded-xl py-1.5 text-xs font-semibold border transition ${
                      gstPercent === pct
                        ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                        : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-400 uppercase">
                Tip / Service (%)
              </label>
              <div className="flex gap-1.5">
                {[0, 5, 10, 15].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setTipPercent(pct)}
                    className={`flex-1 rounded-xl py-1.5 text-xs font-semibold border transition ${
                      tipPercent === pct
                        ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                        : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
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
        <div className="md:col-span-5 flex flex-col justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 pb-4 border-b border-white/10">
              <Receipt className="h-5 w-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Bill Summary</h3>
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal</span>
                <span className="font-semibold text-white">{formatINR(subtotal)}</span>
              </div>
              {gstPercent > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>GST ({gstPercent}%)</span>
                  <span className="text-slate-200">{formatINR(gstAmount)}</span>
                </div>
              )}
              {tipPercent > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Tip ({tipPercent}%)</span>
                  <span className="text-slate-200">{formatINR(tipAmount)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-white/10 flex justify-between text-sm font-bold text-white">
                <span>Grand Total</span>
                <span className="text-emerald-400">{formatINR(grandTotal)}</span>
              </div>
            </div>

            {/* Big per person result */}
            <div className="mt-6 rounded-2xl border border-emerald-500/40 bg-slate-950/80 p-4 text-center space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Each Person Pays
              </span>
              <div className="text-3xl font-extrabold text-emerald-400">
                {formatINR(perPerson)}
              </div>
              <span className="text-[11px] text-slate-400">
                split equally for {numPeople} people
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <button
              onClick={copySummary}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-slate-400" />
                  <span>Copy WhatsApp Summary</span>
                </>
              )}
            </button>

            <Link
              href="/signup"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 py-2.5 text-xs font-bold text-slate-950 hover:opacity-95 transition"
            >
              <span>Save & Split in SplitRupee App</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
