import { describe, it, expect } from "vitest";
import { getDestinationPermitsAndActivities, getDynamicPlaceSections } from "../lib/destinationGroundEngine";

describe("destinationGroundEngine", () => {
  describe("getDestinationPermitsAndActivities", () => {
    it("returns ACAP & Muktinath permits for Nepal", () => {
      const res = getDestinationPermitsAndActivities("Kathmandu, Nepal", 8);
      expect(res.permitName).toContain("ACAP Ghandruk, Muktinath");
      expect(res.permitDescription).toContain("Annapurna Conservation Area Permit");
      expect(res.activitiesName).toContain("Cable Car");
    });

    it("returns Ladakh ILP & Environmental passes for Ladakh", () => {
      const res = getDestinationPermitsAndActivities("Leh Ladakh", 6);
      expect(res.permitName).toContain("Ladakh ILP");
      expect(res.permitDescription).toContain("Nubra Valley & Pangong Tso");
      expect(res.activitiesName).toContain("Camel Dunes");
    });

    it("returns Coastal Eco-Cess & Fort passes for Goa", () => {
      const res = getDestinationPermitsAndActivities("Goa", 4);
      expect(res.permitName).toContain("Coastal Eco-Cess");
      expect(res.activitiesName).toContain("Mandovi River Cruise, Dudhsagar Safari");
    });

    it("returns Gulmarg Gondola & Valley passes for Kashmir", () => {
      const res = getDestinationPermitsAndActivities("Srinagar, Kashmir", 4);
      expect(res.permitName).toContain("Gulmarg Gondola");
      expect(res.activitiesName).toContain("Dal Lake Shikara Cruise");
    });

    it("returns Eravikulam & Periyar passes for Kerala", () => {
      const res = getDestinationPermitsAndActivities("Munnar, Kerala", 5);
      expect(res.permitName).toContain("Eravikulam National Park");
      expect(res.activitiesName).toContain("Alleppey Backwater Shikara");
    });

    it("returns ASI Composite Monument passes for Rajasthan", () => {
      const res = getDestinationPermitsAndActivities("Jaipur, Rajasthan", 6);
      expect(res.permitName).toContain("ASI Composite Monument");
      expect(res.activitiesName).toContain("Lake Pichola");
    });

    it("returns International Visa & City Tax for Paris / International", () => {
      const res = getDestinationPermitsAndActivities("Paris, France", 2);
      expect(res.permitName).toContain("Visa-on-Arrival / Tourism Tax");
      expect(res.activitiesName).toContain("Iconic Landmark Admissions");
    });

    it("returns dynamic fallback for any other destination worldwide", () => {
      const res = getDestinationPermitsAndActivities("Varanasi", 4);
      expect(res.permitName).toContain("Varanasi");
      expect(res.permitDescription).toContain("Varanasi");
      expect(res.activitiesName).toContain("Sightseeing Passes");
    });
  });

  describe("getDynamicPlaceSections", () => {
    it("returns rich place cards for Nepal", () => {
      const gear = getDynamicPlaceSections("equipments", null, "Nepal");
      expect(gear.length).toBeGreaterThanOrEqual(5);
      expect(gear.some((s) => s.location.includes("Muktinath"))).toBe(true);
      expect(gear.some((s) => s.location.includes("Ghandruk"))).toBe(true);

      const tips = getDynamicPlaceSections("tips", null, "Nepal");
      expect(tips.some((s) => s.location.includes("Muktinath"))).toBe(true);
    });

    it("returns rich place cards for Ladakh", () => {
      const gear = getDynamicPlaceSections("equipments", null, "Leh Ladakh");
      expect(gear.length).toBeGreaterThanOrEqual(4);
      expect(gear.some((s) => s.location.includes("Pangong Tso"))).toBe(true);
      expect(gear.some((s) => s.location.includes("Khardung La"))).toBe(true);
      expect(gear.some((s) => s.location.includes("Nubra Valley"))).toBe(true);
    });

    it("returns rich place cards for Goa", () => {
      const gear = getDynamicPlaceSections("equipments", null, "North Goa");
      expect(gear.some((s) => s.location.includes("North Goa"))).toBe(true);
      expect(gear.some((s) => s.location.includes("Dudhsagar"))).toBe(true);
    });

    it("dynamically generates place cards for any other destination from days", () => {
      const customPlan = {
        destination: "Varanasi & Ayodhya",
        days: [
          { day: 1, stay: "Varanasi Ghats" },
          { day: 2, stay: "Ayodhya Ram Mandir" }
        ]
      };
      const gear = getDynamicPlaceSections("equipments", customPlan, "Varanasi & Ayodhya");
      expect(gear.length).toBeGreaterThanOrEqual(2);
      expect(gear[0].items.length).toBeGreaterThan(0);
    });

    it("parses location-prefixed string items from AI responses", () => {
      const aiResponse = {
        destination: "Custom Place",
        equipments: [
          "[Pangong Tso]: Down Jacket — For sub-zero winds",
          "[Pangong Tso]: Thermal Innerwear — For lake walks",
          "[Khardung La]: Oxy99 Canister — For 17,500ft altitude breathlessness",
          "[Khardung La]: Diamox — For altitude prevention"
        ]
      };
      const parsed = getDynamicPlaceSections("equipments", aiResponse, "Custom Place");
      expect(parsed.length).toBe(2);
      expect(parsed.find((s) => s.location === "Pangong Tso")?.items.length).toBe(2);
      expect(parsed.find((s) => s.location === "Khardung La")?.items.length).toBe(2);
    });
  });
});
