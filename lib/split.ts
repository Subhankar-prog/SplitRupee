import { formatPaise, MoneyError, toPaise } from "./money";
import type { SplitTypeName } from "./types";

export interface SplitInput {
  userId: string;
  amount?: number | null;
  percentage?: number | null;
}

export interface ComputedSplit {
  userId: string;
  amountPaise: number;
  /** Percentage with 2 decimals; null for EXACT splits. */
  percentage: number | null;
}

export class SplitValidationError extends Error {
  readonly issues: string[];
  constructor(issues: string[]) {
    super(issues.join("; "));
    this.name = "SplitValidationError";
    this.issues = issues;
  }
}

export type SplitResult =
  | { ok: true; splits: ComputedSplit[]; totalPaise: number }
  | { ok: false; errors: string[] };

const BP_TOTAL = 10_000; // 100.00% in hundredths of a percent

function parseHundredths(value: unknown, label: string, errors: string[]): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    errors.push(`${label}: percentage is required`);
    return null;
  }
  const bp = Math.round(value * 100);
  if (Math.abs(value * 100 - bp) > 1e-6) {
    errors.push(`${label}: percentage can have at most two decimal places`);
    return null;
  }
  if (bp < 0 || bp > BP_TOTAL) {
    errors.push(`${label}: percentage must be between 0 and 100`);
    return null;
  }
  return bp;
}

/**
 * Largest-remainder allocation. Distributes totalPaise across weights so the
 * parts sum to exactly totalPaise. Pure integer math; ties go to the earlier row.
 */
export function allocateByWeights(totalPaise: number, weights: number[]): number[] {
  const weightSum = weights.reduce((a, b) => a + b, 0);
  if (weightSum <= 0) throw new Error("Weights must sum to a positive number");
  const floors = weights.map((w) => Math.floor((totalPaise * w) / weightSum));
  const remainders = weights.map((w, i) => ({ i, r: (totalPaise * w) % weightSum }));
  let leftover = totalPaise - floors.reduce((a, b) => a + b, 0);
  remainders.sort((a, b) => b.r - a.r || a.i - b.i);
  for (let k = 0; leftover > 0; k++, leftover--) floors[remainders[k % remainders.length].i] += 1;
  return floors;
}

/**
 * Non-throwing validator + calculator. The UI uses it to block saving; the API
 * route uses it again server-side, so the client can never be trusted.
 */
export function validateSplitInput(
  totalAmount: number,
  splitType: SplitTypeName,
  inputs: SplitInput[]
): SplitResult {
  const errors: string[] = [];

  let totalPaise = 0;
  try {
    totalPaise = toPaise(totalAmount);
    if (totalPaise <= 0) errors.push("Bill total must be greater than ₹0.00");
  } catch (e) {
    errors.push(e instanceof MoneyError ? `Bill total: ${e.message}` : "Bill total is invalid");
  }

  if (inputs.length === 0) errors.push("Select at least one member to split with");

  const seen = new Set<string>();
  for (const s of inputs) {
    if (seen.has(s.userId)) errors.push(`Member ${s.userId} appears more than once`);
    seen.add(s.userId);
  }
  if (errors.length > 0) return { ok: false, errors };

  if (splitType === "EQUAL") {
    const weights = new Array(inputs.length).fill(1);
    const amounts = allocateByWeights(totalPaise, weights);
    const pcts = allocateByWeights(BP_TOTAL, weights).map((bp) => bp / 100);
    return {
      ok: true,
      totalPaise,
      splits: inputs.map((s, i) => ({
        userId: s.userId,
        amountPaise: amounts[i],
        percentage: pcts[i],
      })),
    };
  }

  if (splitType === "PERCENTAGE") {
    const bps: number[] = [];
    inputs.forEach((s, i) => {
      const bp = parseHundredths(s.percentage, `Row ${i + 1}`, errors);
      if (bp !== null) bps.push(bp);
    });
    if (errors.length > 0) return { ok: false, errors };

    const sum = bps.reduce((a, b) => a + b, 0);
    if (sum !== BP_TOTAL) {
      return {
        ok: false,
        errors: [`Percentages must total exactly 100.00% (currently ${(sum / 100).toFixed(2)}%)`],
      };
    }
    const amounts = allocateByWeights(totalPaise, bps);
    return {
      ok: true,
      totalPaise,
      splits: inputs.map((s, i) => ({
        userId: s.userId,
        amountPaise: amounts[i],
        percentage: bps[i] / 100,
      })),
    };
  }

  // EXACT
  const paise: number[] = [];
  inputs.forEach((s, i) => {
    try {
      if (s.amount === null || s.amount === undefined) throw new MoneyError("amount is required");
      const p = toPaise(s.amount);
      if (p < 0) throw new MoneyError("amount cannot be negative");
      paise.push(p);
    } catch (e) {
      errors.push(`Row ${i + 1}: ${e instanceof MoneyError ? e.message : "invalid amount"}`);
    }
  });
  if (errors.length > 0) return { ok: false, errors };

  const sum = paise.reduce((a, b) => a + b, 0);
  if (sum !== totalPaise) {
    const diff = sum - totalPaise;
    return {
      ok: false,
      errors: [
        `Split amounts total ${formatPaise(sum)} but the bill is ${formatPaise(totalPaise)} ` +
          `(${diff > 0 ? "over" : "short"} by ${formatPaise(Math.abs(diff))})`,
      ],
    };
  }
  return {
    ok: true,
    totalPaise,
    splits: inputs.map((s, i) => ({ userId: s.userId, amountPaise: paise[i], percentage: null })),
  };
}

/** Throwing variant for server code. */
export function computeSplits(totalAmount: number, splitType: SplitTypeName, inputs: SplitInput[]) {
  const result = validateSplitInput(totalAmount, splitType, inputs);
  if (!result.ok) throw new SplitValidationError(result.errors);
  return result;
}

/** Percentages for an n-way equal split that total exactly 100.00 (e.g. 33.34 / 33.33 / 33.33). */
export function equalPercentages(n: number): number[] {
  if (n <= 0) return [];
  return allocateByWeights(BP_TOTAL, new Array(n).fill(1)).map((bp) => bp / 100);
}

/** Rupee amounts for an n-way equal split of a bill that total exactly the bill. */
export function equalAmounts(totalAmount: number, n: number): number[] {
  if (n <= 0) return [];
  return allocateByWeights(toPaise(totalAmount), new Array(n).fill(1)).map((p) => p / 100);
}
