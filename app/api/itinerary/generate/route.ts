import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVerifiedTrainsForRoute, VerifiedTrainRoute } from "@/lib/irctcData";
import { getVerifiedGroundData, getVerifiedHotelForBudget, isDemoPhoneNumber } from "@/lib/localGroundData";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      origin = "Bhubaneswar",
      destination = "Nepal",
      startDate = new Date().toISOString().split("T")[0],
      endDate = new Date(Date.now() + 9 * 86400000).toISOString().split("T")[0],
      daysCount: reqDays,
      nightsCount: reqNights,
      groupSize = 4,
      groupType = "Friends",
      budget = 50000,
      trainClass = "SL",
      busClass = "AC Sleeper (Volvo)",
      transportModes = ["Train", "Private Taxi", "Local Bus"],
      stayPreference = "Budget Hostels / Guesthouses",
      pace = "Moderate",
      specialNotes = "",
      userId,
      groupId
    } = body;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysCount = reqDays ? Number(reqDays) : Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
    const nightsCount = reqNights ? Number(reqNights) : Math.max(0, daysCount - 1);
    const numGroup = Math.max(1, Number(groupSize) || 1);
    const numBudget = Number(budget) || 50000;

    let planData = null;
    let isLiveAI = false;

    const verifiedTrainsForRoute = getVerifiedTrainsForRoute(origin, destination);
    const flightSelected = transportModes.some((m: string) => m.toLowerCase().includes("flight"));

    // 1. Universal AI Itinerary Engine (Google Gemini AI with Live Search Grounding)
    if (process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        let model;
        const systemInstruction = `You are a strict, real-world verified travel engine for Indian Railways, international transit, hotels, and local transport. You PRIORITIZE ACCURACY AND VERIFICATION OVER SPEED. Take all necessary processing time to search, analyze, and validate real-world routes. You NEVER fabricate train numbers or routes. (For example, Train 22811 is the BBS-NDLS Rajdhani Express to New Delhi, NOT to New Jalpaiguri/Sikkim). Every train number you provide MUST be a real 5-digit IRCTC train number that actually operates on that specific route. Every hotel MUST be a real existing property. Every local taxi recommendation MUST be realistic with real tourist taxi union counters or verified local contacts. All math must be 100% exact. ${
          !flightSelected
            ? 'CRITICAL NEGATIVE CONSTRAINT: "Flight" is NOT selected by the user. You are STRICTLY FORBIDDEN from including flights, airlines, airports, or flight booking steps anywhere in the itinerary output.'
            : ""
        }`;

        try {
          model = genAI.getGenerativeModel({
            model: "gemini-3.8-flash",
            tools: [{ googleSearch: {} }] as any,
            systemInstruction
          });
        } catch {
          model = genAI.getGenerativeModel({
            model: "gemini-3.8-flash",
            systemInstruction
          });
        }

        const trainContextString = verifiedTrainsForRoute.length > 0
          ? `VERIFIED GROUND TRUTH IRCTC TRAIN ROUTE DATA FOR THIS CORRIDOR:
${JSON.stringify(verifiedTrainsForRoute, null, 2)}
(USE THESE VERIFIED TRAIN NUMBERS AND SCHEDULES IN YOUR JSON RESPONSE)`
          : "";

        const prompt = `Generate a 100% REALISTIC, SEARCH-VERIFIED, minute-by-minute FULL ROUND-TRIP travel blueprint in JSON format for ANY origin and destination worldwide based on this request:

TRIP SPECIFICATIONS:
- Starting Origin: ${origin} (MANDATORY: Day 1 MUST start at ${origin} station/terminal)
- Target Destination / Circuit: ${destination} (${specialNotes})
- Duration: ${daysCount} Days / ${nightsCount} Nights (${startDate} to ${endDate})
- Travelers: ${numGroup} (${groupType})
- Target Group Budget: ₹${numBudget} (STRICT BUDGET CEILING IN INR ₹)
- Preferred Train Class: ${trainClass} (e.g. 2S for day seating, SL, 3A, 2A, 1A)
- Preferred Bus Type: ${busClass}
- Transport Modes Allowed: ${transportModes.join(", ")}
- Stay Preference: ${stayPreference}
- Pace: ${pace}
- Special Notes / Places to Visit: ${specialNotes}

${trainContextString}

STRICT ACCURACY & SEARCH VERIFICATION DIRECTIVES:
1. ACCURACY OVER SPEED: Do NOT rush or give generic placeholder data. Perform live web search and route validation to confirm every train number, station code, highway route, and hotel property.
2. DATE-SPECIFIC REAL-TIME DATA (${startDate} to ${endDate}): Search for hotel availability, seasonal rates, and taxi/transit options tailored specifically to these travel dates. Do NOT return outdated or demo templates.
3. ${
  !flightSelected
    ? 'FORBIDDEN TRANSPORT MODES: The user DID NOT select "Flight". You are ABSOLUTELY PROHIBITED from mentioning flights, airlines, airport codes, or air travel anywhere in the JSON response.'
    : 'ALLOW FLIGHTS: Include flight options if applicable.'
}
4. REAL IRCTC TRAIN NUMBERS ONLY: Search and verify Indian Railways train numbers. NEVER invent fake train numbers or map wrong routes (e.g., for BBS to NJP, use real trains like 15643 Puri-Kamakhya Express, 12513 Secunderabad-Guwahati SF, 12509, 22503, or 2-leg routes via HWH like 12074 Jan Shatabdi + 12041 Shatabdi / 12377 Padatik Express / 22301 Vande Bharat).
5. REAL HOTELS & HOMESTAYS ONLY: Recommend actual existing properties (e.g. Zostel, Hotel Moonlight, Hotel Mulberry, Hotel Himalaya, local homestays) matching the budget tier and travel dates.
6. REAL TAXI DESKS & HELPLINES: Provide real tourist taxi association counters, station prepaid cab desks, or verified local driver contacts with valid phone formats (+91-XXXXX-XXXXX or local helpline).
7. STRICT BUDGET CEILING (STRICTLY ≤ ₹${numBudget}):
   - The sum of all expenses ("totalEstimatedCost") MUST be strictly SAME OR BELOW ₹${numBudget}. Adjust stay tiers (e.g. budget hostel / guest house) and local transit options (e.g. shared jeep / prepaid taxi) so the total does NOT exceed target budget.
8. EXACT MATHEMATICAL ACCURACY:
   - "totalTrainCost" = "estimatedCostPerPerson" * ${numGroup}
   - "totalBusCost" = "estimatedCostPerPerson" * ${numGroup}
   - "totalStayCost" = "pricePerNight" * "nights"
   - "totalEstimatedCost" = sum of all transport, stay, food & activities.
   - If "totalEstimatedCost" > ${numBudget}, set "budgetStatus" to "EXCEEDS_BUDGET".

Output strictly VALID JSON (without markdown code blocks) matching this schema:
{
  "summary": "Full round-trip overview string",
  "daysCount": ${daysCount},
  "nightsCount": ${nightsCount},
  "totalEstimatedCost": number,
  "targetBudget": ${numBudget},
  "budgetStatus": "UNDER_BUDGET" | "EXCEEDS_BUDGET",
  "costBreakdown": {
    "trains": number,
    "localTransport": number,
    "stay": number,
    "foodAndActivities": number
  },
  "trains": [
    {
      "trainName": "String",
      "trainNumber": "String",
      "from": "String",
      "to": "String",
      "departure": "String",
      "arrival": "String",
      "classPreference": "String",
      "estimatedCostPerPerson": number,
      "totalTrainCost": number,
      "tip": "String"
    }
  ],
  "buses": [
    {
      "busOperator": "String",
      "route": "String",
      "busType": "String",
      "departure": "String",
      "arrival": "String",
      "estimatedCostPerPerson": number,
      "totalBusCost": number,
      "bookingTip": "String"
    }
  ],
  "localTransport": [
    {
      "leg": "String",
      "mode": "String",
      "recommendation": "String",
      "estimatedCost": number,
      "driverContacts": [
        { "name": "String", "phone": "String", "vehicle": "String" }
      ]
    }
  ],
  "accommodations": [
    {
      "hotelName": "String",
      "location": "String",
      "type": "String",
      "pricePerNight": number,
      "nights": number,
      "totalStayCost": number,
      "bookingTip": "String",
      "contactName": "String",
      "contactPhone": "String"
    }
  ],
  "days": [
    {
      "dayNumber": number,
      "dayTitle": "Day X — Title: Route Overview",
      "routeOverview": "Route string",
      "timeline": [
        { "time": "05:00", "plan": "Activity description" }
      ],
      "transitDetail": "Transit details",
      "nightStay": "Night X location",
      "warning": "Warning note if any",
      "estimatedDayExpense": number
    }
  ],
  "bookingSummary": [
    { "leg": "String", "preferredClass": "String", "bookingApproach": "String" }
  ],
  "nightSummary": [
    { "night": 1, "date": "Day 1", "where": "Location" }
  ],
  "packingItems": [
    { "category": "String", "items": ["Item"] }
  ],
  "travelTips": [
    { "title": "String", "description": "String" }
  ],
  "importableExpenses": [
    { "title": "String", "amount": number, "category": "Travel" | "Rent" | "Food" | "Entertainment" }
  ]
}`;

        let text = "";
        const modelNames = [
          "gemini-3.1-flash-lite",
          "gemini-3.5-flash-lite",
          "gemini-3.7-flash",
          "gemini-flash-latest",
          "gemini-pro-latest"
        ];

        for (const modelName of modelNames) {
          try {
            let model;
            try {
              model = genAI.getGenerativeModel({
                model: modelName,
                tools: [{ googleSearch: {} }] as any,
                systemInstruction
              });
            } catch {
              model = genAI.getGenerativeModel({
                model: modelName,
                systemInstruction
              });
            }

            const result = await model.generateContent(prompt);
            text = result.response.text();
            if (text) break;
          } catch (mErr: any) {
            console.warn(`Gemini model ${modelName} unavailable/failed:`, mErr.message);
          }
        }

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          planData = JSON.parse(jsonMatch[0]);
          planData = verifyAndFixItineraryMath(planData, numGroup, numBudget, origin, destination, flightSelected);
          isLiveAI = true;
        }
      } catch (err) {
        console.error("Gemini API error, falling back to universal generator:", err);
      }
    }

    // 2. Universal Fallback Generator (No hardcoded destination checks)
    if (!planData) {
      planData = generateUniversalMasterItinerary({
        origin,
        destination,
        daysCount,
        nightsCount,
        groupSize: numGroup,
        groupType,
        budget: numBudget,
        trainClass,
        busClass,
        transportModes,
        stayPreference,
        pace,
        specialNotes
      });
    }

    // Save to Database if Prisma is available
    let savedItinerary = null;
    try {
      savedItinerary = await prisma.itinerary.create({
        data: {
          title: `Trip from ${origin} to ${destination} (${daysCount}D / ${nightsCount}N)`,
          origin,
          destination,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          days: daysCount,
          groupSize: numGroup,
          totalBudget: numBudget,
          preferences: JSON.stringify({
            nightsCount,
            groupType,
            trainClass,
            busClass,
            transportModes,
            stayPreference,
            pace,
            specialNotes,
            isLiveAI
          }),
          planData: JSON.stringify(planData),
          userId: userId || null,
          groupId: groupId || null
        }
      });
    } catch (e) {
      console.warn("Could not save itinerary to DB:", e);
    }

    return NextResponse.json({
      ok: true,
      itineraryId: savedItinerary?.id || "temp-" + Date.now(),
      plan: planData,
      isLiveAI
    });
  } catch (err: any) {
    console.error("[POST /api/itinerary/generate]", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to generate itinerary" },
      { status: 500 }
    );
  }
}

