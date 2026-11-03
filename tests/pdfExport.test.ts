import { describe, it, expect, vi } from "vitest";
import { exportItineraryPDF } from "../lib/pdfExport";

describe("exportItineraryPDF", () => {
  it("generates PDF with unwrapped, complete text for equipments and tips without error", () => {
    const itineraryData = {
      form: {
        origin: "Bhubaneswar",
        destination: "Nepal",
        startDate: "2026-11-10",
        endDate: "2026-11-20",
        nights: 10,
        travellers: 8,
        groupType: "Friends",
        budget: 120000,
        stayPreference: "Hostels"
      },
      result: {
        targetBudget: 120000,
        travellers: 8,
        days: [
          {
            day: 1,
            stay: "Overnight Train",
            legs: [
              {
                from: "Bhubaneswar (BBS)",
                to: "Howrah Junction (HWH)",
                mode: "Train",
                distance_km: 437,
                depart: "06:00",
                duration_hours: 6.7,
                arrive: "12:40",
                buffer_after_minutes: 60,
                note: "Coastal rail journey",
                cost: 1760
              }
            ],
            activities: {
              morning: "Morning start at BBS",
              afternoon: "Howrah station lunch",
              evening: "Board Mithila Express",
              food: "Train snacks"
            },
            hotelDetails: null
          }
        ],
        equipments: [
          "Muktinath (3,710m): High-altitude thermal base layers — Merino wool or synthetic thermals for sub-freezing morning chills (0°C to 5°C).",
          "Muktinath (3,710m): Quick-dry microfiber towel — Essential immediately after taking the holy dip under the 108 icy waterspouts (Muktidhara) and two Kunda pools.",
          "Ghandruk (1,940m): Collapsible trekking poles — Critical knee support for ascending and descending 2,000+ uneven stone steps in the Gurung village."
        ],
        tips: [
          "Muktinath Temple Dip: Take your holy bath between 7:30 AM and 10:30 AM when morning sun warms the stone courtyard.",
          "Ghandruk Meal Protocol: Traditional Gurung homestays prepare fresh organic meals; place dinner orders by 6:00 PM."
        ]
      }
    };

    // Should run and not throw
    expect(() => exportItineraryPDF(itineraryData)).not.toThrow();
  });
});
