/**
 * All arithmetic is done in integer units with custom round figure rules.
 * Rule:
 *  - Fractional decimal <= 0.50 rounds DOWN to previous integer.
 *  - Fractional decimal > 0.50 (>= 0.51) rounds UP to next integer.
 *  - No fractions or decimal amounts exist in billing/settlements for easy payment.
 */
export class MoneyError extends Error {}

/**
 * Custom Round Figure Rule:
 * <= 0.50 rounds down to previous whole number.
 * > 0.50 (>= 0.51) rounds up to next whole number.
 * Examples:
 *  10.00 -> 10
 *  10.49 -> 10
 *  10.50 -> 10
 *  10.51 -> 11
 *  10.99 -> 11
 *  -10.50 -> -10
 *  -10.51 -> -11
 */
export function roundFigure(val: number): number {
  if (typeof val !== "number" || !Number.isFinite(val)) return 0;
  const sign = val < 0 ? -1 : 1;
  const abs = Math.abs(val);
  const floor = Math.floor(abs);
  const fraction = Math.round((abs - floor) * 100) / 100;
  if (fraction <= 0.5) {
    return sign * floor;
  } else {
    return sign * Math.ceil(abs);
  }
}

/** Convert rupees to integer paise; rejects NaN/Infinity. Rounds to whole round figure rupees. */
export function toPaise(rupees: number): number {
  if (typeof rupees !== "number" || !Number.isFinite(rupees)) {
    throw new MoneyError("Amount must be a finite number");
  }
  const roundedRupees = roundFigure(rupees);
  return Math.round(roundedRupees * 100);
}

/** Lenient conversion for values already stored in the DB. */
export function paiseFromStored(rupees: number): number {
  return Math.round(roundFigure(rupees) * 100);
}

export function toRupees(paise: number): number {
  return roundFigure(Math.round(paise) / 100);
}

export function roundMoney(rupees: number): number {
  return roundFigure(rupees);
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** ₹2,50,000 style output (Indian digit grouping with zero fractions/decimals). */
export function formatINR(rupees: number): string {
  return inr.format(roundFigure(rupees));
}

export function formatPaise(paise: number): string {
  return inr.format(roundFigure(paise / 100));
}
