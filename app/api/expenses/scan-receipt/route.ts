import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_CATEGORIES = [
  "Food",
  "Rent",
  "Travel",
  "Utilities",
  "Shopping",
  "Entertainment",
  "Miscellaneous",
] as const;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image, currencyHint, userId } = body;

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isPro: true },
      });
      if (user && !user.isPro) {
        return NextResponse.json(
          { ok: false, error: "PRO_REQUIRED", message: "AI Receipt OCR is exclusively available to SplitRupee Pro members." },
          { status: 403 }
        );
      }
    }

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { ok: false, error: "MISSING_IMAGE", message: "Receipt image is required for AI scanning." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "AI_CONFIG_ERROR", message: "AI API key is not configured." },
        { status: 500 }
      );
    }

    // Parse data URL or raw base64
    let base64Data = image.trim();
    let mimeType = "image/jpeg";

    if (base64Data.startsWith("data:")) {
      const match = base64Data.match(/^data:([^;]+);base64,(.+)$/s);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }
    }

    // Clean any whitespace or newlines from base64
    base64Data = base64Data.replace(/\s/g, "");

    const genAI = new GoogleGenerativeAI(apiKey);
    const candidateModels = [
      "gemini-flash-lite-latest",
      "gemini-3.5-flash",
      "gemini-flash-latest",
      "gemini-2.5-flash",
    ];

    const prompt = `You are a high-precision bill & receipt OCR parser for SplitRupee, an expense sharing app used primarily in India and for international travel.
Analyze this receipt image with extreme accuracy.
Extract all bill details into a strict, valid JSON object matching this exact TypeScript interface:
{
  "merchant": string, // Vendor, restaurant, store, taxi, or airline name (e.g. "Gulati Restaurant", "Swiggy", "Decathlon")
  "totalAmount": number, // Final total payable amount as a float (e.g. 1450.50). Must be positive.
  "currency": string, // 3-letter currency code, e.g. "INR", "NPR", "THB", "AED", "USD", "EUR", etc. Default to "INR" unless currency symbol/country indicates otherwise. (Currency hint from user: "${currencyHint || 'INR'}")
  "date": string | null, // Date in "YYYY-MM-DD" format if visible on the bill, otherwise null.
  "category": "Food" | "Rent" | "Travel" | "Utilities" | "Shopping" | "Entertainment" | "Miscellaneous",
  "taxAmount": number | null, // GST, VAT, or service tax amount if listed
  "items": Array<{ "name": string, "price": number, "qty"?: number }>, // Individual itemized dishes or purchases if visible
  "notes": string // A clear, concise 1-sentence note summarizing the bill (e.g. "Dinner with 3 items at Gulati · GST included")
}

CRITICAL RULES:
1. Return ONLY valid JSON.
2. If total amount is not clearly printed, compute Subtotal + Taxes.
3. Clean all prices to standard numbers (e.g., "₹1,450.50" -> 1450.50).
4. If currency symbol ₹ or Rs is seen, currency is INR. If ฿, THB. If रू or NPR, NPR. If $, USD.
5. Choose the closest matching category from the allowed list.`;

    let parsedResult: any = null;
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        });

        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Data,
              mimeType,
            },
          },
        ]);

        const rawText = result.response.text().trim();
        if (rawText) {
          const parsed = JSON.parse(rawText);
          if (parsed && typeof parsed.totalAmount === "number" && !isNaN(parsed.totalAmount)) {
            parsedResult = parsed;
            break;
          }
        }
      } catch (err: any) {
        lastError = err;
        console.debug(`[AI Receipt Scan] Model ${modelName} failed, trying next fallback:`, err?.message || err);
      }
    }

    if (!parsedResult) {
      return NextResponse.json(
        {
          ok: false,
          error: "SCAN_FAILED",
          message:
            lastError?.message?.includes("503")
              ? "AI vision service is experiencing temporary peak load. Please retry or enter amount manually."
              : "Could not clearly detect bill details. Please ensure the receipt is well-lit and readable.",
        },
        { status: 422 }
      );
    }

    // Sanitize category
    let category = parsedResult.category;
    if (!VALID_CATEGORIES.includes(category)) {
      category = "Food";
    }

    // Sanitize currency
    let currency = (parsedResult.currency || "INR").trim().toUpperCase();

    // Sanitize total amount
    const totalAmount = Math.max(0, Math.round(Number(parsedResult.totalAmount) * 100) / 100);

    return NextResponse.json({
      ok: true,
      data: {
        merchant: parsedResult.merchant || "Receipt Bill",
        totalAmount,
        currency,
        date: parsedResult.date || null,
        category,
        taxAmount: parsedResult.taxAmount ? Number(parsedResult.taxAmount) : null,
        items: Array.isArray(parsedResult.items) ? parsedResult.items : [],
        notes: parsedResult.notes || `Scanned bill from ${parsedResult.merchant || "Receipt"}`,
      },
    });
  } catch (error: any) {
    console.error("[POST /api/expenses/scan-receipt] Error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "INTERNAL_ERROR",
        message: error.message || "An unexpected error occurred while scanning the receipt.",
      },
      { status: 500 }
    );
  }
}
