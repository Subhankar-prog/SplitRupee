import { describe, expect, it } from "vitest";
import { buildWhatsAppSummary, buildGroupLedgerCSV } from "@/lib/export";

describe("WhatsApp export", () => {
  it("renders transfers and standings in ₹ with Indian grouping", () => {
    const text = buildWhatsAppSummary(
      "Goa Trip",
      { a: "Aarav", b: "Diya" },
      { a: -25_000_000, b: 25_000_000 },
      [{ from: "a", to: "b", amountPaise: 25_000_000 }],
    );
    expect(text).toContain("*💸 SplitRupee: Goa Trip*");
    expect(text).toContain("Aarav ➜ Diya: *₹2,50,000.00*");
    expect(text).toContain("🔴 Aarav owes ₹2,50,000.00");
    expect(text).toContain("🟢 Diya gets back ₹2,50,000.00");
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
    expect(csv).toContain('"Subhankar",3000.00,1500.00,1500.00,"Gets Back INR 1500.00"');
    expect(csv).toContain('"Rahul",0.00,1500.00,-1500.00,"Owes INR 1500.00"');
    expect(csv).toContain('"Rahul","Subhankar",1500.00,"1-Tap UPI / Cash"');
    expect(csv).not.toContain("FX Rate");
    expect(csv).not.toContain("NPR");
  });
});
