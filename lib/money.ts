/**
 * All arithmetic is done in integer paise. Floats only exist at the edges
 * (JSON in, Prisma Float columns out) and are rounded on the way through.
 */
export class MoneyError extends Error {}

/** Convert rupees to integer paise; rejects NaN/Infinity and >2 decimal places. */
export function toPaise(rupees: number): number {
  if (typeof rupees !== "number" || !Number.isFinite(rupees)) {
    throw new MoneyError("Amount must be a finite number");
  }
  const paise = Math.round(rupees * 100);
  if (Math.abs(rupees * 100 - paise) > 1e-6) {
    throw new MoneyError(`${rupees} has more than two decimal places`);
  }
  return paise;
}

/** Lenient conversion for values already stored in the DB. */
export function paiseFromStored(rupees: number): number {
  return Math.round(rupees * 100);
}

export function toRupees(paise: number): number {
  return Math.round(paise) / 100;
}

export function roundMoney(rupees: number): number {
  return Math.round((rupees + Number.EPSILON) * 100) / 100;
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** ₹2,50,000.00 style output (Indian digit grouping). */
export function formatINR(rupees: number): string {
  return inr.format(roundMoney(rupees));
}

export function formatPaise(paise: number): string {
  return inr.format(paise / 100);
}