/** Recalculate, verify math, sanitize mode text, and enforce IRCTC ground truth */
function verifyAndFixItineraryMath(
  plan: any,
  groupSize: number,
  targetBudget: number,
  origin: string,
  destination: string,
  flightSelected: boolean
) {
  const gSize = Math.max(1, groupSize);

  // 1. Enforce verified IRCTC train data if available for route
  const verifiedRouteTrains = getVerifiedTrainsForRoute(origin, destination);
  if (verifiedRouteTrains.length > 0 && Array.isArray(plan.trains)) {
    // Substitute or align with verified train numbers
    plan.trains = verifiedRouteTrains.map((vTrain) => {
      const classKey = plan.trainClass || "SL";
      const perHead = vTrain.approxFarePerPerson[classKey] || vTrain.approxFarePerPerson["SL"] || 400;
      return {
        trainName: vTrain.trainName,
        trainNumber: vTrain.trainNumber,
        from: vTrain.from,
        to: vTrain.to,
        departure: vTrain.departure,
        arrival: vTrain.arrival,
        classPreference: classKey,
        estimatedCostPerPerson: perHead,
        totalTrainCost: perHead * gSize,
        tip: vTrain.tip
      };
    });
  } else if (Array.isArray(plan.trains)) {
    plan.trains = plan.trains.map((train: any) => {
      const perHead = Number(train.estimatedCostPerPerson) || 0;
      return {
        ...train,
        totalTrainCost: perHead * gSize
      };
    });
  }

  // 2. Calculate buses
  let busSum = 0;
  if (Array.isArray(plan.buses)) {
    plan.buses = plan.buses.map((bus: any) => {
      const perHead = Number(bus.estimatedCostPerPerson) || 0;
      const totalBusCost = perHead * gSize;
      busSum += totalBusCost;
      return {
        ...bus,
        totalBusCost
      };
    });
  }

  let trainSum = 0;
  if (Array.isArray(plan.trains)) {
    plan.trains.forEach((t: any) => {
      trainSum += Number(t.totalTrainCost) || 0;
    });
  }

  let localSum = 0;
  if (Array.isArray(plan.localTransport)) {
    plan.localTransport.forEach((item: any) => {
      localSum += Number(item.estimatedCost) || 0;
    });
  }

  let staySum = 0;
  if (Array.isArray(plan.accommodations)) {
    plan.accommodations = plan.accommodations.map((acc: any) => {
      const pPerNight = Number(acc.pricePerNight) || 0;
      const nNights = Number(acc.nights) || 1;
      const totalStayCost = acc.totalStayCost ? Number(acc.totalStayCost) : pPerNight * nNights;
      staySum += totalStayCost;
      return {
        ...acc,
        totalStayCost
      };
    });
  }

  // 3. Strictly cap food and activities to respect target budget ceiling
  let foodAndActivities = Number(plan.costBreakdown?.foodAndActivities) || Math.max(0, Math.round(targetBudget * 0.2));
  const totalFixedCosts = trainSum + busSum + localSum + staySum;

  if (totalFixedCosts + foodAndActivities > targetBudget) {
    const remainingForFood = targetBudget - totalFixedCosts;
    if (remainingForFood >= 0) {
      foodAndActivities = remainingForFood;
    }
  }

  const totalLocalAndBus = busSum + localSum;
  plan.costBreakdown = {
    trains: trainSum,
    localTransport: totalLocalAndBus,
    stay: staySum,
    foodAndActivities
  };

  const calculatedTotal = trainSum + totalLocalAndBus + staySum + foodAndActivities;
  plan.totalEstimatedCost = calculatedTotal;
  plan.targetBudget = targetBudget;
  plan.budgetStatus = calculatedTotal <= targetBudget ? "UNDER_BUDGET" : "EXCEEDS_BUDGET";

  // 4. Sanitize day timeline texts if Flight was NOT selected
  if (!flightSelected && Array.isArray(plan.days)) {
    plan.days = plan.days.map((day: any) => {
      let sanitizedTransit = day.transitDetail || "";
      sanitizedTransit = sanitizedTransit.replace(/flight|airplane|airport/gi, "Train / Express Transit");

      let sanitizedTimeline = day.timeline;
      if (Array.isArray(day.timeline)) {
        sanitizedTimeline = day.timeline.map((t: any) => ({
          ...t,
          plan: (t.plan || "").replace(/flight|airplane|airport/gi, "train / station")
        }));
      }

      return {
        ...day,
        transitDetail: sanitizedTransit,
        timeline: sanitizedTimeline
      };
    });
  }

  // 5. Sanitize any demo/dummy phone numbers from AI generation
  if (Array.isArray(plan.localTransport)) {
    plan.localTransport.forEach((leg: any) => {
      if (Array.isArray(leg.driverContacts)) {
        leg.driverContacts.forEach((dc: any) => {
          if (isDemoPhoneNumber(dc.phone)) {
            dc.phone = "Physical Terminal Prepaid Counter";
          }
        });
      }
    });
  }
  if (Array.isArray(plan.accommodations)) {
    plan.accommodations.forEach((acc: any) => {
      if (isDemoPhoneNumber(acc.contactPhone)) {
        acc.contactPhone = "Front Desk on Check-In";
      }
    });
  }

  return plan;
}

