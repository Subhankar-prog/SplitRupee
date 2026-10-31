import { describe, expect, it } from "vitest";
import { formatINR, formatPaise, MoneyError, toPaise, roundFigure } from "@/lib/money";

describe("Indian currency engine with round figure rules", () => {
  it("formats with Indian digit grouping and no fractions", () => {
    expect(formatINR(250000)).toBe("₹2,50,000");
    expect(formatINR(12345678.9)).toBe("₹1,23,45,679");
    expect(formatPaise(100)).toBe("₹1");
  });

  it("applies <= 0.50 down and > 0.50 (>= 0.51) up round figure rule", () => {
    expect(roundFigure(10.0)).toBe(10);
    expect(roundFigure(10.49)).toBe(10);
    expect(roundFigure(10.50)).toBe(10);
    expect(roundFigure(10.51)).toBe(11);
    expect(roundFigure(10.99)).toBe(11);
    expect(roundFigure(100.50)).toBe(100);
    expect(roundFigure(100.51)).toBe(101);

    expect(formatINR(10.50)).toBe("₹10");
    expect(formatINR(10.51)).toBe("₹11");
    expect(formatINR(100.50)).toBe("₹100");
    expect(formatINR(100.51)).toBe("₹101");
  });

  it("converts rupees to round figure paise", () => {
    expect(toPaise(33.33)).toBe(3300);
    expect(toPaise(33.51)).toBe(3400);
    expect(toPaise(1.1)).toBe(100);
    expect(toPaise(100.50)).toBe(10000);
    expect(toPaise(100.51)).toBe(10100);
    expect(() => toPaise(NaN)).toThrow(MoneyError);
  });
});
