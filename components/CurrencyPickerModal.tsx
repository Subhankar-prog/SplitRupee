"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { Search, X, Check, Globe, Sparkles } from "lucide-react";
import { ALL_CURRENCIES, POPULAR_CURRENCIES, type CurrencyInfo, getCurrency } from "@/lib/currencies";

interface CurrencyPickerModalProps {
  isOpen: boolean;
  selectedCurrency: string;
  onSelect: (currencyCode: string) => void;
  onClose: () => void;
}

export default function CurrencyPickerModal({
  isOpen,
  selectedCurrency,
  onSelect,
  onClose,
}: CurrencyPickerModalProps) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Filter currencies
  const filteredCurrencies = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ALL_CURRENCIES;
    return ALL_CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
    );
  }, [search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 p-0 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[640px] overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 grid place-items-center text-emerald-600 dark:text-emerald-400">
              <Globe className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                Select Currency
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                120+ countries supported with live INR conversions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full border border-slate-200 dark:border-white/10 grid place-items-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/60 dark:bg-slate-950/40">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country, currency, or code (e.g. Nepal, USD, THB, Dubai)..."
              className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-9 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-emerald-500 shadow-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Popular Chips */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5 text-amber-500" /> Popular:
            </span>
            {POPULAR_CURRENCIES.map((code) => {
              const info = getCurrency(code);
              const isSelected = selectedCurrency === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    onSelect(code);
                    onClose();
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition ${
                    isSelected
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-emerald-500"
                  }`}
                >
                  <span>{info.flag}</span>
                  <span>{code}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Currency List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-white/5 space-y-0.5">
          {filteredCurrencies.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-semibold">No currency found</p>
              <p className="text-xs text-slate-500 mt-1">Try searching for the country name (e.g. "Nepal", "Thailand", "Germany")</p>
            </div>
          ) : (
            filteredCurrencies.map((c) => {
              const isSelected = selectedCurrency === c.code;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    onSelect(c.code);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition text-left cursor-pointer ${
                    isSelected
                      ? "bg-emerald-500/10 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 shadow-sm"
                      : "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-800 dark:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl leading-none shrink-0" role="img" aria-label={c.country}>
                      {c.flag}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm font-mono text-slate-900 dark:text-white">
                          {c.code}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          ({c.symbol}) · {c.country}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                        {c.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <div className="leading-tight">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">
                        {c.code === "INR" ? "Base" : `1 ${c.code} ≈ ₹${c.rateToINR}`}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        {c.code === "INR" ? "Indian Rupee" : "in INR"}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="h-6 w-6 rounded-full bg-emerald-500 text-slate-950 grid place-items-center shadow shrink-0">
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
