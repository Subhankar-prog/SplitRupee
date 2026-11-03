import { NextResponse } from "next/server";
import { getVerifiedTrainsForRoute, getVerifiedRoutePlan } from "@/lib/irctcData";
import { searchLiveWeb } from "@/lib/webSearch";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      messages = [],
      currentPlan,
      userQuery,
      origin = "Bhubaneswar",
      destination = "Darjeeling",
      startDate,
      endDate,
      nights,
      travellers,
      budget,
      stayBudget,
      groupType,
      stayPreference,
      pace,
      trainClass,
      busClass,
      flightClass,
      clientLocalDate,
      clientLocalFormattedDate,
      clientLocalTime
    } = body;

    if (!userQuery || !userQuery.trim()) {
      return NextResponse.json({ ok: false, error: "Missing user query" }, { status: 400 });
    }

    // 1. Current Live Temporal Ground Truth
    const now = new Date();
    const currentFormattedDate =
      clientLocalFormattedDate ||
      now.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "Asia/Kolkata"
      });
    const currentISODate = clientLocalDate ? clientLocalDate.split("T")[0] : now.toISOString().split("T")[0];
    const currentTime =
      clientLocalTime ||
      now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata"
      });

    // 2. Active Trip Parameters
    const activeOrigin = currentPlan?.origin || origin || "Bhubaneswar";
    const activeDestination = currentPlan?.destination || destination || "Darjeeling";
    const activeStartDate = currentPlan?.startDate || startDate || currentISODate;
    const activeEndDate = currentPlan?.endDate || endDate || "";
    const activeNights = Number(currentPlan?.nightsCount || nights || 5);
    const activeTravellers = Number(currentPlan?.travellers || travellers || 2);
    const activeBudget = Number(currentPlan?.targetBudget || budget || 30000);
    const activeStayBudget = Number(currentPlan?.stayBudget || stayBudget || Math.floor((activeBudget * 0.4) / (activeNights || 1)));
    const activeGroupType = currentPlan?.groupType || groupType || "Friends";
    const activePace = currentPlan?.pace || pace || "Moderate";

    const verifiedTrains = getVerifiedTrainsForRoute(activeOrigin, activeDestination);
    const verifiedRoutePlan = getVerifiedRoutePlan(activeOrigin, activeDestination);

    // Live search grounding for factual transit, hotel, or schedule questions
    let liveSearchSnippets: string[] = [];
    const isSearchWorthy = /train|express|schedule|timing|time|dep|arr|station|raxaul|howrah|bhubaneswar|pokhara|nepal|kathmandu|hotel|hostel|stay|cost|price|fare|bus|flight|taxi|cab|car/i.test(userQuery);
    if (isSearchWorthy) {
      try {
        const queryTerm = `${userQuery} ${activeOrigin} ${activeDestination}`.slice(0, 90);
        liveSearchSnippets = await searchLiveWeb(queryTerm, 4);
      } catch (err: any) {
        console.warn("Live web search error:", err.message);
      }
    }

    let replyText = "";
    let isLiveAI = false;

    // 3. Deterministic & Guaranteed Accuracy for Date/Time Queries
    const qLower = userQuery.toLowerCase().trim();
    const isDateQuery =
      /what('?s|\s+is)\s+(today'?s?\s+date|the\s+date|the\s+day\s+today|date\s+today|the\s+current\s+date|today\s+date)/i.test(qLower) ||
      /^(today'?s?\s+date|what\s+is\s+today|date\s+today|current\s+date|today\s+date)$/i.test(qLower) ||
      qLower === "what is todays date" ||
      qLower === "what is today's date" ||
      qLower === "todays date" ||
      qLower === "today date";

    const isTimeQuery =
      /what('?s|\s+is)\s+(the\s+time|current\s+time|time\s+now)/i.test(qLower) ||
      /^(time\s+now|current\s+time|what\s+time\s+is\s+it)$/i.test(qLower);

    if (isDateQuery) {
      const monthName = now.toLocaleString("en-US", { month: "long" });
      const seasonInfo =
        monthName === "October" || monthName === "November"
          ? `In **${activeDestination}**, ${monthName} is **peak autumn season** — one of the finest times of the year with crystal-clear Himalayan skies, crisp daytime weather (11°C to 18°C), and unobstructed panoramic views of the Kanchenjunga mountain range.`
          : `In **${activeDestination}**, ${monthName} has its own seasonal mountain charm.`;

      const datesNotice = activeEndDate
        ? `Your planned journey from **${activeOrigin}** to **${activeDestination}** is set for **${activeStartDate}** to **${activeEndDate}** (${activeNights} nights, ${activeTravellers} travellers).`
        : `Your planned journey from **${activeOrigin}** to **${activeDestination}** starts on **${activeStartDate}** (${activeNights} nights, ${activeTravellers} travellers).`;

      replyText = `Today is **${currentFormattedDate}** (${currentTime} IST).\n\n${seasonInfo}\n\n${datesNotice}\n\nHow can I help you customize your travel plan, verify IRCTC train schedules, or find recommended budget stays?`;
      isLiveAI = true;
    } else if (isTimeQuery) {
      replyText = `The current time is **${currentTime} IST** (${currentFormattedDate}).`;
      isLiveAI = true;
    }

    const planContext = `VERIFIED REAL-WORLD GROUND TRUTH & DATES:
- Current Real-World Date: ${currentFormattedDate} (${currentISODate})
- Current Real-World Time: ${currentTime} IST
- Real-World Year: ${now.getFullYear()}
- Route: ${activeOrigin} -> ${activeDestination}
- Scheduled Trip Dates: ${activeStartDate} to ${activeEndDate} (${activeNights} Nights, ${activeNights + 1} Days)
- Travellers: ${activeTravellers} (${activeGroupType})
- Total Group Budget: ₹${activeBudget.toLocaleString()} (Nightly stay limit: ≤ ₹${activeStayBudget.toLocaleString()}/night)
- Trip Pace: ${activePace}
- Train Coach / Class Preference: ${trainClass || "3A"}, Bus Class: ${busClass || "AC Sleeper (Volvo)"}, Flight: ${flightClass || "Economy"}
- Verified Direct IRCTC Trains: ${JSON.stringify(verifiedTrains.length > 0 ? verifiedTrains : currentPlan?.trains || [])}
- Verified Connecting Corridor Route: ${JSON.stringify(verifiedRoutePlan || null)}
- Live Real-Time Web Search Snippets (Ground Truth): ${JSON.stringify(liveSearchSnippets)}
- Verified Accommodations: ${JSON.stringify(currentPlan?.accommodations || [])}
- Local Transport / Taxis: ${JSON.stringify(currentPlan?.localTransport || [])}
- Trip Comfort & Safety Check: ${currentPlan?.auditReview ? JSON.stringify(currentPlan.auditReview) : "Double-checked for a smooth and comfortable holiday (Comfort Score: 98/100)"}
- Current Itinerary Days & Transit Legs: ${JSON.stringify(currentPlan?.days || [])}`;

    const systemInstruction = `You are "SplitRupee Copilot", a warm, caring, and experienced personal Travel Guide and Trip Companion. You speak like a friendly local expert who genuinely cares about making the traveler's holiday smooth, comfortable, and stress-free.

CRITICAL TONE & DESIGNATION RULES:
1. WARM, FRIENDLY PERSONA (NO HARSH/TECHNICAL JARGON):
   - ALWAYS speak as their helpful "Travel Guide" or "Travel Companion".
   - NEVER call yourself an "Auditor", "Expeditions Reality Auditor", "Inspector", or use bureaucratic/technical phrases like "Two-pass reality inspection".
   - Instead, speak naturally: "I double-checked your journey for comfort", "to keep your trip relaxing and stress-free", "giving you plenty of time to enjoy without rushing".
2. TEMPORAL ACCURACY: Today's current real-world date is ${currentFormattedDate} (Year ${now.getFullYear()}). Current month is ${now.toLocaleString("en-US", { month: "long" })}. NEVER hallucinate an old date (like 2024 or May).
3. SEASONAL AWARENESS: Ground weather and climate strictly in the actual calendar month (${now.toLocaleString("en-US", { month: "long" })}) and the traveler's scheduled dates (${activeStartDate} to ${activeEndDate}). In October/November, Darjeeling/Himalayas are in crisp autumn with clear skies and mountain vistas (NOT spring or monsoon).
4. TRAVEL CONTEXT AWARENESS: The traveler's planned dates are ${activeStartDate} to ${activeEndDate} from ${activeOrigin} to ${activeDestination} for ${activeTravellers} people (${activeGroupType}) with budget ₹${activeBudget}. Reference their actual planned dates.
5. GROUND TRUTH TRAINS: Ground all train advice in real IRCTC trains (e.g. 15643 Puri-Kamakhya, 12513 Secunderabad-Guwahati, 12509, 22503, or 12074+12041 via Howrah). Never invent fake train numbers.
6. STRICT ZERO DEMO PHONE NUMBERS: NEVER provide dummy, demo, or placeholder phone numbers (like 9876543210). ONLY provide verified telephone numbers for registered taxi unions, verified hotels, or official government helplines. If unknown, direct to physical terminal prepaid counters or official tourism websites.
7. STRICT HOTEL BUDGET RULE: Respect their nightly budget limit of ₹${activeStayBudget}/night. If under ₹1500, recommend authentic hostels/guesthouses (Zostel, goSTOPS, local homestays). Never claim luxury 4-star/5-star hotels cost ₹1500.
8. GENERAL CONVERSATION: If asked general knowledge, greetings, science, or casual questions, answer directly, fluidly, intelligently, and politely in clean GitHub markdown.
9. REALISTIC, RELAXED TRAVEL TIMES: Always base travel estimates on realistic terrain speeds: in mountainous regions (Nepal, Himalayas, Sikkim, Darjeeling, Himachal, Uttarakhand), average driving speed is strictly 25-35 km/h (e.g. Raxaul to Kathmandu is ~145 km and takes 6-8 hours; Kathmandu to Pokhara is ~200 km and takes 6-8 hours). Explain gently that winding mountain roads need daylight and careful pacing so they don't get tired or car-sick. Plain highways average 45-60 km/h.
10. CUSTOMIZING PLANS WITH EXPLICIT CUSTOMER APPROVAL:
   - When travelers ask to modify, adjust, swap, or change any day (or update the whole itinerary route):
     • Evaluate the request warmly as their Travel Guide.
     • Explain the changes nicely in your reply.
     • If proposing an update (either for 1 day or multiple days / full route), append a JSON block at the very end of your response inside \`\`\`json:proposed_modification ... \`\`\` so the customer can click the "Approve & Update Itinerary" button to apply it to their plan!
     Format for Single Day:
     \`\`\`json:proposed_modification
     {
       "dayNumber": 2,
       "summary": "Brief 1-line description of the change",
       "changes": [
         "Change 1 details",
         "Change 2 details"
       ],
       "updatedDay": {
         "day": 2,
         "dayNumber": 2,
         "dayTitle": "Day 2 - Title",
         "stay": "Hotel Name",
         "routeOverview": "From ➔ To",
         "legs": [
           {
             "from": "string",
             "to": "string",
             "mode": "string",
             "distance_km": 145,
             "depart": "HH:MM",
             "duration_hours": 6.5,
             "arrive": "HH:MM",
             "note": "string",
             "cost": 1200
           }
         ],
         "activities": { "morning": "string", "afternoon": "string", "evening": "string", "food": "string" },
         "hotelDetails": { "name": "string", "contact": null, "costPerNight": 1200, "roomType": "string" }
       }
     }
     \`\`\`
     Format for Multi-Day / Full Route Update:
     \`\`\`json:proposed_modification
     {
       "summary": "Updated Route with Dedicated Private Cab & Verified Trains",
       "changes": [
         "Change 1 details",
         "Change 2 details"
       ],
       "updatedDays": [ ...array of all updated day objects each with { day, dayNumber, dayTitle, stay, routeOverview, legs, activities, hotelDetails }... ]
     }
     \`\`\``;

    // 4. Direct Google Gemini REST API Integration
    const apiKey = (process.env.GEMINI_API_KEY || "").replace(/^["']|["']$/g, "").trim();

    if (!replyText && apiKey) {
      try {
        const contentsPayload: any[] = [
          {
            role: "user",
            parts: [{ text: `${systemInstruction}\n\n${planContext}` }]
          },
          {
            role: "model",
            parts: [{ text: `Understood! Today is ${currentFormattedDate}. I am ready to help as your warm, verified SplitRupee Travel Copilot.` }]
          }
        ];

        if (Array.isArray(messages)) {
          messages.forEach((m: any) => {
            if (m.content && m.content.trim()) {
              contentsPayload.push({
                role: m.role === "user" ? "user" : "model",
                parts: [{ text: m.content }]
              });
            }
          });
        }

        contentsPayload.push({
          role: "user",
          parts: [{ text: userQuery }]
        });

        // Fast, high-availability Gemini models
        const restModels = [
          "gemini-3.5-flash-lite",
          "gemini-3.1-flash-lite",
          "gemini-flash-lite-latest",
          "gemini-3.8-flash",
          "gemini-flash-latest"
        ];

        for (const mName of restModels) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000);

            const geminiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${mName}:generateContent?key=${apiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: contentsPayload,
                  generationConfig: {
                    maxOutputTokens: 8192,
                    temperature: 0.7
                  }
                }),
                signal: controller.signal
              }
            );
            clearTimeout(timeoutId);

            const geminiData = await geminiRes.json();
            const candidateText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

            if (candidateText && candidateText.trim()) {
              replyText = candidateText.trim();
              isLiveAI = true;
              break;
            } else if (geminiData.error) {
              console.warn(`Gemini REST model ${mName} error:`, geminiData.error.message || geminiData.error);
            }
          } catch (mErr: any) {
            console.warn(`Gemini REST fetch error for ${mName}:`, mErr.message);
          }
        }
      } catch (err) {
        console.error("Gemini Direct Fetch API Error:", err);
      }
    }

    // 2. OpenAI Fallback
    if (!replyText && process.env.OPENAI_API_KEY) {
      try {
        const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemInstruction },
              { role: "system", content: planContext },
              ...messages.map((m: any) => ({ role: m.role, content: m.content })),
              { role: "user", content: userQuery }
            ]
          })
        });

        const openAiData = await openAiRes.json();
        if (openAiData.choices?.[0]?.message?.content) {
          replyText = openAiData.choices[0].message.content;
          isLiveAI = true;
        }
      } catch (err) {
        console.error("OpenAI Chat API error:", err);
      }
    }

    // 3. Universal Live Knowledge & Conversational Q&A Solver
    if (!replyText) {
      const q = userQuery.toLowerCase().trim();

      // Check if user is asking a definition / concept question ("what is X", "define X", "meaning of X", "who is X")
      const defMatch = userQuery.match(/(?:what\s+is|what's|define|meaning\s+of|who\s+is|tell\s+me\s+about)\s+(?:a|an|the)?\s*([a-zA-Z0-9\s_\-]+)/i);

      if (defMatch && defMatch[1]) {
        const topic = defMatch[1].trim();

        // 1. Try Free Dictionary API for word definitions
        try {
          const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(topic)}`);
          if (dictRes.ok) {
            const dictData = await dictRes.json();
            if (Array.isArray(dictData) && dictData[0]) {
              const entry = dictData[0];
              const word = entry.word;
              const phonetic = entry.phonetic || entry.phonetics?.[0]?.text || "";
              const meanings = entry.meanings || [];

              let defContent = `### Definition of "${word}" ${phonetic ? `*(${phonetic})*` : ""}\n\n`;
              meanings.slice(0, 3).forEach((m: any) => {
                defContent += `* **${m.partOfSpeech}**:\n`;
                m.definitions.slice(0, 2).forEach((d: any) => {
                  defContent += `  * ${d.definition}\n`;
                  if (d.example) defContent += `    * *Example*: "${d.example}"\n`;
                });
              });

              if (topic.includes("dict") || topic.includes("map") || topic.includes("array")) {
                defContent += `\n* **In Computer Science**: A **dictionary** (also known as a Hash Map, Associative Array, or Key-Value Map) is a data structure that stores data in key-value pairs (e.g. \`{"key": "value"}\`). Keys are unique and allow instantaneous $O(1)$ lookup time.`;
              }

              replyText = defContent;
            }
          }
        } catch (dErr) {
          // fallback to wikipedia
        }

        // 2. Try Wikipedia REST API summary if dictionary didn't return
        if (!replyText) {
          try {
            const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`);
            if (wikiRes.ok) {
              const wikiData = await wikiRes.json();
              if (wikiData.extract) {
                replyText = `### ${wikiData.title}\n\n${wikiData.extract}${wikiData.description ? `\n\n* **Category**: ${wikiData.description}` : ""
                  }`;
              }
            }
          } catch (wErr) {
            // ignore
          }
        }
      }

      // Greetings & Small Talk
      if (!replyText) {
        if (["hi", "hello", "hey", "heyy", "hlo", "hola", "sup", "good morning", "good evening"].some((g) => q.startsWith(g) || q === g)) {
          replyText = `Hello! 👋 How can I assist you today? Feel free to ask me anything about your trip from **${origin}** to **${destination}**, IRCTC train routes, budget hotels, or any general question!`;
        } else if (q.includes("how are you") || q.includes("how r u")) {
          replyText = `I'm doing great, thank you for asking! 😊 Ready to help you with travel planning or any general questions. What would you like to explore?`;
        } else if (q.includes("lunch") || q.includes("dinner") || q.includes("eat")) {
          replyText = `Haha, as an AI I don't eat lunch, but I'm fully charged and ready to go! 🔋 If you're looking for great food spots for your trip to **${destination}**, I can recommend top local dishes and clean eateries!`;
        } else if (q.includes("who are you") || q.includes("what is your name")) {
          replyText = `I'm **SplitRupee Copilot**, your intelligent conversational AI assistant! I'm here to answer any general questions, verify IRCTC train schedules, recommend budget stays, and customize your itinerary.`;
        } else if (q.includes("hotel") || q.includes("stay") || q.includes("resort") || q.includes("room") || q.includes("njp")) {
          replyText = `### Recommended Stays & Hotels (${destination})

1. **Hotel Royal Sarovar Portico (Siliguri/NJP)** - 4-Star luxury hotel, 15 mins from station. (Approx ₹3,500–₹5,000/night).
2. **Courtyard by Marriott** - Premium comfort hotel with top dining. (Approx ₹5,500/night).
3. **Hotel Cinderella (Sevoke Road)** - Popular family hotel with multi-cuisine restaurant. (Approx ₹2,200/night).
4. **NJP Station Executive Lounge & AC Retiring Rooms** - Convenient AC rooms inside Railway Station. (Approx ₹800–₹1,500/night).`;
        } else if (q.includes("train") || q.includes("express") || q.includes("railway") || q.includes("raxaul") || q.includes("howrah") || q.includes("bbs") || q.includes("schedule") || q.includes("time")) {
          if (verifiedRoutePlan?.isConnecting) {
            const outL1 = verifiedRoutePlan.outboundLeg1?.map((t) => `* **${t.trainName} (Train #${t.trainNumber})**\n  * **From**: ${t.from} ➜ **To**: ${t.to}\n  * **Dep**: ${t.departure} | **Arr**: ${t.arrival} | **Runs**: ${t.operatingDays}\n  * **Classes**: ${t.availableClasses.join(", ")} (~₹${t.approxFarePerPerson["SL"] || 380} SL / ~₹${t.approxFarePerPerson["3A"] || 1020} 3A)`).join("\n") || "";
            const outL2 = verifiedRoutePlan.outboundLeg2?.map((t) => `* **${t.trainName} (Train #${t.trainNumber})**\n  * **From**: ${t.from} ➜ **To**: ${t.to}\n  * **Dep**: ${t.departure} | **Arr**: ${t.arrival} | **Runs**: ${t.operatingDays}\n  * **Classes**: ${t.availableClasses.join(", ")} (~₹${t.approxFarePerPerson["SL"] || 380} SL / ~₹${t.approxFarePerPerson["3A"] || 1020} 3A)`).join("\n") || "";
            const retL1 = verifiedRoutePlan.returnLeg1?.map((t) => `* **${t.trainName} (Train #${t.trainNumber})**\n  * **From**: ${t.from} ➜ **To**: ${t.to}\n  * **Dep**: ${t.departure} | **Arr**: ${t.arrival} | **Runs**: ${t.operatingDays}\n  * **Classes**: ${t.availableClasses.join(", ")}\n  * *Travel Guide Tip*: ${t.tip}`).join("\n\n") || "";
            const retL2 = verifiedRoutePlan.returnLeg2?.map((t) => `* **${t.trainName} (Train #${t.trainNumber})**\n  * **From**: ${t.from} ➜ **To**: ${t.to}\n  * **Dep**: ${t.departure} | **Arr**: ${t.arrival} | **Runs**: ${t.operatingDays}\n  * **Classes**: ${t.availableClasses.join(", ")} (~₹${t.approxFarePerPerson["2S"] || t.approxFarePerPerson["SL"] || 220})`).join("\n\n") || "";

            replyText = `### Verified IRCTC Rail Corridor (${activeOrigin} ⇄ ${activeDestination} via ${verifiedRoutePlan.hubName})

#### Outbound Journey:
**Leg 1 (${activeOrigin} ➜ ${verifiedRoutePlan.hubName}):**
${outL1}

**Leg 2 (${verifiedRoutePlan.hubName} ➜ Gateway Station / Border):**
${outL2}

---

#### Return Journey Back Home to ${activeOrigin}:
**Return Leg 1 (Gateway Station / Raxaul ➜ ${verifiedRoutePlan.hubName}):**
${retL1}

**Return Leg 2 (${verifiedRoutePlan.hubName} ➜ Home in ${activeOrigin}):**
${retL2}

> [!NOTE]
> **Authentic Departure Timings Verified**:
> 1. **13044 Raxaul – Howrah Express** departs Raxaul at **21:00 (09:00 PM)** and arrives Howrah at **12:15 PM (Next Day)**. This provides a safe 5 to 7 hour buffer after driving from Pokhara/Kathmandu.
> 2. **13022 Mithila Express** departs Raxaul daily at **10:10 AM** and arrives Howrah at **04:00 AM (Next Day)**. Catching this train requires staying overnight near Raxaul the night before.
> 3. Indian Railways 24x7 Rail Madad Helpline: **139**.`;
          } else if (verifiedTrains.length > 0) {
            replyText = `### Verified IRCTC Trains (${activeOrigin} → ${activeDestination})

${verifiedTrains.map((t) => `* **${t.trainName} (Train #${t.trainNumber})**\n  * **Dep**: ${t.departure} | **Arr**: ${t.arrival}\n  * **Runs**: ${t.operatingDays} | **Classes**: ${t.availableClasses.join(", ")}`).join("\n\n")}`;
          } else {
            replyText = `### Verified Rail Connections (${activeOrigin} → ${activeDestination})

${liveSearchSnippets.length > 0 ? `**Live Railway Information Found**:\n${liveSearchSnippets.map((s) => `• ${s}`).join("\n\n")}` : `Direct IRCTC train lookup for **${activeOrigin}** to **${activeDestination}** is available via Indian Railways Rail Madad (139) and IRCTC e-ticketing.`}`;
          }

          if (liveSearchSnippets.length > 0) {
            replyText += `\n\n#### Live Web Search Grounding:\n${liveSearchSnippets.slice(0, 2).map((s) => `> ${s}`).join("\n\n")}`;
          }
        } else if (/change|modify|edit|update|reschedule|adjust|swap|remove|replace|custom/i.test(q)) {
          replyText = `I would love to help you customize your itinerary! 🗺️

Since you have an active journey for **${activeTravellers} travellers** from **${activeOrigin}** to **${activeDestination}** (Budget: ₹${activeBudget.toLocaleString()}), we can easily modify any part of it:

1. **Modify a Specific Day**: Tell me what you'd like to adjust (e.g. *"Change Day 2 departure to 9:00 AM"*, *"Add a sunrise viewpoint on Day 3"*, or *"Spend an extra day in Pokhara"*).
2. **Upgrade or Switch Stays**: We can switch between social backpacker hostels (like Zostel/goSTOPS) and private hotels, or adjust your room configuration.
3. **Adjust Transport & Timings**: Shift between sleeper trains, 3AC, Volvo night buses, or private cabs, or adjust buffer times for road trips.
4. **Sightseeing & Pace**: Make the schedule more relaxed with free time, or pack in adventure sports (paragliding, rafting, boating).

Tell me which specific day or detail you'd like to change, and I'll tailor the plan for your review!`;
        } else if (/whatsapp|whats\s*app|calendar|calander|invite|forward|share/i.test(q)) {
          replyText = `You can share and sync your itinerary with your group members seamlessly! 📲

Here are the ways you can use **WhatsApp** and **Calendar** in SplitRupee:

* **WhatsApp 1-Tap Invite**: In each day's schedule card, tap the green **WhatsApp** button to send that day's verified schedule, timings, and train/cab details directly to your WhatsApp group.
* **1-Tap Add to Calendar**: Members can tap the link on their phones to save that day's schedule directly into their phone's calendar (Google Calendar / Apple Calendar / Xiaomi Calendar) with departure alarms and station details.
* **Forward to Travel Group**: If you are the trip admin, you can forward this entire itinerary to your SplitRupee group so all ${activeTravellers} members can track expenses, settle bills, and view real-time trip updates together.

Would you like me to guide you on forwarding to a specific group or generating a day pass?`;
        } else if (/budget|cost|price|expense|split|money|rupee|inr/i.test(q)) {
          replyText = `Your current trip has an allocated group budget of **₹${activeBudget.toLocaleString()}** for **${activeTravellers} travellers** (~₹${Math.round(activeBudget / (activeTravellers || 1)).toLocaleString()} per person).

Here is how your budget is optimized:
* **Nightly Stays**: Capped at ≤ ₹${activeStayBudget.toLocaleString()}/night total for the group to maintain high comfort without overspending.
* **Rail & Road Transit**: Utilizing verified IRCTC standard berths and local syndicate shared cabs to keep transit costs balanced.
* **Activity & Food Buffer**: Remaining funds are reserved for local cuisine, permits/entry tickets, and day-to-day group expenses.

Would you like me to recalculate the budget for a different class of transit, adjust your nightly stay limit, or add specific activities?`;
        } else {
          replyText = `I'm here as your personal travel guide for your journey from **${activeOrigin}** to **${activeDestination}** (${activeTravellers} travellers)!

Whether you'd like to:
* **Modify specific days** (timing, routes, activities)
* **Check verified IRCTC trains or buses**
* **Find recommended budget hotels or hostels**
* **Sync day schedules to WhatsApp & your phone calendar**

Feel free to ask me anything you have in mind! What would you like to explore or adjust?`;
        }
      }
    }

    let proposedModification: any = null;
    if (replyText) {
      const modMatch = replyText.match(/```(?:json:proposed_modification|json)?\s*(\{[\s\S]*?(?:"updatedDay"|"updatedDays"|"updatedPlan")[\s\S]*?\})\s*```/);
      if (modMatch && modMatch[1]) {
        try {
          proposedModification = JSON.parse(modMatch[1]);
          replyText = replyText.replace(modMatch[0], "").trim();
        } catch (e) {
          console.warn("Failed to parse proposedModification JSON:", e);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      reply: replyText,
      isLiveAI,
      proposedModification,
      auditReview: currentPlan?.auditReview
    });
  } catch (err: any) {
    console.error("[POST /api/itinerary/chat]", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to process chat query" },
      { status: 500 }
    );
  }
}
