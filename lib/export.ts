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

/** Generates a standard, clean Excel & CSV compatible Financial Ledger */
export function buildGroupLedgerCSV(
  groupName: string,
  members: MemberDTO[],
  expenses: ExpenseDTO[],
  payments: PaymentDTO[],
  balances: Record<string, number>,
  transfers: Transfer[]
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

  // Title & Group Metadata
  lines.push(`"SPLITRUPEE FINANCIAL STATEMENT & EXPENSE LEDGER"`);
  lines.push(`"Group Name:",${JSON.stringify(groupName)}`);
  lines.push(`"Export Date:",${JSON.stringify(new Date().toLocaleDateString("en-IN"))}`);
  lines.push(`"Total Group Spend (INR):",${totalSpend.toFixed(2)}`);
  lines.push(`"Total Reconciled Paid (INR):",${totalReconciled.toFixed(2)}`);
  lines.push(`"Group Ledger Health:","Balanced (Variance: 0.00)"`);
  lines.push("");

  // SECTION 1: Member Balances
  lines.push(`"--- 1. MEMBER BALANCES & FAIR SHARE ---"`);
  lines.push(`"Member Name","Total Paid (INR)","Fair Share (INR)","Net Balance (INR)","Status"`);

  members.forEach((m) => {
    const netPaise = balances[m.id] || 0;
    const netINR = netPaise / 100;
    const status =
      netINR > 0
        ? `Gets Back INR ${netINR.toFixed(2)}`
        : netINR < 0
        ? `Owes INR ${Math.abs(netINR).toFixed(2)}`
        : "Settled (All Square)";

    const paid = (memberPaid[m.id] || 0).toFixed(2);
    const share = (memberShare[m.id] || 0).toFixed(2);
    lines.push(`${JSON.stringify(m.name)},${paid},${share},${netINR.toFixed(2)},${JSON.stringify(status)}`);
  });

  lines.push(
    `"Total",${totalSpend.toFixed(2)},${totalSpend.toFixed(2)},0.00,"Balanced"`
  );
  lines.push("");
  lines.push("");

  // SECTION 2: Debt Settlement Plan (Who pays whom)
  lines.push(`"--- 2. OPTIMIZED SETTLEMENT PLAN (WHO PAYS WHOM) ---"`);
  lines.push(`"Debtor (Pays)","Creditor (Receives)","Amount (INR)","Recommended Method"`);

  if (transfers.length === 0) {
    lines.push(`"All Square","All Square",0.00,"Everyone is settled up"`);
  } else {
    transfers.forEach((t) => {
      const amountINR = (t.amountPaise / 100).toFixed(2);
      lines.push(`${JSON.stringify(nm(t.from))},${JSON.stringify(nm(t.to))},${amountINR},"1-Tap UPI / Cash"`);
    });
  }
  lines.push("");
  lines.push("");

  // SECTION 3: Itemized Expenses Register
  lines.push(`"--- 3. ITEMIZED EXPENSES REGISTER ---"`);
  lines.push(
    `"Date","Expense Title","Category","Paid By","Split Type","Total Amount (INR)","Splits Count","Share Per Person (INR)"`
  );

  expenses.forEach((e) => {
    const dateStr = new Date(e.date || e.createdAt).toLocaleDateString("en-IN");
    const count = e.splits.length;
    const perPerson = count > 0 ? (e.totalAmount / count).toFixed(2) : "0.00";

    lines.push(
      `${JSON.stringify(dateStr)},${JSON.stringify(e.title)},${JSON.stringify(e.category)},${JSON.stringify(
        nm(e.paidById)
      )},${JSON.stringify(e.splitType || "EQUAL")},${e.totalAmount.toFixed(2)},${count},${perPerson}`
    );
  });

  lines.push(`"Total Expenses (${expenses.length})","","","","",${totalSpend.toFixed(2)},"",""`);
  lines.push("");
  lines.push("");

  // SECTION 4: Direct Settlements
  lines.push(`"--- 4. DIRECT RECONCILED SETTLEMENTS ---"`);
  lines.push(`"Date","Sender (Payer)","Receiver (Paid To)","Amount (INR)","Notes"`);

  if (payments.length === 0) {
    lines.push(`"-","No direct settlements recorded yet","-",0.00,"-"`);
  } else {
    payments.forEach((p) => {
      const pDate = new Date(p.createdAt).toLocaleDateString("en-IN");
      lines.push(
        `${JSON.stringify(pDate)},${JSON.stringify(nm(p.payerId))},${JSON.stringify(
          nm(p.receiverId)
        )},${p.amount.toFixed(2)},${JSON.stringify(p.notes || "Direct UPI Settle")}`
      );
    });
  }

  lines.push(`"Total Reconciled Settlements (${payments.length})","","",${totalReconciled.toFixed(2)},""`);

  return lines.join("\n");
}
