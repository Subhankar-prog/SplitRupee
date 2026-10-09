import { describe, expect, it } from "vitest";
import { buildLedger, computeNetBalances, minimizeTransfers } from "@/lib/debt";

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe("Test Target C: chain debt reduction", () => {
  it("collapses A→B→C into A→C", () => {
    const { transfers } = buildLedger([
      { paidById: "B", splits: [{ userId: "A", amount: 1000 }] }, // A owes B ₹1,000
      { paidById: "C", splits: [{ userId: "B", amount: 1000 }] }, // B owes C ₹1,000
    ]);
    expect(transfers).toEqual([{ from: "A", to: "C", amountPaise: 100_000 }]);
  });

  it("reduces a 4-user overlapping matrix to the optimal 2 transfers", () => {
    // Raw debts: A→B 1000, B→C 1000, C→D 500, D→A 200 (4 transfers)
    const expenses = [
      { paidById: "B", splits: [{ userId: "A", amount: 1000 }] },
      { paidById: "C", splits: [{ userId: "B", amount: 1000 }] },
      { paidById: "D", splits: [{ userId: "C", amount: 500 }] },
      { paidById: "A", splits: [{ userId: "D", amount: 200 }] },
    ];
    const { balances, transfers } = buildLedger(expenses, ["A", "B", "C", "D"]);
    expect(balances).toEqual({ A: -80_000, B: 0, C: 50_000, D: 30_000 });
    expect(transfers).toHaveLength(2);
    expect(transfers).toEqual([
      { from: "A", to: "C", amountPaise: 50_000 },
      { from: "A", to: "D", amountPaise: 30_000 },
    ]);
    // B was in the middle of the chain and must disappear entirely.
    expect(transfers.some((t) => t.from === "B" || t.to === "B")).toBe(false);
  });

  it("applying the transfers zeroes every balance (conservation), and uses ≤ n−1 transfers", () => {
    let seed = 42;
    const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
    for (let round = 0; round < 200; round++) {
      const users = ["u1", "u2", "u3", "u4", "u5", "u6"];
      const expenses = Array.from({ length: 12 }, () => {
        const payer = users[Math.floor(rnd() * users.length)];
        const owed = users.filter(() => rnd() > 0.4);
        return {
          paidById: payer,
          splits: owed.map((u) => ({ userId: u, amount: Math.round(rnd() * 100_000) / 100 })),
        };
      });
      const balances = computeNetBalances(expenses, users);
      expect(sum(Object.values(balances))).toBe(0);
      const transfers = minimizeTransfers(balances);
      const after = { ...balances };
      for (const t of transfers) {
        after[t.from] += t.amountPaise;
        after[t.to] -= t.amountPaise;
        expect(t.amountPaise).toBeGreaterThan(0);
      }
      expect(Object.values(after).every((v) => v === 0)).toBe(true);
      const nonZero = Object.values(balances).filter((v) => v !== 0).length;
      expect(transfers.length).toBeLessThanOrEqual(Math.max(0, nonZero - 1));
    }
  });

  it("matches exact opposite amounts in one transfer each", () => {
    const t = minimizeTransfers({ A: -500, B: 500, C: -300, D: 300 });
    expect(t).toHaveLength(2);
  });

  it("returns no transfers for a settled group and refuses an unbalanced ledger", () => {
    expect(minimizeTransfers({ A: 0, B: 0 })).toEqual([]);
    expect(() => minimizeTransfers({ A: -100, B: 50 })).toThrow(/unbalanced/);
  });
});
