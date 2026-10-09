import { describe, expect, it } from "vitest";
import { buildWhatsAppSummary } from "@/lib/export";

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
});
