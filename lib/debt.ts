import { paiseFromStored } from "./money";

export interface Transfer {
  from: string;
  to: string;
  amountPaise: number;
}

export interface LedgerExpense {
  paidById: string;
  splits: { userId: string; amount: number }[];
}

export interface LedgerPayment {
  payerId: string;
  receiverId: string;
  amount: number;
}

/** Net balance per user in paise. Positive = is owed money, negative = owes money. */
export function computeNetBalances(
  expenses: LedgerExpense[],
  memberIds: string[] = [],
  payments: LedgerPayment[] = []
): Record<string, number> {
  const net: Record<string, number> = {};
  for (const id of memberIds) net[id] = 0;

  for (const e of expenses) {
    let paidOut = 0;
    for (const s of e.splits) {
      const p = paiseFromStored(s.amount);
      net[s.userId] = (net[s.userId] ?? 0) - p;
      paidOut += p;
    }
    net[e.paidById] = (net[e.paidById] ?? 0) + paidOut;
  }

  for (const pay of payments) {
    const p = paiseFromStored(pay.amount);
    net[pay.payerId] = (net[pay.payerId] ?? 0) + p;
    net[pay.receiverId] = (net[pay.receiverId] ?? 0) - p;
  }

  return net;
}

class MaxHeap {
  private a: { id: string; v: number }[] = [];
  get size() {
    return this.a.length;
  }
  private before(x: { id: string; v: number }, y: { id: string; v: number }) {
    return x.v > y.v || (x.v === y.v && x.id < y.id);
  }
  push(id: string, v: number) {
    this.a.push({ id, v });
    let i = this.a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!this.before(this.a[i], this.a[p])) break;
      [this.a[i], this.a[p]] = [this.a[p], this.a[i]];
      i = p;
    }
  }
  pop() {
    const top = this.a[0];
    const last = this.a.pop()!;
    if (this.a.length > 0) {
      this.a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < this.a.length && this.before(this.a[l], this.a[m])) m = l;
        if (r < this.a.length && this.before(this.a[r], this.a[m])) m = r;
        if (m === i) break;
        [this.a[i], this.a[m]] = [this.a[m], this.a[i]];
        i = m;
      }
    }
    return top;
  }
}

/**
 * Debt minimisation algorithm.
 */
export function minimizeTransfers(balances: Record<string, number>): Transfer[] {
  const total = Object.values(balances).reduce((a, b) => a + b, 0);
  if (Math.abs(total) > 2) {
    throw new Error(`unbalanced ledger: net sum is ${total} paise`);
  }

  const debtors: { id: string; v: number }[] = [];
  const creditors: { id: string; v: number }[] = [];
  for (const id of Object.keys(balances).sort()) {
    const v = balances[id];
    if (v < -1) debtors.push({ id, v: -v });
    else if (v > 1) creditors.push({ id, v });
  }

  const transfers: Transfer[] = [];

  // Pass 1: exact matches.
  for (let i = debtors.length - 1; i >= 0; i--) {
    const j = creditors.findIndex((c) => c.v === debtors[i].v);
    if (j !== -1) {
      transfers.push({ from: debtors[i].id, to: creditors[j].id, amountPaise: debtors[i].v });
      debtors.splice(i, 1);
      creditors.splice(j, 1);
    }
  }

  // Pass 2: largest debtor pays largest creditor.
  const dHeap = new MaxHeap();
  const cHeap = new MaxHeap();
  debtors.forEach((d) => dHeap.push(d.id, d.v));
  creditors.forEach((c) => cHeap.push(c.id, c.v));
  while (dHeap.size > 0 && cHeap.size > 0) {
    const d = dHeap.pop();
    const c = cHeap.pop();
    const amount = Math.min(d.v, c.v);
    if (amount > 0) {
      transfers.push({ from: d.id, to: c.id, amountPaise: amount });
    }
    if (d.v > amount) dHeap.push(d.id, d.v - amount);
    if (c.v > amount) cHeap.push(c.id, c.v - amount);
  }

  return transfers.sort((a, b) => b.amountPaise - a.amountPaise || a.from.localeCompare(b.from));
}

/** Convenience: expenses and payments in, optimised settlement plan out. */
export function buildLedger(
  expenses: LedgerExpense[],
  memberIds: string[] = [],
  payments: LedgerPayment[] = []
) {
  const balances = computeNetBalances(expenses, memberIds, payments);
  return { balances, transfers: minimizeTransfers(balances) };
}
