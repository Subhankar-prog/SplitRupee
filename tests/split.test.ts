import { describe, expect, it } from "vitest";
import { equalAmounts, equalPercentages, validateSplitInput } from "@/lib/split";

const three = ["a", "b", "c"];
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe("Test Target A: floating point variance (₹100 three ways)", () => {
  it("equalPercentages(3) totals exactly 100.00 by giving the odd 0.01% to one member", () => {
    expect(equalPercentages(3)).toEqual([33.34, 33.33, 33.33]);
  });

  it("splits ₹100.00 as 33.34 / 33.33 / 33.33 with zero variance", () => {
    const r = validateSplitInput(
      100,
      "PERCENTAGE",
      three.map((userId, i) => ({ userId, percentage: equalPercentages(3)[i] })),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.splits.map((s) => s.amountPaise)).toEqual([3334, 3333, 3333]);
    expect(sum(r.splits.map((s) => s.amountPaise))).toBe(10_000);
  });

  it("rejects the literal 3 x 33.33% (= 99.99%) instead of silently losing ₹0.01", () => {
    const r = validateSplitInput(100, "PERCENTAGE", three.map((userId) => ({ userId, percentage: 33.33 })));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toContain("99.99%");
  });

  it("distributes the leftover paisa when the total itself does not divide evenly", () => {
    const r = validateSplitInput(
      100.01,
      "PERCENTAGE",
      three.map((userId, i) => ({ userId, percentage: equalPercentages(3)[i] })),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(sum(r.splits.map((s) => s.amountPaise))).toBe(10_001);
  });

  it("is exact across awkward totals (property check)", () => {
    for (const total of [0.01, 0.07, 99.99, 1234.57, 250000.01, 9_999_999.99]) {
      for (const n of [2, 3, 4, 7, 9]) {
        const pcts = equalPercentages(n);
        expect(Math.round(sum(pcts) * 100)).toBe(10_000);
        const r = validateSplitInput(total, "PERCENTAGE", pcts.map((p, i) => ({ userId: `u${i}`, percentage: p })));
        expect(r.ok).toBe(true);
        if (r.ok) expect(sum(r.splits.map((s) => s.amountPaise))).toBe(Math.round(total * 100));
        expect(Math.round(sum(equalAmounts(total, n)) * 100)).toBe(Math.round(total * 100));
      }
    }
  });
});

describe("Test Target B: split boundary rejection (pure validator)", () => {
  it("rejects percentages totalling 99.5%", () => {
    const r = validateSplitInput(500, "PERCENTAGE", [
      { userId: "a", percentage: 50 },
      { userId: "b", percentage: 49.5 },
    ]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toContain("99.50%");
  });

  it("rejects percentages over 100%", () => {
    const r = validateSplitInput(500, "PERCENTAGE", [
      { userId: "a", percentage: 60 },
      { userId: "b", percentage: 40.01 },
    ]);
    expect(r.ok).toBe(false);
  });

  it("rejects exact amounts that diverge from the bill by ₹1.50", () => {
    const r = validateSplitInput(300, "EXACT", [
      { userId: "a", amount: 150 },
      { userId: "b", amount: 151.5 },
    ]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toMatch(/over by ₹1\.50/);
  });

  it("accepts exact amounts that match to the last paisa", () => {
    const r = validateSplitInput(300.05, "EXACT", [
      { userId: "a", amount: 100.02 },
      { userId: "b", amount: 100.02 },
      { userId: "c", amount: 100.01 },
    ]);
    expect(r.ok).toBe(true);
  });

  it("rejects sub-paisa amounts, duplicates, empty and non-positive totals", () => {
    expect(validateSplitInput(10, "EXACT", [{ userId: "a", amount: 10.001 }]).ok).toBe(false);
    expect(validateSplitInput(10, "EXACT", [{ userId: "a", amount: 5 }, { userId: "a", amount: 5 }]).ok).toBe(false);
    expect(validateSplitInput(10, "EXACT", []).ok).toBe(false);
    expect(validateSplitInput(0, "EXACT", [{ userId: "a", amount: 0 }]).ok).toBe(false);
    expect(validateSplitInput(-5, "EXACT", [{ userId: "a", amount: -5 }]).ok).toBe(false);
    expect(validateSplitInput(10, "PERCENTAGE", [{ userId: "a", percentage: 100.001 }]).ok).toBe(false);
  });
});
