import { describe, it, expect } from "vitest";
import {
  ALL_CURRENCIES,
  POPULAR_CURRENCIES,
  getCurrency,
  getRateToINR,
  convertToINR,
  formatCurrencyAmount,
} from "@/lib/currencies";
import { expensePayloadSchema } from "@/lib/validation";
import { computeSplits } from "@/lib/split";

describe("Global Multi-Currency Engine (lib/currencies.ts)", () => {
  it("supports over 100 global currencies including all neighboring and small countries", () => {
    expect(ALL_CURRENCIES.length).toBeGreaterThan(100);

    // Specifically test small / neighboring countries requested by user
    const nepal = ALL_CURRENCIES.find((c) => c.code === "NPR");
    expect(nepal).toBeDefined();
    expect(nepal?.country).toBe("Nepal");
    expect(nepal?.symbol).toBe("रू");
    expect(nepal?.flag).toBe("🇳🇵");

    const bhutan = ALL_CURRENCIES.find((c) => c.code === "BTN");
    expect(bhutan).toBeDefined();
    expect(bhutan?.country).toBe("Bhutan");
    expect(bhutan?.flag).toBe("🇧🇹");

    const bangladesh = ALL_CURRENCIES.find((c) => c.code === "BDT");
    expect(bangladesh).toBeDefined();
    expect(bangladesh?.country).toBe("Bangladesh");
    expect(bangladesh?.symbol).toBe("৳");

    const sriLanka = ALL_CURRENCIES.find((c) => c.code === "LKR");
    expect(sriLanka).toBeDefined();
    expect(sriLanka?.country).toBe("Sri Lanka");

    const maldives = ALL_CURRENCIES.find((c) => c.code === "MVR");
    expect(maldives).toBeDefined();
    expect(maldives?.country).toBe("Maldives");

    const thailand = ALL_CURRENCIES.find((c) => c.code === "THB");
    expect(thailand).toBeDefined();
    expect(thailand?.country).toBe("Thailand");
    expect(thailand?.symbol).toBe("฿");

    const uae = ALL_CURRENCIES.find((c) => c.code === "AED");
    expect(uae).toBeDefined();
    expect(uae?.country).toBe("United Arab Emirates");
  });

  it("handles case-insensitive and unknown currency lookups safely", () => {
    const inr = getCurrency("inr");
    expect(inr.code).toBe("INR");
    expect(inr.symbol).toBe("₹");

    const npr = getCurrency("npr");
    expect(npr.code).toBe("NPR");

    const unknown = getCurrency("XYZ_FAKE");
    expect(unknown.code).toBe("XYZ_FAKE");
    expect(unknown.rateToINR).toBe(1.0);

    const empty = getCurrency(null);
    expect(empty.code).toBe("INR");
  });

  it("correctly converts foreign amounts to INR using baseline rates", () => {
    // Nepal: 1 NPR = 0.625 INR => 1000 NPR = 625.00 INR
    const nprRes = convertToINR(1000, "NPR");
    expect(nprRes.inrAmount).toBe(625.00);
    expect(nprRes.rate).toBe(0.625);

    // Thailand: 1 THB = 2.45 INR => 1000 THB = 2450.00 INR
    const thbRes = convertToINR(1000, "THB");
    expect(thbRes.inrAmount).toBe(2450.00);

    // UAE: 1 AED = 22.85 INR => 100 AED = 2285.00 INR
    const aedRes = convertToINR(100, "AED");
    expect(aedRes.inrAmount).toBe(2285.00);

    // INR should always be 1:1
    const inrRes = convertToINR(500, "INR");
    expect(inrRes.inrAmount).toBe(500.00);
    expect(inrRes.rate).toBe(1.0);
  });

  it("supports traveler custom exchange rate override (e.g. specific credit card/forex booth rate)", () => {
    // If user's bank charged 1 NPR = 0.635 INR:
    const customRes = convertToINR(1000, "NPR", 0.635);
    expect(customRes.inrAmount).toBe(635.00);
    expect(customRes.rate).toBe(0.635);
  });

  it("formats foreign currency amounts with their proper symbol and locale formatting", () => {
    const formattedNPR = formatCurrencyAmount(1250.5, "NPR");
    expect(formattedNPR).toBe("रू1,250.50");

    const formattedTHB = formatCurrencyAmount(3000, "THB");
    expect(formattedTHB).toBe("฿3,000.00");

    const formattedUSD = formatCurrencyAmount(99.99, "USD");
    expect(formattedUSD).toBe("$99.99");
  });
});

describe("Multi-Currency Expense Payload Validation & Split Engine", () => {
  it("validates multi-currency expense payload schemas correctly", () => {
    const payload = {
      groupId: "grp_123",
      paidById: "usr_1",
      title: "Pokhara Lakeside Lunch",
      totalAmount: 625.00, // INR equivalent stored in totalAmount
      originalAmount: 1000.00, // foreign amount
      currency: "NPR",
      exchangeRate: 0.625,
      splitType: "EQUAL" as const,
      category: "Food" as const,
      splits: [
        { userId: "usr_1" },
        { userId: "usr_2" },
      ],
    };

    const parsed = expensePayloadSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.currency).toBe("NPR");
      expect(parsed.data.originalAmount).toBe(1000.00);
      expect(parsed.data.exchangeRate).toBe(0.625);
      expect(parsed.data.totalAmount).toBe(625.00);
    }
  });

  it("splits multi-currency INR total with exact paise conservation", () => {
    // A 1,000 NPR bill converted to 625 INR split equally among 3 travelers:
    // 625.00 INR = 62500 paise
    // 62500 / 3 = 20834 + 20833 + 20833 = 62500 paise (exact!)
    const splits = [
      { userId: "u1" },
      { userId: "u2" },
      { userId: "u3" },
    ];
    const computed = computeSplits(625.00, "EQUAL", splits);
    expect(computed.totalPaise).toBe(62500);
    const sumPaise = computed.splits.reduce((acc, s) => acc + s.amountPaise, 0);
    expect(sumPaise).toBe(62500);
    expect(computed.splits[0].amountPaise).toBe(20834);
    expect(computed.splits[1].amountPaise).toBe(20833);
    expect(computed.splits[2].amountPaise).toBe(20833);
  });
});
