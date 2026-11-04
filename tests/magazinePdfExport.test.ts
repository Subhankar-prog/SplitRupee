import { describe, it, expect } from "vitest";
import { exportItineraryPDF, exportClassicItineraryPDF, exportMagazinePDF } from "../lib/pdfExport";

describe("magazinePdfExport and fallback system", () => {
  const sampleNepalPlan = {
    form: {
      origin: "Bhubaneswar",
      destination: "Nepal",
      startDate: "2026-12-23",
      endDate: "2027-01-01",
      nights: 9,
      travellers: 8,
      groupType: "Friends",
      budget: 120000
    },
    result: {
      destination: "Nepal",
      targetBudget: 120000,
      travellers: 8,
      days: [
        {
          day: 1,
          stay: "Overnight Train Berths",
          legs: [
            {
              from: "BBS",
              to: "HWH",
              mode: "Train",
              cost: 1760
            }
          ],
          activities: {
            morning: "BBS station with packed snacks",
            afternoon: "Howrah station layover",
            evening: "Board Mithila Express",
            food: "Kolkata street food and train snacks"
          }
        },
        {
          day: 2,
          stay: "Zostel Kathmandu",
          legs: [
            {
              from: "Raxaul Border",
              to: "Kathmandu",
              mode: "Dedicated Cab",
              cost: 4500
            }
          ],
          activities: {
            morning: "Clear border formalities",
            afternoon: "Scenic mountain highway drive",
            evening: "Witness soulful Pashupatinath Maha Aarti",
            food: "Hot Nepali thali and momos in Thamel"
          }
        }
      ]
    }
  };

  it("exports exportClassicItineraryPDF cleanly without throwing", () => {
    expect(() => exportClassicItineraryPDF(sampleNepalPlan)).not.toThrow();
  });

  it("exports exportItineraryPDF cleanly in classic mode", () => {
    expect(() => exportItineraryPDF({ ...sampleNepalPlan, mode: "classic" })).not.toThrow();
  });

  it("exports exportItineraryPDF cleanly in default magazine mode in node environment (falls back safely to classic)", () => {
    // In Node (non-DOM), exportItineraryPDF detects typeof window === 'undefined' and executes classic safely
    expect(() => exportItineraryPDF(sampleNepalPlan)).not.toThrow();
  });

  it("exposes exportMagazinePDF as a callable function", () => {
    expect(typeof exportMagazinePDF).toBe("function");
  });
});
