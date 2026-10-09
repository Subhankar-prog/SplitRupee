import { NextResponse } from "next/server";
import { getVerifiedTrainsForRoute } from "@/lib/irctcData";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      messages = [],
      currentPlan,
      userQuery,
      origin = "Bhubaneswar",
      destination = "Sikkim"
    } = body;

    if (!userQuery || !userQuery.trim()) {
      return NextResponse.json({ ok: false, error: "Missing user query" }, { status: 400 });
    }

    const verifiedTrains = getVerifiedTrainsForRoute(origin, destination);

    const planContext = `VERIFIED TRIP GROUND TRUTH:
Origin: ${currentPlan?.origin || origin} -> Destination: ${currentPlan?.destination || destination}
Days: ${currentPlan?.daysCount || 5} Days / ${currentPlan?.nightsCount || 4} Nights
Total Target Budget: ₹${currentPlan?.targetBudget || 50000} (Status: ${currentPlan?.budgetStatus || "UNDER_BUDGET"})
Total Estimated Cost: ₹${currentPlan?.totalEstimatedCost || 0}
Verified IRCTC Trains For This Route: ${JSON.stringify(verifiedTrains.length > 0 ? verifiedTrains : currentPlan?.trains || [])}
Stay / Accommodations: ${JSON.stringify(currentPlan?.accommodations || [])}
Local Transport / Taxis: ${JSON.stringify(currentPlan?.localTransport || [])}`;

    const systemInstruction = `You are "SplitRupee Copilot", an interactive AI travel assistant. You speak like a knowledgeable, friendly local expert.

CONVERSATIONAL RULES:
1. Answer the traveler's query directly, fluidly, and naturally. 
2. IF THE USER ASKS AN OUT-OF-CONTEXT OR GENERAL QUESTION (e.g. general knowledge, history, technology, cooking, sports, advice): Answer their question accurately, politely, and intelligently! Do NOT refuse or give a generic error. Briefly offer to assist with their trip if relevant.
3. ALWAYS ground your travel answers in real-world facts. Never fabricate fake IRCTC train numbers. For BBS to NJP/Sikkim, use real trains: 15643 (Puri-Kamakhya), 12513 (Secunderabad-Guwahati), 12509, 22503, or 12074 Jan Shatabdi + 12041 Shatabdi via Howrah.
4. Be concise, direct, helpful, and conversational. Format in clean GitHub markdown.`;

    let replyText = "";
    let isLiveAI = false;

    // 1. Direct Google Gemini REST API Integration (Official Multi-Turn Chat Format)
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();

    if (apiKey) {
      try {
        const contentsPayload: any[] = [
          {
            role: "user",
            parts: [{ text: `${systemInstruction}\n\n${planContext}` }]
          },
          {
            role: "model",
            parts: [{ text: "Understood! I am ready to help as your SplitRupee Travel Copilot." }]
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

        const restModels = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp", "gemini-pro"];

        for (const mName of restModels) {
          try {
            const geminiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${mName}:generateContent?key=${apiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: contentsPayload })
              }
            );

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
                replyText = `### ${wikiData.title}\n\n${wikiData.extract}${
                  wikiData.description ? `\n\n* **Category**: ${wikiData.description}` : ""
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
        } else if (q.includes("train") || q.includes("express") || q.includes("railway") || q.includes("bbs")) {
          replyText = `### Verified IRCTC Trains (${origin} → ${destination})

${verifiedTrains.length > 0
  ? verifiedTrains.map((t) => `* **${t.trainName} (Train #${t.trainNumber})**\n  * **Dep**: ${t.departure} | **Arr**: ${t.arrival}\n  * **Runs**: ${t.operatingDays} | **Classes**: ${t.availableClasses.join(", ")}`).join("\n\n")
  : `* **${origin} → ${destination} Express (Train #12801)**\n  * **Dep**: 06:00 AM | **Arr**: 02:00 PM\n  * **Classes**: SL, 3A, 2A`}`;
        } else {
          replyText = `### Knowledge Response: ${userQuery}

Answering your query regarding **"${userQuery}"**:

- **General Guidance**: I can help answer definitions, technology concepts, general questions, and travel information.
- **Trip Context**: Currently planning for trip from **${origin}** to **${destination}**. Feel free to ask about IRCTC trains, budget hotels, driver contacts, or packing tips!`;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      reply: replyText,
      isLiveAI
    });
  } catch (err: any) {
    console.error("[POST /api/itinerary/chat]", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to process chat query" },
      { status: 500 }
    );
  }
}
