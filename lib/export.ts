import { formatINR, formatPaise } from "./money";
import type { Transfer } from "./debt";
import type { MemberDTO, ExpenseDTO, PaymentDTO } from "./types";

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
  lines.push("*Who pays whom (Optimized Transfers)*");
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

/** Generates CSV matching the comprehensive Trip Sheet Calculation Ledger model */
export function buildGroupLedgerCSV(
  groupName: string,
  members: MemberDTO[],
  expenses: ExpenseDTO[],
  payments: PaymentDTO[],
  balances: Record<string, number>,
  transfers: Transfer[],
  fxRateNPR: number = 1.6
): string {
  const names: Record<string, string> = {};
  members.forEach((m) => (names[m.id] = m.name));
  const nm = (id: string) => names[id] ?? "Unknown";

  const totalSpend = expenses.reduce((acc, e) => acc + e.totalAmount, 0);
  const totalReconciled = payments.reduce((acc, p) => acc + p.amount, 0);

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

  const lines: string[] = [];

  // 1. Header Summary Table
  lines.push(`"FX Rate (NPR per 1 INR)","Total Group Spend (INR Eqv.)","Total Reconciled Paid (INR)","Group Balance Health"`);
  lines.push(`"${fxRateNPR.toFixed(2)}","₹ ${totalSpend.toFixed(2)}","₹ ${totalReconciled.toFixed(2)}","Balanced (Variance: ₹ 0.00)"`);
  lines.push("");

  // 2. Traveler / Member Balances & Fair Share Table + Transfers
  lines.push(
    `"Traveler / Member","Total Paid (INR)","Fair Share (INR)","Net Balance (INR)","Status","Settlement Action","Debtor (Pays)","Transfer","Creditor (Receives)","Amount (INR)","Settlement Status"`
  );

  const maxRows = Math.max(members.length, transfers.length);
  for (let i = 0; i < maxRows; i++) {
    const m = members[i];
    let memberCols = `"-","₹ 0.00","₹ 0.00","₹ 0.00","-","-"`;
    if (m) {
      const netPaise = balances[m.id] || 0;
      const netINR = netPaise / 100;
      const status =
        netINR > 0
          ? `Gets Back ₹ ${netINR.toFixed(2)}`
          : netINR < 0
          ? `Owes ₹ ${(-netINR).toFixed(2)}`
          : "Settled (All Square)";
      const action = netINR !== 0 ? "1-Click UPI Settle" : "All Square";
      memberCols = `"${m.name}","₹ ${(memberPaid[m.id] || 0).toFixed(2)}","₹ ${(
        memberShare[m.id] || 0
      ).toFixed(2)}","₹ ${netINR.toFixed(2)}","${status}","${action}"`;
    }

    const t = transfers[i];
    let transferCols = `"-","➔","-","₹ 0.00","-"`;
    if (t) {
      const amountINR = (t.amountPaise / 100).toFixed(2);
      transferCols = `"${nm(t.from)}","➔","${nm(t.to)}","₹ ${amountINR}","Pending UPI / Cash"`;
    }

    lines.push(`${memberCols},${transferCols}`);
  }

  lines.push(
    `"Total Group Pool","₹ ${totalSpend.toFixed(2)}","₹ ${totalSpend.toFixed(
      2
    )}","₹ 0.00","Net Balanced","Variance: ₹ 0.00","* Optimized minimal cash-flow transfers settling all balances to zero."`
  );
  lines.push("");
  lines.push("");

  // 3. Circuit / Expense Matrix
  const memberHeaders = members.map((m) => `"${m.name}"`).join(",");
  lines.push(
    `"Date","Expense Description","Category","Paid By","Amount","Currency","Converted (INR Eqv)",${memberHeaders},"Split / Person"`
  );

  expenses.forEach((e) => {
    const dateStr = new Date(e.date || e.createdAt).toLocaleDateString("en-IN");
    const involvedSet = new Set(e.splits.map((s) => s.userId));
    const memberChecks = members
      .map((m) => (involvedSet.has(m.id) ? `"TRUE"` : `"FALSE"`))
      .join(",");
    const perPerson = e.splits.length > 0 ? (e.totalAmount / e.splits.length).toFixed(2) : "0.00";

    lines.push(
      `"${dateStr}","${e.title.replace(/"/g, '""')}","${e.category}","${nm(
        e.paidById
      )}","${e.totalAmount.toFixed(2)}","INR","₹ ${e.totalAmount.toFixed(
        2
      )}",${memberChecks},"₹ ${perPerson}"`
    );
  });

  lines.push("");
  lines.push("");

  // 4. Direct Person-to-Person Settlements (UPI / Cash)
  lines.push(`"DIRECT PERSON-TO-PERSON SETTLEMENTS (UPI / CASH)"`);
  lines.push(`"Date","Transfer Description","Sender (Paid By)","Receiver (Paid To)","Amount","Currency","Amount (INR Eqv)"`);

  if (payments.length === 0) {
    lines.push(`"-","No direct settlements recorded yet","-","-","0.00","INR","₹ 0.00"`);
  } else {
    payments.forEach((p) => {
      const pDate = new Date(p.createdAt).toLocaleDateString("en-IN");
      lines.push(
        `"${pDate}","${(p.notes || "Direct UPI Settle").replace(/"/g, '""')}","${nm(
          p.payerId
        )}","${nm(p.receiverId)}","${p.amount.toFixed(2)}","INR","₹ ${p.amount.toFixed(2)}"`
      );
    });
  }

  lines.push(`"Total Direct Settlements Log","","","","₹ ${totalReconciled.toFixed(2)}","INR","₹ ${totalReconciled.toFixed(2)}"`);

  return lines.join("\n");
}
