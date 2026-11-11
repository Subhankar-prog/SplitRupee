import { formatPaise, roundFigure } from "./money";
import type { Transfer } from "./debt";
import type { MemberDTO, ExpenseDTO, PaymentDTO } from "./types";

/** Strip internal idempotency audit tags from human-facing statements */
export function cleanSettlementNotes(notes?: string | null): string {
  if (!notes) return "Direct UPI Settle";
  const cleaned = notes.replace(/\s*\[idempotency:[^\]]+\]/gi, "").trim();
  return cleaned || "Direct UPI Settle";
}

/** Consistent DD/MM/YYYY date formatting shared across CSV and PDF */
export function formatStatementDate(rawDate: string | Date): string {
  const d = new Date(rawDate);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export interface GroupStatementData {
  groupName: string;
  groupType: string;
  memberCount: number;
  exportDate: string;
  totalSpend: number;
  expenseCount: number;
  totalReconciled: number;
  paymentCount: number;
  transferCount: number;
  transferSummary: string;
  variance: number;
  ledgerHealth: string;
  memberBalances: Array<{
    id: string;
    name: string;
    totalPaid: number;
    fairShare: number;
    netBalance: number;
    status: string;
  }>;
  settlementPlan: Array<{
    fromName: string;
    toName: string;
    amount: number;
    method: string;
  }>;
  itemizedExpenses: Array<{
    date: string;
    title: string;
    category: string;
    paidBy: string;
    splitType: string;
    totalAmount: number;
    splitsCount: number;
    sharePerPerson: number;
  }>;
  directSettlements: Array<{
    date: string;
    payer: string;
    receiver: string;
    amount: number;
    notes: string;
  }>;
}

/**
 * Single source of truth for both CSV/Excel and PDF Group Financial Statements
 * so all sections, columns, dates, totals, and numbers match identically.
 */
export function buildGroupStatementData(
  groupMeta: string | { name: string; type?: string },
  members: MemberDTO[],
  expenses: ExpenseDTO[],
  payments: PaymentDTO[],
  balances: Record<string, number>,
  transfers: Transfer[]
): GroupStatementData {
  const groupName = typeof groupMeta === "string" ? groupMeta : groupMeta.name;
  const groupType = typeof groupMeta === "string" ? "GROUP" : groupMeta.type || "GROUP";

  const names: Record<string, string> = {};
  members.forEach((m) => (names[m.id] = m.name));
  const nm = (id: string) => names[id] ?? "Unknown";

  const rawTotalSpend = expenses.reduce((acc, e) => acc + e.totalAmount, 0);
  const rawTotalReconciled = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalSpend = roundFigure(rawTotalSpend);
  const totalReconciled = roundFigure(rawTotalReconciled);

  // Compute total paid and fair share per member
  const memberPaid: Record<string, number> = {};
  const memberShare: Record<string, number> = {};
  members.forEach((m) => {
    memberPaid[m.id] = 0;
    memberShare[m.id] = 0;
  });

  expenses.forEach((e) => {
    memberPaid[e.paidById] = (memberPaid[e.paidById] || 0) + e.totalAmount;
    e.splits.forEach((s) => {
      memberShare[s.userId] = (memberShare[s.userId] || 0) + s.amount;
    });
  });

  const netSumPaise = Object.values(balances).reduce((acc, v) => acc + v, 0);
  const variance = roundFigure(netSumPaise / 100);
  const ledgerHealth =
    variance === 0 ? "Balanced (Variance: 0)" : `Imbalanced (Variance: INR ${variance})`;

  const memberBalances = members.map((m) => {
    const netPaise = balances[m.id] || 0;
    const netBalance = roundFigure(netPaise / 100);
    const status =
      netBalance > 0
        ? `Gets Back INR ${netBalance}`
        : netBalance < 0
          ? `Owes INR ${Math.abs(netBalance)}`
          : "Settled (All Square)";

    return {
      id: m.id,
      name: m.name,
      totalPaid: roundFigure(memberPaid[m.id] || 0),
      fairShare: roundFigure(memberShare[m.id] || 0),
      netBalance,
      status,
    };
  });

  const settlementPlan = transfers.map((t) => ({
    fromName: nm(t.from),
    toName: nm(t.to),
    amount: roundFigure(t.amountPaise / 100),
    method: "1-Tap UPI / Cash",
  }));

  const itemizedExpenses = expenses.map((e) => {
    const splitsCount = e.splits.length;
    return {
      date: formatStatementDate(e.date || e.createdAt),
      title: e.title,
      category: e.category,
      paidBy: nm(e.paidById),
      splitType: e.splitType || "EQUAL",
      totalAmount: roundFigure(e.totalAmount),
      splitsCount,
      sharePerPerson: splitsCount > 0 ? roundFigure(e.totalAmount / splitsCount) : 0,
    };
  });

  const directSettlements = payments.map((p) => ({
    date: formatStatementDate(p.createdAt),
    payer: nm(p.payerId),
    receiver: nm(p.receiverId),
    amount: roundFigure(p.amount),
    notes: cleanSettlementNotes(p.notes),
  }));

  return {
    groupName,
    groupType,
    memberCount: members.length,
    exportDate: formatStatementDate(new Date()),
    totalSpend,
    expenseCount: expenses.length,
    totalReconciled,
    paymentCount: payments.length,
    transferCount: transfers.length,
    transferSummary:
      transfers.length === 0 ? "All Square (0 Owings)" : `${transfers.length} Transfers Required`,
    variance,
    ledgerHealth,
    memberBalances,
    settlementPlan,
    itemizedExpenses,
    directSettlements,
  };
}

/** WhatsApp-flavoured markdown (*bold*, _italic_). */
export function buildWhatsAppSummary(
  groupName: string,
  names: Record<string, string>,
  balances: Record<string, number>,
  transfers: Transfer[],
): string {
  const nm = (id: string) => names[id] ?? "Unknown";
  const lines: string[] = [];
  lines.push(`*💸 SplitRupee: ${groupName}*`);
  lines.push("");
  lines.push("*Who will pay whom (Optimized Transfers)*");
  if (transfers.length === 0) {
    lines.push("✅ Everyone is settled up! All Square.");
  } else {
    transfers.forEach((t, i) => {
      lines.push(`${i + 1}. ${nm(t.from)} ➜ ${nm(t.to)}: *${formatPaise(t.amountPaise)}* (UPI/Cash)`);
    });
  }
  lines.push("");
  lines.push("*Net balances*");
  Object.entries(balances)
    .sort((a, b) => b[1] - a[1])
    .forEach(([id, v]) => {
      if (v > 0) lines.push(`🟢 ${nm(id)} gets back ${formatPaise(v)}`);
      else if (v < 0) lines.push(`🔴 ${nm(id)} owes ${formatPaise(-v)}`);
      else lines.push(`⚪ ${nm(id)} is settled`);
    });
  lines.push("");
  lines.push("_Calculated with SplitRupee_");
  return lines.join("\n");
}

/** Generates a standard, clean Excel & CSV compatible Financial Ledger matching the PDF statement */
export function buildGroupLedgerCSV(
  groupMeta: string | { name: string; type?: string },
  members: MemberDTO[],
  expenses: ExpenseDTO[],
  payments: PaymentDTO[],
  balances: Record<string, number>,
  transfers: Transfer[]
): string {
  const data = buildGroupStatementData(groupMeta, members, expenses, payments, balances, transfers);
  const lines: string[] = [];

  // Title & Group Metadata
  lines.push(`"SPLITRUPEE FINANCIAL STATEMENT & EXPENSE LEDGER"`);
  lines.push(`"Group Name:",${JSON.stringify(data.groupName)}`);
  lines.push(`"Category:",${JSON.stringify(data.groupType)}`);
  lines.push(`"Members Count:",${data.memberCount}`);
  lines.push(`"Export Date:",${JSON.stringify(data.exportDate)}`);
  lines.push(`"Total Group Expenses (Count):",${data.expenseCount}`);
  lines.push(`"Total Group Spend (INR):",${data.totalSpend}`);
  lines.push(`"Direct Settlements Paid (Count):",${data.paymentCount}`);
  lines.push(`"Total Reconciled Paid (INR):",${data.totalReconciled}`);
  lines.push(`"Pending Transfers:",${JSON.stringify(data.transferSummary)}`);
  lines.push(`"Group Ledger Health:",${JSON.stringify(data.ledgerHealth)}`);
  lines.push("");

  // SECTION 1: Member Balances
  lines.push(`"--- 1. MEMBER BALANCES & FAIR SHARE ---"`);
  lines.push(`"Member Name","Total Paid (INR)","Fair Share (INR)","Net Balance (INR)","Status"`);

  data.memberBalances.forEach((m) => {
    lines.push(
      `${JSON.stringify(m.name)},${m.totalPaid},${m.fairShare},${m.netBalance},${JSON.stringify(m.status)}`
    );
  });

  lines.push(`"Total",${data.totalSpend},${data.totalSpend},${data.variance},"Balanced"`);
  lines.push("");
  lines.push("");

  // SECTION 2: Debt Settlement Plan (Who pays whom)
  lines.push(`"--- 2. OPTIMIZED SETTLEMENT PLAN (WHO PAYS WHOM) ---"`);
  lines.push(`"Debtor (Pays)","Creditor (Receives)","Amount (INR)","Recommended Method"`);

  if (data.settlementPlan.length === 0) {
    lines.push(`"All Square","All Square",0,"Everyone is settled up"`);
  } else {
    data.settlementPlan.forEach((t) => {
      lines.push(
        `${JSON.stringify(t.fromName)},${JSON.stringify(t.toName)},${t.amount},${JSON.stringify(t.method)}`
      );
    });
  }
  lines.push("");
  lines.push("");

  // SECTION 3: Itemized Expenses Register
  lines.push(`"--- 3. ITEMIZED EXPENSES REGISTER (${data.expenseCount}) ---"`);
  lines.push(
    `"Date","Expense Title","Category","Paid By","Split Type","Total Amount (INR)","Splits Count","Share Per Person (INR)"`
  );

  data.itemizedExpenses.forEach((e) => {
    lines.push(
      `${JSON.stringify(e.date)},${JSON.stringify(e.title)},${JSON.stringify(e.category)},${JSON.stringify(
        e.paidBy
      )},${JSON.stringify(e.splitType)},${e.totalAmount},${e.splitsCount},${e.sharePerPerson}`
    );
  });

  lines.push(`"Total Expenses (${data.expenseCount})","","","","",${data.totalSpend},"",""`);
  lines.push("");
  lines.push("");

  // SECTION 4: Direct Reconciled Settlements
  lines.push(`"--- 4. DIRECT RECONCILED SETTLEMENTS (${data.paymentCount}) ---"`);
  lines.push(`"Date","Sender (Payer)","Receiver (Paid To)","Amount (INR)","Notes"`);

  if (data.directSettlements.length === 0) {
    lines.push(`"-","No direct settlements recorded yet","-",0,"-"`);
  } else {
    data.directSettlements.forEach((p) => {
      lines.push(
        `${JSON.stringify(p.date)},${JSON.stringify(p.payer)},${JSON.stringify(p.receiver)},${p.amount},${JSON.stringify(p.notes)}`
      );
    });
  }

  lines.push(`"Total Reconciled Settlements (${data.paymentCount})","","",${data.totalReconciled},""`);

  return lines.join("\n");
}
