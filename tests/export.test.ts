import { describe, expect, it } from "vitest";
import {
  buildWhatsAppSummary,
  buildGroupLedgerCSV,
  buildGroupStatementData,
  cleanSettlementNotes,
} from "@/lib/export";
import { exportGroupLedgerPDF } from "@/lib/pdfExport";

describe("WhatsApp export", () => {
  it("renders transfers and standings in ₹ with Indian grouping", () => {
    const text = buildWhatsAppSummary(
      "Goa Trip",
      { a: "Aarav", b: "Diya" },
      { a: -25_000_000, b: 25_000_000 },
      [{ from: "a", to: "b", amountPaise: 25_000_000 }],
    );
    expect(text).toContain("*💸 SplitRupee: Goa Trip*");
    expect(text).toContain("Aarav ➜ Diya: *₹2,50,000*");
    expect(text).toContain("🔴 Aarav owes ₹2,50,000");
    expect(text).toContain("🟢 Diya gets back ₹2,50,000");
  });
  it("celebrates a settled group", () => {
    expect(buildWhatsAppSummary("G", {}, {}, [])).toContain("Everyone is settled up");
  });

  it("generates a clean standard Excel/CSV ledger without FX rate", () => {
    const csv = buildGroupLedgerCSV(
      "Manali Road Trip",
      [
        { id: "u1", name: "Subhankar", avatarColor: "#10b981" },
        { id: "u2", name: "Rahul", avatarColor: "#0ea5e9" },
      ],
      [
        {
          id: "e1",
          groupId: "g1",
          paidById: "u1",
          title: "Fuel & Tolls",
          totalAmount: 3000,
          splitType: "EQUAL",
          category: "Travel",
          date: "2026-10-14",
          createdAt: "2026-10-14",
          updatedAt: "2026-10-14",
          paidBy: { id: "u1", name: "Subhankar", avatarColor: "#10b981" },
          splits: [
            { id: "s1", userId: "u1", amount: 1500, percentage: 50, user: { id: "u1", name: "Subhankar", avatarColor: "#10b981" } },
            { id: "s2", userId: "u2", amount: 1500, percentage: 50, user: { id: "u2", name: "Rahul", avatarColor: "#0ea5e9" } },
          ],
        },
      ],
      [],
      { u1: 150000, u2: -150000 },
      [{ from: "u2", to: "u1", amountPaise: 150000 }]
    );

    expect(csv).toContain("SPLITRUPEE FINANCIAL STATEMENT & EXPENSE LEDGER");
    expect(csv).toContain('"Group Name:","Manali Road Trip"');
    expect(csv).toContain('"Member Name","Total Paid (INR)","Fair Share (INR)","Net Balance (INR)","Status"');
    expect(csv).toContain('"Subhankar",3000,1500,1500,"Gets Back INR 1500"');
    expect(csv).toContain('"Rahul",0,1500,-1500,"Owes INR 1500"');
    expect(csv).toContain('"Rahul","Subhankar",1500,"1-Tap UPI / Cash"');
    expect(csv).not.toContain("FX Rate");
    expect(csv).not.toContain("NPR");
  });

  it("unifies CSV and PDF statement data with all 4 sections, totals, and clean notes", async () => {
    const members = [
      { id: "u1", name: "SUBHANKAR PANDA", avatarColor: "#10b981" },
      { id: "u2", name: "Sumit Bhuyan", avatarColor: "#0ea5e9" },
      { id: "u3", name: "Madan", avatarColor: "#f59e0b" },
    ];
    const expenses = [
      {
        id: "e1",
        groupId: "g1",
        paidById: "u1",
        title: "RSL - HWH Train",
        totalAmount: 3228,
        splitType: "EQUAL" as const,
        category: "Travel" as const,
        date: "2026-12-31",
        createdAt: "2026-12-31",
        updatedAt: "2026-12-31",
        paidBy: members[0],
        splits: [
          { id: "s1", userId: "u1", amount: 1076, percentage: 33.34, user: members[0] },
          { id: "s2", userId: "u2", amount: 1076, percentage: 33.33, user: members[1] },
          { id: "s3", userId: "u3", amount: 1076, percentage: 33.33, user: members[2] },
        ],
      },
    ];
    const payments = [
      {
        id: "p1",
        groupId: "g1",
        payerId: "u2",
        receiverId: "u1",
        amount: 800,
        notes: "Train ticket both ways hwh-hwh [idempotency:attempt_1794373897290_e5zuk3]",
        createdAt: "2026-11-11",
        payer: members[1],
        receiver: members[0],
      },
    ];
    const balances = { u1: 135200, u2: -27600, u3: -107600 };
    const transfers = [
      { from: "u3", to: "u1", amountPaise: 107600 },
      { from: "u2", to: "u1", amountPaise: 27600 },
    ];

    expect(cleanSettlementNotes(payments[0].notes)).toBe("Train ticket both ways hwh-hwh");
    expect(cleanSettlementNotes("[idempotency:abc_123]")).toBe("Direct UPI Settle");

    const data = buildGroupStatementData(
      { name: "NEPAL", type: "TRIP" },
      members,
      expenses,
      payments,
      balances,
      transfers
    );
    expect(data.expenseCount).toBe(1);
    expect(data.totalSpend).toBe(3228);
    expect(data.paymentCount).toBe(1);
    expect(data.totalReconciled).toBe(800);
    expect(data.directSettlements[0].notes).toBe("Train ticket both ways hwh-hwh");

    const csv = buildGroupLedgerCSV(
      { name: "NEPAL", type: "TRIP" },
      members,
      expenses,
      payments,
      balances,
      transfers
    );
    expect(csv).toContain('"Category:","TRIP"');
    expect(csv).toContain('"Members Count:",3');
    expect(csv).toContain('"Pending Transfers:","2 Transfers Required"');
    expect(csv).toContain("--- 4. DIRECT RECONCILED SETTLEMENTS (1) ---");
    expect(csv).toContain("Train ticket both ways hwh-hwh");
    expect(csv).not.toContain("[idempotency:");

    const doc = exportGroupLedgerPDF(
      { name: "NEPAL", type: "TRIP" },
      members,
      expenses,
      payments,
      balances,
      transfers,
      { download: false }
    );

    const combinedPdfText = ((doc.internal as any).pages as string[][])
      .flat()
      .filter(Boolean)
      .join("\n");

    expect(combinedPdfText).toContain("1. MEMBER BALANCES & FAIR SHARE");
    expect(combinedPdfText).toContain("2. OPTIMIZED SETTLEMENT PLAN");
    expect(combinedPdfText).toContain("3. ITEMIZED EXPENSES REGISTER");
    expect(combinedPdfText).toContain("4. DIRECT RECONCILED SETTLEMENTS");
    expect(combinedPdfText).toContain("EQUAL");
    expect(combinedPdfText).toContain("INR 1076");
    expect(combinedPdfText).toContain("Total Expenses");
    expect(combinedPdfText).toContain("Total Reconciled Settlements");
    expect(combinedPdfText).toContain("INR 800");
    expect(combinedPdfText).toContain("Train ticket both ways hwh-hwh");
    expect(combinedPdfText).not.toContain("[idempotency:");
  });
});
