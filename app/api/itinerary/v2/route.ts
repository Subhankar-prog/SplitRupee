import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getVerifiedGroundData, getVerifiedHotelForBudget, isDemoPhoneNumber } from "@/lib/localGroundData";
import { getVerifiedTrainsForRoute } from "@/lib/irctcData";

export const dynamic = "force-dynamic";

function sanitizePlan(plan: any, expectedNights: number, body: any, maxNightlyBudget: number): any {
  if (!plan || typeof plan !== "object") {
    return null;
  }

  const groundData = getVerifiedGroundData(body.destination) || getVerifiedGroundData(body.origin);
  const matchedBudgetHotel = getVerifiedHotelForBudget(body.destination, maxNightlyBudget);

  // Ensure equipments
  if (!Array.isArray(plan.equipments) || plan.equipments.length === 0) {
    plan.equipments = [
      "Comfortable Walking / Trekking Shoes",
      "Power Bank (10,000+ mAh)",
      "Universal Travel Adapter",
      "Weather-Appropriate Clothing",
      "Personal First-Aid & Medications",
      "Reusable Water Bottle",
      "Govt ID / Passport copies"
    ];
  }

  // Ensure tips
  if (!Array.isArray(plan.tips) || plan.tips.length === 0) {
    plan.tips = [
      "Carry valid photo identification and keep offline digital backups.",
      "Book major intercity trains/flights and prime attractions in advance.",
      "Utilize official prepaid taxi counters at stations/airports for regulated fares.",
      "Save emergency contacts for local tourism police and accommodation.",
      "Keep local cash on hand for street food vendors and entry tickets."
    ];
  }

  if (!Array.isArray(plan.days) || plan.days.length === 0) {
    return null;
  }

  // Sanitize each day
  const sanitizedDays = plan.days.map((day: any, idx: number) => {
    const dayNum = Number(day.day) || idx + 1;
    const isOvernight = day.stay && String(day.stay).toLowerCase().includes("overnight");
    const stay = day.stay || (isOvernight ? "Overnight Travel" : `${body.destination} Stay`);

    // Sanitize legs
    const legs = Array.isArray(day.legs)
      ? day.legs.map((leg: any, lIdx: number) => {
          let note = leg.note || "";
          // Strip any demo phone numbers from leg notes
          if (isDemoPhoneNumber(note)) {
            note = note.replace(/(\+?91[- ]?)?98765\d{5}/g, "")
                       .replace(/(\+?91[- ]?)?987654321\d/g, "")
                       .replace(/123456789\d/g, "")
                       .replace(/Contact:[^,.]*/gi, "")
                       .trim();
          }

          // If note is empty, give realistic verified guidance
          if (!note) {
            const verifiedTaxi = groundData?.taxiServices?.[lIdx % (groundData.taxiServices.length || 1)];
            if (verifiedTaxi?.phone) {
              note = `${verifiedTaxi.name}. Verified Helpline: ${verifiedTaxi.phone}`;
            } else if (verifiedTaxi) {
              note = `${verifiedTaxi.name}. ${verifiedTaxi.locationTip}`;
            } else {
              note = "Book via official airport/station prepaid taxi counter or verified app.";
            }
          }

          return {
            from: leg.from || (lIdx === 0 ? body.origin : body.destination),
            to: leg.to || body.destination,
            mode: leg.mode || "Local Transport",
            depart: leg.depart || (lIdx === 0 ? "08:00" : "14:00"),
            duration_hours: Number(leg.duration_hours) || 2,
            arrive: leg.arrive || (lIdx === 0 ? "10:00" : "16:00"),
            buffer_after_minutes: Number(leg.buffer_after_minutes ?? 60),
            note,
            cost: Number(leg.cost) || 500
          };
        })
      : [];

    // Sanitize activities
    const acts = day.activities || {};
    const activities = {
      morning: acts.morning || "Morning sightseeing and exploring scenic spots.",
      afternoon: acts.afternoon || "Afternoon local culture, shopping, or relaxing.",
      evening: acts.evening || "Evening promenade, sunset viewpoint, or dinner.",
      food: acts.food || "Enjoy regional local delicacies and specialties."
    };

    // Sanitize hotelDetails — strictly enforce budget accuracy & zero demo numbers!
    let hotelDetails = day.hotelDetails;
    if (!isOvernight && !hotelDetails) {
      if (matchedBudgetHotel) {
        hotelDetails = {
          name: matchedBudgetHotel.name,
          contact: matchedBudgetHotel.phone || null,
          costPerNight: matchedBudgetHotel.approxRatePerNight
        };
      } else {
        hotelDetails = {
          name: `Verified Budget Stay / Homestay in Central ${body.destination}`,
          contact: null,
          costPerNight: maxNightlyBudget
        };
      }
    } else if (hotelDetails) {
      let contact = hotelDetails.contact ? String(hotelDetails.contact).trim() : null;
      // If contact is a demo number, PURGE IT!
      if (isDemoPhoneNumber(contact)) {
        contact = matchedBudgetHotel?.phone || null;
      }

      let costPerNight = Number(hotelDetails.costPerNight) || maxNightlyBudget;

      // Anti-hallucination check: if staying budget is low (<= 2000), but hotel name is a luxury/resort brand
      const isLuxuryBrand = /taj|oberoi|marriott|hyatt|leela|hilton|radisson|elgin|mayfair|palace|resort|spa|luxury|grand\s+hotel|5-star|five\s*star|boutique/i.test(hotelDetails.name);
      if (maxNightlyBudget <= 2000 && isLuxuryBrand) {
        // Replace with genuine verified budget property or transparent homestay notice
        if (matchedBudgetHotel) {
          hotelDetails.name = matchedBudgetHotel.name;
          contact = matchedBudgetHotel.phone || null;
          costPerNight = matchedBudgetHotel.approxRatePerNight;
        } else {
          hotelDetails.name = `Verified Budget Homestay / Backpacker Hostel in Central ${body.destination}`;
          contact = null;
          costPerNight = Math.min(costPerNight, maxNightlyBudget);
        }
      }

      // If AI proposed an expensive hotel exceeding target stay budget by > 30%
      if (costPerNight > maxNightlyBudget * 1.3) {
        if (matchedBudgetHotel) {
          hotelDetails.name = matchedBudgetHotel.name;
          contact = matchedBudgetHotel.phone || null;
          costPerNight = matchedBudgetHotel.approxRatePerNight;
        } else {
          hotelDetails.name = `Verified Budget Homestay / Backpacker Hostel in Central ${body.destination}`;
          contact = null;
          costPerNight = maxNightlyBudget;
        }
      }
      
      hotelDetails = {
        name: hotelDetails.name || `${body.destination} Hotel`,
        contact: contact || null,
        costPerNight
      };
    }

    return {
      day: dayNum,
      stay,
      legs,
      activities,
      hotelDetails: isOvernight ? null : hotelDetails
    };
  });

  plan.days = sanitizedDays;
  return plan;
}

