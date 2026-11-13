import { describe, it, expect } from "vitest";
import {
  formatGroupType,
  formatSplitType,
  formatItineraryGroupType,
  isNepalDestination,
  getFriendlyErrorMessage,
} from "@/lib/displayLabels";

describe("Display labels & destination helpers (F-20 / F-21)", () => {
  it("converts raw Group.type enums to readable UI labels", () => {
    expect(formatGroupType("TRIP")).toBe("Trip");
    expect(formatGroupType("HOME")).toBe("Home");
    expect(formatGroupType("COUPLE")).toBe("Couple");
    expect(formatGroupType("OTHER")).toBe("Shared");
    expect(formatGroupType(null)).toBe("Shared");
  });

  it("converts raw Expense.splitType enums to readable UI labels", () => {
    expect(formatSplitType("EQUAL")).toBe("Equal split");
    expect(formatSplitType("EXACT")).toBe("Exact split");
    expect(formatSplitType("PERCENTAGE")).toBe("Percentage split");
    expect(formatSplitType(undefined)).toBe("Split");
  });

  it("normalizes itinerary group types", () => {
    expect(formatItineraryGroupType("Friends")).toBe("Friends");
    expect(formatItineraryGroupType("COUPLE")).toBe("Couple");
    expect(formatItineraryGroupType("")).toBe("Friends");
  });

  it("identifies Nepal cross-border destinations accurately without false positives on Indian cities", () => {
    expect(isNepalDestination("Pokhara & Kathmandu, Nepal")).toBe(true);
    expect(isNepalDestination("Raxaul Border")).toBe(true);
    expect(isNepalDestination("Goa")).toBe(false);
    expect(isNepalDestination("Manali, Himachal Pradesh")).toBe(false);
    expect(isNepalDestination("")).toBe(false);
  });

  it("converts raw technical errors into friendly user-facing messages", () => {
    expect(getFriendlyErrorMessage(new Error("Failed to fetch"))).toContain("couldn't connect to the server");
    expect(getFriendlyErrorMessage("401 Unauthorized")).toContain("session has expired");
    expect(getFriendlyErrorMessage("404 Not Found")).toContain("couldn't find what you're looking for");
    expect(getFriendlyErrorMessage("Invalid payload")).toContain("check the information you entered");
    expect(getFriendlyErrorMessage(null)).toBe("Something went wrong. Please try again.");
  });
});