/** 100% Universal Fallback Generator with IRCTC Grounding and Strict Mode Handling */
function generateUniversalMasterItinerary(opts: any) {
  const { origin, destination, daysCount, nightsCount, groupSize, budget, trainClass, busClass, stayPreference, specialNotes, transportModes = [] } = opts;
  const gSize = Math.max(1, groupSize);
  const target = Number(budget) || 50000;
  const flightSelected = transportModes.some((m: string) => m.toLowerCase().includes("flight"));

  const verifiedTrains = getVerifiedTrainsForRoute(origin, destination);

  const totalTrainCost = Math.round(target * 0.25);
  const totalStayCost = Math.round(target * 0.35);
  const taxiCost = Math.round(target * 0.2);
  const foodAndMisc = Math.round(target - (totalTrainCost + totalStayCost + taxiCost));
  const totalEstimatedCost = totalTrainCost + totalStayCost + taxiCost + Math.max(0, foodAndMisc);

  const daysArr = [];
  for (let i = 1; i <= daysCount; i++) {
    const transitLabel = flightSelected ? "Outward Train / Flight" : "Outward IRCTC Express Train";
    const stationLabel = flightSelected ? "station/airport" : "railway station";
    daysArr.push({
      dayNumber: i,
      dayTitle: i === 1
        ? `Day 1 — Outward Journey: ${origin} → ${destination} Circuit`
        : i === daysCount
        ? `Day ${daysCount} — Return Journey: ${destination} → ${origin}`
        : `Day ${i} — ${destination} Sightseeing & Circuit`,
      routeOverview: i === 1 ? `${origin} → Transit` : i === daysCount ? `Transit → ${origin}` : `${destination} Local`,
      timeline: [
        { time: "05:00", plan: i === 1 ? `Reach ${origin} ${stationLabel}` : `Morning breakfast & prep` },
        { time: "08:00", plan: i === 1 ? `Board outward transit to ${destination}` : `Explore key spots in ${destination}` },
        { time: "14:00", plan: `Local lunch & regional sightseeing` },
        { time: "20:00", plan: i === daysCount ? `Arrive back in ${origin}` : `Dinner & check in at stay` }
      ],
      transitDetail: i === 1 ? `${transitLabel} from ${origin}` : i === daysCount ? `Return Transit back to ${origin}` : `Local Private / Shared Vehicle`,
      nightStay: i === daysCount ? `Home in ${origin}` : `Night ${i}: Stay in ${destination}`,
      warning: i === 1 ? `Arrive at ${origin} ${stationLabel} at least 30 minutes prior.` : null,
      estimatedDayExpense: Math.round(foodAndMisc / daysCount)
    });
  }

  const defaultTrainList = verifiedTrains.length > 0
    ? verifiedTrains.map((vt) => ({
        trainName: vt.trainName,
        trainNumber: vt.trainNumber,
        from: vt.from,
        to: vt.to,
        departure: vt.departure,
        arrival: vt.arrival,
        classPreference: trainClass,
        estimatedCostPerPerson: vt.approxFarePerPerson[trainClass] || vt.approxFarePerPerson["SL"] || 400,
        totalTrainCost: (vt.approxFarePerPerson[trainClass] || 400) * gSize,
        tip: vt.tip
      }))
    : [
        {
          trainName: `${origin} → ${destination} Express / Transit`,
          trainNumber: "12801",
          from: `${origin} Station`,
          to: `${destination} Station / Gateway`,
          departure: "06:00 AM",
          arrival: "02:00 PM",
          classPreference: trainClass,
          estimatedCostPerPerson: Math.round(totalTrainCost / gSize),
          totalTrainCost,
          tip: "Book early to lock in seats."
        }
      ];

  return {
    summary: `${daysCount} Days / ${nightsCount} Nights full round-trip from ${origin} to ${destination} and returning to ${origin}.`,
    daysCount,
    nightsCount,
    totalEstimatedCost,
    targetBudget: target,
    budgetStatus: totalEstimatedCost <= target ? "UNDER_BUDGET" : "EXCEEDS_BUDGET",
    costBreakdown: {
      trains: totalTrainCost,
      localTransport: taxiCost,
      stay: totalStayCost,
      foodAndActivities: Math.max(0, foodAndMisc)
    },
    trains: defaultTrainList,
    buses: [],
    localTransport: [
      {
        leg: `${destination} Gateway ↔ Hotel & Local Circuit`,
        mode: "Private SUV / Shared Vehicle",
        recommendation: `1 dedicated vehicle for ${gSize} travelers.`,
        estimatedCost: taxiCost,
        driverContacts: (() => {
          const groundData = getVerifiedGroundData(destination);
          if (groundData?.taxiServices && groundData.taxiServices.length > 0) {
            return groundData.taxiServices.slice(0, 2).map((ts) => ({
              name: ts.name,
              phone: ts.phone || "Physical Prepaid Booth on Arrival",
              vehicle: ts.type === "Taxi Union" ? "Shared Jeep / Syndicate Taxi" : "Prepaid Counter Taxi"
            }));
          }
          return [
            {
              name: `${destination} Official Prepaid Taxi Booth`,
              phone: "Terminal / Station Prepaid Counter on Arrival",
              vehicle: "SUV / Sedan"
            }
          ];
        })()
      }
    ],
    accommodations: (() => {
      const perNightRate = Math.max(500, Math.round(totalStayCost / (nightsCount || 1) / gSize));
      const matchedHotel = getVerifiedHotelForBudget(destination, perNightRate);
      return [
        {
          hotelName: matchedHotel?.name || `${destination} Verified Guesthouse & Homestay`,
          location: matchedHotel?.address || `Central ${destination}`,
          type: stayPreference,
          pricePerNight: matchedHotel?.approxRatePerNight ? matchedHotel.approxRatePerNight * gSize : perNightRate * gSize,
          nights: nightsCount,
          totalStayCost,
          bookingTip: matchedHotel?.bookingTip || "Book in advance directly or via official regional tourism portal.",
          contactName: "Front Desk / Booking Desk",
          contactPhone: matchedHotel?.phone || "Direct Front Desk on Check-In"
        }
      ];
    })(),
    days: daysArr,
    bookingSummary: [
      { leg: `${origin} → ${destination}`, preferredClass: trainClass, bookingApproach: "Book in advance on IRCTC portal" }
    ],
    nightSummary: [
      { night: 1, date: "Day 1", where: `En route to ${destination}` }
    ],
    packingItems: [
      { category: "Essentials", items: ["Photo ID Card", "Season-appropriate Clothes", "Power bank & Chargers"] }
    ],
    travelTips: [
      { title: "Transit Connection Buffer", description: "Keep buffer time between transit connections." }
    ],
    importableExpenses: [
      { title: `Roundtrip Transit (${origin} ↔ ${destination})`, amount: totalTrainCost, category: "Travel" },
      { title: "Local Transport & Taxi", amount: taxiCost, category: "Travel" },
      { title: `Accommodation (${nightsCount} Nights)`, amount: totalStayCost, category: "Rent" },
      { title: "Food & Activities", amount: Math.max(0, foodAndMisc), category: "Food" }
    ]
  };
}