function generateDynamicFallback(body: any, maxNightlyBudget: number) {
  const numNights = Math.max(1, Number(body.nights) || 3);
  const totalBudget = Number(body.budget) || 25000;
  const origin = body.origin || "Origin";
  const destination = body.destination || "Destination";
  const group = body.groupType || "Travelers";
  const pref = body.transportPref || "Train / Road";

  const estMainTransport = Math.max(500, Math.round(totalBudget * 0.25));

  const groundData = getVerifiedGroundData(destination) || getVerifiedGroundData(origin);
  // Pick hotel that matches budget!
  const matchedHotel = getVerifiedHotelForBudget(destination, maxNightlyBudget);
  const fallbackHotelName = matchedHotel?.name || `Verified Budget Stay / Homestay Central ${destination}`;
  const fallbackHotelCost = matchedHotel?.approxRatePerNight || maxNightlyBudget;
  const fallbackHotelContact = matchedHotel?.phone || null;

  const verifiedTaxi1 = groundData?.taxiServices?.[0];
  const verifiedTaxi2 = groundData?.taxiServices?.[1] || verifiedTaxi1;

  const days: any[] = [];

  // Day 1: Origin -> Destination
  days.push({
    day: 1,
    stay: `${destination} Central`,
    legs: [
      {
        from: origin,
        to: `${destination} Terminal / Junction`,
        mode: pref.includes("Flight") ? "Flight (Economy)" : pref.includes("Train") ? `Train (${body.trainClass || "3A"})` : "Intercity AC Bus",
        depart: "08:00",
        duration_hours: 4.5,
        arrive: "12:30",
        buffer_after_minutes: 60,
        note: pref.includes("Train") ? "IRCTC National Railway Helpline: 139" : "Check airline schedule 24h prior.",
        cost: estMainTransport
      },
      {
        from: `${destination} Terminal`,
        to: fallbackHotelName,
        mode: "Official Prepaid Taxi",
        depart: "13:30",
        duration_hours: 0.5,
        arrive: "14:00",
        buffer_after_minutes: 30,
        note: verifiedTaxi1?.phone 
          ? `${verifiedTaxi1.name}: ${verifiedTaxi1.phone}`
          : (verifiedTaxi1?.locationTip || "Official Prepaid Taxi Booth at station exit."),
        cost: 400
      }
    ],
    activities: {
      morning: `Depart from ${origin} via selected transit.`,
      afternoon: `Arrive in ${destination}, check in at accommodation, freshen up and relax.`,
      evening: `Leisure walk around ${destination} city center or town square.`,
      food: `Authentic welcome meal at highly rated local cafe or diner.`
    },
    hotelDetails: {
      name: fallbackHotelName,
      contact: fallbackHotelContact,
      costPerNight: fallbackHotelCost
    }
  });

  // Intermediate Days: Exploring destination
  for (let i = 2; i <= numNights; i++) {
    const vTaxi = groundData?.taxiServices?.[(i - 1) % (groundData.taxiServices.length || 1)] || verifiedTaxi2;

    days.push({
      day: i,
      stay: `${destination} Central`,
      legs: [
        {
          from: "Hotel",
          to: `${destination} Key Landmark & Scenic Circuit`,
          mode: "Local Cab / Sightseeing Taxi",
          depart: "09:00",
          duration_hours: 0.75,
          arrive: "09:45",
          buffer_after_minutes: 30,
          note: vTaxi?.phone ? `${vTaxi.name}: ${vTaxi.phone}` : (vTaxi?.locationTip || "Regulated local taxi stand."),
          cost: 600
        }
      ],
      activities: {
        morning: `Morning excursion to iconic attractions, heritage spots, or nature viewpoints.`,
        afternoon: `Visit renowned cultural monuments, museums, and popular photo locations.`,
        evening: `Sunset views, local handicraft market shopping, and cafe hopping.`,
        food: `Traditional regional cuisine and street food specialties.`
      },
      hotelDetails: {
        name: fallbackHotelName,
        contact: fallbackHotelContact,
        costPerNight: fallbackHotelCost
      }
    });
  }

  // Final Departure Day
  days.push({
    day: numNights + 1,
    stay: "Home / Journey Back",
    legs: [
      {
        from: "Hotel Check-out",
        to: `${destination} Departure Station / Airport`,
        mode: "Local Cab",
        depart: "10:00",
        duration_hours: 0.5,
        arrive: "10:30",
        buffer_after_minutes: 60,
        note: verifiedTaxi1?.phone ? `${verifiedTaxi1.name}: ${verifiedTaxi1.phone}` : "Pre-book station transfer via hotel reception.",
        cost: 400
      },
      {
        from: `${destination} Station / Airport`,
        to: origin,
        mode: pref.includes("Flight") ? "Flight (Economy)" : pref.includes("Train") ? `Train (${body.trainClass || "3A"})` : "Intercity AC Bus",
        depart: "12:00",
        duration_hours: 4.5,
        arrive: "16:30",
        buffer_after_minutes: 60,
        note: `Return journey to ${origin}.`,
        cost: estMainTransport
      }
    ],
    activities: {
      morning: `Souvenir shopping and morning breakfast before hotel check-out.`,
      afternoon: `Board return connection back towards ${origin}.`,
      evening: `Arrive back at ${origin} with memorable memories!`,
      food: `Pantry or airport lunch on return journey.`
    },
    hotelDetails: null
  });

  const tips = [
    `Ideal for ${group} looking for a balanced pace in ${destination}.`,
    "Always utilize official prepaid taxi booths at stations/airports for regulated fares.",
    "Check operational hours of key sightseeing monuments to avoid peak queue times.",
    "Keep sufficient cash for local vendors where digital QR payments have network issues.",
    "Verify train/flight PNR status 24 hours prior to departure."
  ];

  if (groundData?.generalHelplines) {
    groundData.generalHelplines.forEach((h) => {
      tips.push(`Verified Helpline: ${h.name} — ${h.number}`);
    });
  }

  return {
    equipments: [
      "Comfortable Walking / Trekking Shoes",
      "Power Bank (10,000+ mAh) and charging cables",
      "Valid Government ID proof (Aadhaar / Passport / Voter ID)",
      "Layered clothing appropriate for destination climate",
      "Lightweight travel backpack & reusable water bottle",
      "Personal medicine kit with essentials & ORS"
    ],
    tips,
    days
  };
}

