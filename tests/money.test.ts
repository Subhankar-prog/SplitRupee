import { describe, expect, it } from "vitest";
import { formatINR, formatPaise, MoneyError, toPaise } from "@/lib/money";

describe("Indian currency engine", () => {
  it("formats with Indian digit grouping", () => {
    expect(formatINR(250000)).toBe("₹2,50,000.00");
    expect(formatINR(12345678.9)).toBe("₹1,23,45,678.90");
    expect(formatPaise(100)).toBe("₹1.00");
  });
  it("rounds to two decimals", () => {
    expect(formatINR(0.1 + 0.2)).toBe("₹0.30");
  });
  it("converts rupees to exact paise and rejects sub-paisa input", () => {
    expect(toPaise(33.33)).toBe(3333);
    expect(toPaise(1.1)).toBe(110);
    expect(() => toPaise(10.005)).toThrow(MoneyError);
    expect(() => toPaise(NaN)).toThrow(MoneyError);
  });
});
