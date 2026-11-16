"use client";

import React, { useMemo } from "react";
import {
  Utensils,
  Home,
  Plane,
  Zap,
  ShoppingBag,
  Film,
  Shapes,
  PieChart,
} from "lucide-react";
import { buildCategoryDistribution } from "@/lib/categoryChart";
import type { CategoryName } from "@/lib/types";

export const CATEGORY_ICONS: Record<string, any> = {
  Food: Utensils,
  Rent: Home,
  Travel: Plane,
  Utilities: Zap,
  Shopping: ShoppingBag,
  Entertainment: Film,
  Miscellaneous: Shapes,
};

function formatINR(val: number): string {
  return "₹ " + Math.round(val).toLocaleString("en-IN");
}

export interface ExpenseDistributionCardProps {
  expenses: ReadonlyArray<{
    category?: string | null;
    totalAmount?: number | null;
    [key: string]: any;
  }>;
  title?: string;
  subtitle?: string;
  selectedCategory?: CategoryName | "All";
  onSelectCategory?: (category: CategoryName | "All") => void;
  className?: string;
}

export default function ExpenseDistributionCard({
  expenses,
  title = "Expense Distribution",
  subtitle,
  selectedCategory,
  onSelectCategory,
  className = "",
}: ExpenseDistributionCardProps) {
  const categoryBreakdown = useMemo(
    () => buildCategoryDistribution(expenses),
    [expenses]
  );

  const resolvedSubtitle =
    subtitle ||
    `Breakdown by spending category across all ${expenses.length} group ${
      expenses.length === 1 ? "expense" : "expenses"
    }`;

  return (
    <div
      className={`rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5 shadow-[var(--shadow-card)] space-y-4 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[var(--status-positive-bg)] text-[var(--status-positive)] border border-[var(--status-positive-border)]">
              <PieChart className="h-4 w-4" aria-hidden="true" />
            </div>
            <h3 className="font-display text-sm sm:text-base font-semibold text-[var(--text-primary)]">
              {title}
            </h3>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] mt-1">
            {resolvedSubtitle}
          </p>
        </div>

        {categoryBreakdown.grandTotal > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <span className="text-[11px] text-[var(--text-secondary)]">Total:</span>
            <span className="font-display text-sm sm:text-base font-bold text-[var(--text-primary)] tabular-nums px-2.5 py-0.5 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)]">
              {formatINR(categoryBreakdown.grandTotal)}
            </span>
          </div>
        )}
      </div>

      {categoryBreakdown.rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border-subtle)] p-6 text-center text-xs text-[var(--text-secondary)]">
          No category expenses recorded yet in this group. Add an expense to view distribution.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Exact Proportional Stacked Overview Bar with Card-Surface Hairline Dividers */}
          <div
            className="flex h-3.5 w-full overflow-hidden rounded-full bg-[var(--bg-surface-secondary)] dark:bg-[var(--bg-canvas)] border border-[var(--border-subtle)] divide-x-2 divide-[var(--bg-surface)]"
            role="img"
            aria-label={categoryBreakdown.ariaSummary}
          >
            {categoryBreakdown.rows.map((row) => (
              <div
                key={row.category}
                style={{ width: `${row.pct}%`, backgroundColor: row.color }}
                title={`${row.category}: ${formatINR(row.amount)} (${row.pctLabel})`}
                onClick={() => onSelectCategory?.(row.category)}
                className={`transition-opacity ${
                  onSelectCategory ? "cursor-pointer hover:opacity-85" : ""
                } ${
                  selectedCategory && selectedCategory !== "All" && selectedCategory !== row.category
                    ? "opacity-40"
                    : "opacity-100"
                }`}
              />
            ))}
          </div>

          {/* Category Share Legend Rows with Icons, Exact Percentage Bars & Accessible Contrast */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-3 pt-1">
            {categoryBreakdown.rows.map((row) => {
              const CatIcon = CATEGORY_ICONS[row.category] || Shapes;
              const isSelected = selectedCategory === row.category;

              return (
                <div
                  key={row.category}
                  onClick={() => {
                    if (onSelectCategory) {
                      onSelectCategory(isSelected ? "All" : row.category);
                    }
                  }}
                  className={`space-y-1.5 text-xs p-2 rounded-xl transition-all ${
                    onSelectCategory
                      ? "cursor-pointer hover:bg-[var(--bg-surface-secondary)]"
                      : ""
                  } ${
                    isSelected
                      ? "bg-[var(--bg-surface-secondary)] border border-[var(--brand-primary)] ring-1 ring-[var(--brand-primary)]"
                      : "border border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="h-3 w-3 rounded-sm shrink-0 border border-[var(--border-subtle)]"
                        style={{ backgroundColor: row.color }}
                        aria-hidden="true"
                      />
                      <CatIcon
                        className="h-3.5 w-3.5 shrink-0 text-[var(--text-secondary)]"
                        aria-hidden="true"
                      />
                      <span className="font-medium text-[var(--text-primary)] truncate">
                        {row.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 tabular-nums">
                      <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                        {row.pctLabel}
                      </span>
                      <span className="font-semibold text-[var(--text-primary)]">
                        {formatINR(row.amount)}
                      </span>
                    </div>
                  </div>
                  <div
                    className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-surface-secondary)] dark:bg-[var(--bg-canvas)]"
                    aria-hidden="true"
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${row.pct}%`, backgroundColor: row.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
