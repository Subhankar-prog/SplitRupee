import { CATEGORIES, type CategoryName } from "@/lib/types";

export const CATEGORY_CHART_TOKEN: Record<CategoryName, string> = {
  Food: "var(--chart-1)",
  Rent: "var(--chart-2)",
  Travel: "var(--chart-3)",
  Utilities: "var(--chart-4)",
  Shopping: "var(--chart-5)",
  Entertainment: "var(--chart-6)",
  Miscellaneous: "var(--chart-7)",
};

export interface CategoryBreakdownRow {
  category: CategoryName;
  amount: number;
  pct: number;
  pctLabel: string;
  color: string;
}

export interface CategoryDistribution {
  rows: CategoryBreakdownRow[];
  grandTotal: number;
  ariaSummary: string;
}

/**
 * Formats category share honestly without inflating tiny shares or masking non-zero shares as 0%.
 */
export function formatCategoryShareLabel(pct: number): string {
  if (pct <= 0) return "0%";
  if (pct < 1) return `${pct.toFixed(1)}%`;
  return `${Math.round(pct)}%`;
}

/**
 * Aggregates expenses across all 7 SplitRupee categories with exact percentage math
 * and distinct CSS chart tokens per category.
 */
export function buildCategoryDistribution(
  expenses: ReadonlyArray<{ category?: string | null; totalAmount?: number | null }>
): CategoryDistribution {
  const totals: Record<CategoryName, number> = {
    Food: 0,
    Rent: 0,
    Travel: 0,
    Utilities: 0,
    Shopping: 0,
    Entertainment: 0,
    Miscellaneous: 0,
  };

  let grandTotal = 0;
  for (const exp of expenses) {
    const rawCat = exp.category as CategoryName | undefined;
    const cat: CategoryName = rawCat && rawCat in totals ? rawCat : "Miscellaneous";
    const amt = typeof exp.totalAmount === "number" && Number.isFinite(exp.totalAmount) ? exp.totalAmount : 0;
    if (amt <= 0) continue;
    totals[cat] += amt;
    grandTotal += amt;
  }

  const rows: CategoryBreakdownRow[] = CATEGORIES.map((cat) => {
    const amount = totals[cat];
    const pct = grandTotal > 0 ? (amount / grandTotal) * 100 : 0;
    return {
      category: cat,
      amount,
      pct,
      pctLabel: formatCategoryShareLabel(pct),
      color: CATEGORY_CHART_TOKEN[cat],
    };
  })
    .filter((row) => row.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const ariaSummary =
    rows.length === 0
      ? "No category spending recorded"
      : `Expense distribution: ${rows.map((r) => `${r.category} ${r.pctLabel}`).join(", ")}`;

  return { rows, grandTotal, ariaSummary };
}

