import { describe, it, expect } from "vitest";
import { CATEGORIES } from "@/lib/types";
import {
  CATEGORY_CHART_TOKEN,
  buildCategoryDistribution,
  formatCategoryShareLabel,
} from "@/lib/categoryChart";

describe("Category Chart Distribution & Tokens (F-13)", () => {
  it("assigns a unique chart token to all 7 categories without collision", () => {
    const tokens = CATEGORIES.map((cat) => CATEGORY_CHART_TOKEN[cat]);
    expect(tokens).toHaveLength(7);
    expect(new Set(tokens).size).toBe(7);
  });

  it("preserves exact percentages without artificially inflating small segments", () => {
    const result = buildCategoryDistribution([
      { category: "Food", totalAmount: 996 },
      { category: "Miscellaneous", totalAmount: 4 },
    ]);

    expect(result.grandTotal).toBe(1000);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].category).toBe("Food");
    expect(result.rows[0].pct).toBeCloseTo(99.6, 4);
    expect(result.rows[1].category).toBe("Miscellaneous");
    expect(result.rows[1].pct).toBeCloseTo(0.4, 4);
    expect(result.rows[1].pctLabel).toBe("0.4%");
    expect(result.rows[0].pct + result.rows[1].pct).toBeCloseTo(100, 6);
  });

  it("handles sub-1% formatting honestly and produces descriptive ariaSummary", () => {
    expect(formatCategoryShareLabel(0)).toBe("0%");
    expect(formatCategoryShareLabel(0.38)).toBe("0.4%");
    expect(formatCategoryShareLabel(42.6)).toBe("43%");

    const dist = buildCategoryDistribution([
      { category: "Travel", totalAmount: 600 },
      { category: "Rent", totalAmount: 400 },
    ]);
    expect(dist.ariaSummary).toBe("Expense distribution: Travel 60%, Rent 40%");
  });

  it("falls back unknown categories to Miscellaneous and skips zero/invalid amounts", () => {
    const dist = buildCategoryDistribution([
      { category: undefined, totalAmount: 250 },
      { category: "Food", totalAmount: 0 },
      { category: "Rent", totalAmount: -10 },
    ]);
    expect(dist.grandTotal).toBe(250);
    expect(dist.rows).toHaveLength(1);
    expect(dist.rows[0].category).toBe("Miscellaneous");
    expect(dist.rows[0].pct).toBe(100);
  });
});