const DUMMY_WORDS = [
  "demo", "test", "testing", "sample", "example", "dummy", "fake", 
  "placeholder", "asdf", "qwerty", "temp", "trial", "xxx", "foo", "bar", 
  "none", "null", "undefined", "na", "n/a", "city", "origin", "destination",
  "somewhere", "anywhere", "abcd", "xyz"
];

function isInvalidOrDemoLocation(str: string): boolean {
  if (!str || typeof str !== "string") return true;
  const trimmed = str.trim();
  if (trimmed.length < 3) return true;
  const cleaned = trimmed.toLowerCase().replace(/[^a-z0-9\s]/g, "");
  if (cleaned.length < 3) return true;
  
  const tokens = cleaned.split(/\s+/);
  if (tokens.some((t) => DUMMY_WORDS.includes(t))) return true;
  if (/\b(demo|test|testing|dummy|fake|sample|placeholder|asdf)\b/i.test(cleaned)) return true;
  if (!/[a-z]{3,}/i.test(cleaned)) return true;
  return false;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const orig = (body.origin || "").trim();
    const dest = (body.destination || "").trim();

    if (!orig || !dest) {
      return NextResponse.json({ ok: false, error: "Please enter both origin and destination cities." }, { status: 400 });
    }

    if (isInvalidOrDemoLocation(orig)) {
      return NextResponse.json({ 
        ok: false, 
        error: `"${orig}" is not recognized as a valid city. Please enter a real departure city (e.g. Bhubaneswar, Mumbai, Delhi). Demo or test placeholder inputs are not permitted.` 
      }, { status: 400 });
    }

    if (isInvalidOrDemoLocation(dest)) {
      return NextResponse.json({ 
        ok: false, 
        error: `"${dest}" is not recognized as a valid city. Please enter a real destination city (e.g. Darjeeling, Goa, Manali). Demo or test placeholder inputs are not permitted.` 
      }, { status: 400 });
    }

    if (orig.toLowerCase() === dest.toLowerCase()) {
      return NextResponse.json({ 
        ok: false, 
        error: "Origin and destination cannot be the same city. Please provide different departure and arrival locations." 
      }, { status: 400 });
    }

    if (body.startDate && body.endDate) {
      const start = new Date(body.startDate);
      const end = new Date(body.endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
        return NextResponse.json({ 
          ok: false, 
          error: "Start date must be strictly before the return/end date." 
        }, { status: 400 });
      }
    }

    const {
      origin = orig,
      destination = dest,
      startDate = new Date().toISOString().split("T")[0],
      endDate = new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
      nights = 5,
      travellers = 2,
      groupType = "Friends",
      budget = 30000,
      trainClass = "3A",
      busClass = "AC Sleeper (Volvo)",
      flightClass = "Economy",
      transportPref = "Train, Bus, Road",
      stayPreference = "Budget Hostels / Guesthouses",
      interests = "Culture, scenery",
      specialNotes = ""
    } = body;

    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const groundData = getVerifiedGroundData(destination) || getVerifiedGroundData(origin);
    const verifiedTrains = getVerifiedTrainsForRoute(origin, destination);

    // Compute realistic max nightly stay budget (support explicit stayBudget or 40% of total budget spread across nights)
    const numBudget = Number(budget) || 30000;
    const numNights = Math.max(1, Number(nights) || 1);
    const targetNightlyStayBudget = body.stayBudget && Number(body.stayBudget) > 0
      ? Number(body.stayBudget)
      : Math.max(500, Math.floor((numBudget * 0.40) / numNights));

    let groundContextString = "";
    if (groundData) {
      const affordableHotels = groundData.hotels.filter(h => h.approxRatePerNight <= targetNightlyStayBudget * 1.3);

      let hotelSection = "";
      if (affordableHotels.length > 0) {
        hotelSection = `Verified Real Hotels Matching Nightly Budget (≤ ₹${targetNightlyStayBudget}/night):
${affordableHotels.map((h) => `- ${h.name}: approx ₹${h.approxRatePerNight}/night. Contact: ${h.phone || "Official front desk"} (${h.address || ""})`).join("\n")}`;
      } else {
        const lowestRate = Math.min(...groundData.hotels.map(h => h.approxRatePerNight));
        hotelSection = `Note on Nightly Budget & Hotels:
- No registered commercial hotels in ground database are under ₹${targetNightlyStayBudget}/night (lowest commercial property starts at ₹${lowestRate}/night).
- DO NOT provide wrong information or claim higher-priced hotels cost ₹${targetNightlyStayBudget}.
- Set hotel name to "Verified Budget Homestay / Backpacker Hostel in Central ${destination}", set costPerNight to ${targetNightlyStayBudget}, and set contact to null.`;
      }

      groundContextString = `VERIFIED REAL-WORLD GROUND CONTACTS FOR THIS DESTINATION:
${hotelSection}

Verified Local Taxi Stands & Unions:
${groundData.taxiServices.map((t) => `- ${t.name}: ${t.phone || "Physical prepaid booth at terminal"} (${t.locationTip})`).join("\n")}

General Tourist Helplines:
${groundData.generalHelplines.map((gh) => `- ${gh.name}: ${gh.number}`).join("\n")}
`;
    }

    const schemaStr = `{
  "equipments": ["string"],
  "tips": ["string"],
  "days": [
    {
      "day": 1,
      "stay": "string (name of place or 'Overnight Travel')",
      "legs": [
        {
          "from": "string",
          "to": "string",
          "mode": "string (e.g. 'Private Taxi', 'Shared Jeep', 'Train (3A)', 'Flight')",
          "depart": "HH:MM",
          "duration_hours": 2.5,
          "arrive": "HH:MM",
          "buffer_after_minutes": 120,
          "note": "string (verified taxi stand, official helpline, or real phone number if known)",
          "cost": 1500
        }
      ],
      "activities": {
        "morning": "string",
        "afternoon": "string",
        "evening": "string",
        "food": "string"
      },
      "hotelDetails": {
        "name": "string",
        "contact": "string or null (ONLY real verified phone number; if not known, MUST be null)",
        "costPerNight": number
      }
    }
  ]
}`;

    const prompt = `You are an elite, realistic travel planning engine.
Plan a complete round-trip itinerary from "${origin}" to "${destination}".
Trip Details:
- Duration: ${nights} nights (${startDate} to ${endDate})
- Travellers: ${travellers} (${groupType})
- Total Budget: ${budget} INR
- Target Accommodation Budget: Max ₹${targetNightlyStayBudget} INR/night
- Accommodation Preference: ${stayPreference}
- Preferred Transport: ${transportPref || "Best realistic transport"}
- Train Class: ${trainClass}, Bus Class: ${busClass}, Flight Class: ${flightClass}
- Interests: ${interests}
- Special Notes: ${specialNotes}

${groundContextString}
${verifiedTrains.length > 0 ? `VERIFIED IRCTC TRAIN ROUTE DATA:\n${JSON.stringify(verifiedTrains, null, 2)}` : ""}

CRITICAL STRICT RULES ON BUDGET ACCURACY & PHONE NUMBERS:
1. BUDGET ACCURACY FOR NIGHT STAYS:
   - The selected accommodation MUST genuinely fit within or near the target nightly budget of ₹${targetNightlyStayBudget}/night.
   - If target stay budget is under ₹1,500/night: Select authentic backpacker hostels (e.g. Zostel, goSTOPS, Hosteller dorm beds/private budget rooms), verified budget guesthouses, or homestays that truly cost under ₹1,500.
   - NEVER fabricate artificially low prices for luxury hotels (e.g., NEVER claim a 4-star or 5-star hotel costs ₹1,500).
2. ZERO DEMO PHONE NUMBERS:
   - NEVER provide dummy, demo, placeholder, or fake numbers (such as +91-9876543210, +91-987654321X, 1234567890, etc.).
   - ONLY provide a phone number if it is a real, authentic, verified telephone number of a real hotel or registered taxi union.
   - If not known with 100% certainty, "contact" MUST be null.
3. ALL COSTS MUST BE GROUP TOTALS FOR ALL ${travellers} TRAVELLERS (NOT PER-PERSON):
   - The total budget of ₹${budget} is the TOTAL budget for ALL ${travellers} travellers combined.
   - Every "cost" for transit/legs (e.g., trains, buses, flights, shared jeeps, private cabs) MUST be the TOTAL combined cost for ALL ${travellers} passengers. (For example, if 1 train ticket is ₹1,000 and there are ${travellers} travellers, leg cost must be ₹${1000 * Number(travellers)}, NOT ₹1,000. If a cab costs ₹2,500, that covers the entire group).
   - "costPerNight" in hotelDetails is the TOTAL nightly room cost for the entire group (${travellers} travellers), NOT divided or split per person.
4. Return ONLY valid JSON in the exact schema provided.

SCHEMA:
${schemaStr}`;

    let planData = null;
    let lastError = "";

    const candidateModels = ["gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gemini-3.8-flash"];

    for (const mName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: mName,
          generationConfig: {
            responseMimeType: "application/json"
          }
        });

        const result = await model.generateContent(prompt);
        const candidateText = result.response.text();

        if (candidateText) {
          const jsonMatch = candidateText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            const sanitized = sanitizePlan(parsed, Number(nights), body, targetNightlyStayBudget);
            if (sanitized && sanitized.days?.length > 0) {
              planData = sanitized;
              break;
            }
          }
        }
      } catch (err: any) {
        console.warn(`Model ${mName} attempt warning:`, err.message);
        lastError = err.message;
      }
    }

    if (!planData) {
      console.warn("Generating verified ground fallback plan due to:", lastError);
      planData = generateDynamicFallback(body, targetNightlyStayBudget);
      return NextResponse.json({
        ok: true,
        plan: planData,
        isDynamicFallback: true,
        targetNightlyStayBudget,
        note: "Generated using verified regional ground data"
      });
    }

    // Calculate budget totals
    let totalTransportCost = 0;
    let totalHotelCost = 0;
    planData.days.forEach((d: any) => {
      d.legs?.forEach((l: any) => {
        totalTransportCost += Number(l.cost) || 0;
      });
      if (d.hotelDetails?.costPerNight) {
        totalHotelCost += Number(d.hotelDetails.costPerNight) || 0;
      }
    });

    const totalEstimatedCost = totalTransportCost + totalHotelCost;
    const numTravellers = Math.max(1, Number(body.travellers) || 1);
    const costPerPerson = Math.round(totalEstimatedCost / numTravellers);

    return NextResponse.json({
      ok: true,
      plan: planData,
      targetNightlyStayBudget,
      financialSummary: {
        totalEstimatedCost,
        totalTransportCost,
        totalHotelCost,
        targetBudget: numBudget,
        targetNightlyStayBudget,
        numTravellers,
        costPerPerson,
        isGroupTotal: true,
        budgetDifference: numBudget - totalEstimatedCost,
        budgetStatus: totalEstimatedCost <= numBudget ? "UNDER_BUDGET" : "OVER_BUDGET"
      }
    });
  } catch (err: any) {
    console.error("[POST /api/itinerary/v2]", err);
    return NextResponse.json({ ok: false, error: err.message || "Failed to generate itinerary" }, { status: 500 });
  }
}
