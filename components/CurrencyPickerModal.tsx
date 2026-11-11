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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[var(--overlay-backdrop)] p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-popover flex flex-col max-h-[85vh] sm:max-h-[640px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[var(--status-positive-bg)] border border-[var(--status-positive-border)] grid place-items-center text-[var(--status-positive)]">
              <Globe className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                Select Currency
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)]">
                120+ countries supported with live INR conversions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="h-8 w-8 rounded-lg border border-[var(--border-subtle)] grid place-items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country, currency, or code (e.g. Nepal, USD, THB, Dubai)..."
              className="h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] pl-10 pr-9 text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/70 outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--status-positive-bg)] transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Popular Chips */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
            <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5 text-[var(--accent-sand)]" /> Popular:
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
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                    isSelected
                      ? "bg-[var(--brand-dark)] dark:bg-[var(--brand-primary)] text-white dark:text-[#171F1D]"
                      : "bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--brand-primary)]"
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
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredCurrencies.length === 0 ? (
            <div className="py-12 text-center text-[var(--text-secondary)]">
              <p className="text-sm font-medium text-[var(--text-primary)]">No currency found</p>
              <p className="text-xs mt-1">Try searching for the country name (e.g. &ldquo;Nepal&rdquo;, &ldquo;Thailand&rdquo;, &ldquo;Germany&rdquo;)</p>
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
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors text-left cursor-pointer border ${
                    isSelected
                      ? "bg-[var(--status-positive-bg)] border-[var(--status-positive-border)] text-[var(--text-primary)]"
                      : "border-transparent hover:bg-[var(--bg-surface-secondary)] text-[var(--text-primary)]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl leading-none shrink-0" role="img" aria-label={c.country}>
                      {c.flag}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-semibold text-xs sm:text-sm tabular-nums text-[var(--text-primary)]">
                          {c.code}
                        </span>
                        <span className="text-[11px] text-[var(--text-secondary)] truncate">
                          ({c.symbol}) · {c.country}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] truncate">
                        {c.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <div className="leading-tight">
                      <span className="text-xs font-medium text-[var(--text-primary)] tabular-nums">
                        {c.code === "INR" ? "Base" : `1 ${c.code} ≈ ₹${c.rateToINR}`}
                      </span>
                      <p className="text-[10px] text-[var(--text-secondary)]">
                        {c.code === "INR" ? "Indian Rupee" : "in INR"}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="h-6 w-6 rounded-full bg-[var(--brand-dark)] dark:bg-[var(--brand-primary)] text-white dark:text-[#171F1D] grid place-items-center shrink-0">
                        <Check className="h-3.5 w-3.5 stroke-[2.5]" />
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
