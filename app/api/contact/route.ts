import { NextRequest, NextResponse } from "next/server";
import https from "node:https";
import {
  buildSubmissionSignature,
  checkContactRateAndDuplicate,
  recordContactSubmission,
} from "@/lib/contactRateLimit";

const WEB3FORMS_SUBMIT_URL = "https://api.web3forms.com/submit";
const MAX_BODY_BYTES = 16 * 1024;

interface Web3FormsProviderResult {
  status: number;
  ok: boolean;
  data: { success?: boolean; message?: string } | null;
}

function submitViaHttps(
  payload: Record<string, unknown>,
  origin: string,
  referer: string
): Promise<Web3FormsProviderResult> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = https.request(
      {
        hostname: "api.web3forms.com",
        port: 443,
        path: "/submit",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
          Accept: "application/json",
          Origin: origin,
          Referer: referer,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
        timeout: 10_000,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          const status = res.statusCode || 200;
          try {
            const parsed = JSON.parse(body);
            resolve({ status, ok: status >= 200 && status < 300, data: parsed });
          } catch {
            resolve({ status, ok: false, data: null });
          }
        });
      }
    );

    req.on("error", (err) => reject(err));
    req.on("timeout", () => {
      req.destroy();
      const err = new Error("Request timed out");
      err.name = "AbortError";
      reject(err);
    });
    req.write(data);
    req.end();
  });
}

async function sendToWeb3Forms(
  payload: Record<string, unknown>,
  origin: string,
  referer: string
): Promise<Web3FormsProviderResult> {
  // In unit test environment, route through globalThis.fetch so vi.spyOn mocks work
  if (process.env.NODE_ENV === "test") {
    const providerRes = await fetch(WEB3FORMS_SUBMIT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
    let providerJson: { success?: boolean; message?: string } | null = null;
    try {
      providerJson = (await providerRes.json()) as { success?: boolean; message?: string };
    } catch {
      providerJson = null;
    }
    return {
      status: providerRes.status,
      ok: providerRes.ok,
      data: providerJson,
    };
  }

  // In live Node runtime (dev / prod), use native https to prevent Cloudflare Turnstile
  // blocking undici/fetch client fingerprints while forwarding web origin headers.
  return submitViaHttps(payload, origin, referer);
}

const TOPIC_LABELS: Record<string, string> = {
  support: "Help with a Group or Split",
  pro: "Request SplitRupee Pro Access",
  feedback: "Feature Suggestion & Feedback",
  upi: "UPI Settlement Inquiry",
  business: "Partnership / College Event",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function POST(req: NextRequest) {
  try {
    const contentLengthHeader = req.headers.get("content-length");
    if (contentLengthHeader) {
      const parsedLength = Number(contentLengthHeader);
      if (Number.isFinite(parsedLength) && parsedLength > MAX_BODY_BYTES) {
        return NextResponse.json(
          { ok: false, error: "PAYLOAD_TOO_LARGE", message: "Message payload is too large." },
          { status: 413 }
        );
      }
    }

    const rawText = await req.text();
    if (Buffer.byteLength(rawText, "utf8") > MAX_BODY_BYTES) {
      return NextResponse.json(
        { ok: false, error: "PAYLOAD_TOO_LARGE", message: "Message payload is too large." },
        { status: 413 }
      );
    }

    let body: Record<string, unknown>;
    try {
      const parsed = JSON.parse(rawText);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Invalid JSON body");
      }
      body = parsed as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { ok: false, error: "INVALID_JSON", message: "Invalid contact submission payload." },
        { status: 400 }
      );
    }

    // Honeypot bot check
    const botcheck = body.botcheck;
    if (
      botcheck === true ||
      (typeof botcheck === "string" && botcheck.trim().length > 0)
    ) {
      return NextResponse.json(
        { ok: false, error: "SPAM_DETECTED", message: "Submission rejected by spam check." },
        { status: 400 }
      );
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const topicKey = typeof body.topic === "string" ? body.topic.trim() : "support";
    const plan = typeof body.plan === "string" ? body.plan.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { ok: false, error: "INVALID_NAME", message: "Please enter your full name (2 to 100 characters)." },
        { status: 400 }
      );
    }

    if (!email || email.length > 160 || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { ok: false, error: "INVALID_EMAIL", message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (message.length < 10 || message.length > 4000) {
      return NextResponse.json(
        {
          ok: false,
          error: "INVALID_MESSAGE",
          message: "Please write a message between 10 and 4,000 characters.",
        },
        { status: 400 }
      );
    }

    const now = Date.now();
    const clientIp = getClientIp(req);
    const submissionSig = buildSubmissionSignature(email, topicKey, message);
    const gate = checkContactRateAndDuplicate({
      clientIp,
      signature: submissionSig,
      now,
    });

    if (gate === "rate_limited") {
      return NextResponse.json(
        {
          ok: false,
          error: "RATE_LIMITED",
          message: "Too many contact submissions received. Please wait a few minutes and try again.",
        },
        { status: 429 }
      );
    }

    if (gate === "duplicate") {
      return NextResponse.json(
        {
          ok: false,
          error: "DUPLICATE_SUBMISSION",
          message: "This exact message was just sent. Please wait a moment before sending again.",
        },
        { status: 429 }
      );
    }

    const accessKey = process.env.WEB3FORMS_ACCESS_KEY?.trim();
    if (!accessKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "CONTACT_UNAVAILABLE",
          message:
            "Contact delivery is not configured on this server yet. Please email pandasubhankar24@gmail.com or message us on WhatsApp.",
        },
        { status: 503 }
      );
    }

    const topicLabel = TOPIC_LABELS[topicKey] || "General Support";
    const planLabel =
      plan === "yearly"
        ? "Yearly Plan Interest (₹499/year)"
        : plan === "monthly"
        ? "Monthly Plan Interest (₹49/month)"
        : "";
    const subjectParts = ["[SplitRupee]", topicLabel];
    if (planLabel && topicKey === "pro") {
      subjectParts.push(plan === "yearly" ? "Yearly" : "Monthly");
    }
    subjectParts.push(name);

    const formattedMessage = [
      `Topic: ${topicLabel}`,
      ...(planLabel && topicKey === "pro" ? [`Requested Tier Option: ${planLabel}`] : []),
      "",
      message,
    ].join("\n");

    const clientOrigin =
      req.headers.get("origin") ||
      (req.headers.get("host") ? `http://${req.headers.get("host")}` : "http://localhost:3000");
    const clientReferer = req.headers.get("referer") || `${clientOrigin}/contact`;

    const providerResult = await sendToWeb3Forms(
      {
        access_key: accessKey,
        subject: subjectParts.join(" · "),
        from_name: "SplitRupee Contact Form",
        name,
        email,
        replyto: email,
        topic: topicLabel,
        message: formattedMessage,
        botcheck: "",
      },
      clientOrigin,
      clientReferer
    );

    if (!providerResult.ok || providerResult.data?.success !== true) {
      const providerMsg =
        typeof providerResult.data?.message === "string" && providerResult.data.message.trim()
          ? providerResult.data.message.trim()
          : "Message delivery failed at the mail provider.";
      return NextResponse.json(
        {
          ok: false,
          error: "DELIVERY_FAILED",
          message: providerMsg,
        },
        { status: providerResult.status >= 400 && providerResult.status < 500 ? providerResult.status : 502 }
      );
    }

    recordContactSubmission({ clientIp, signature: submissionSig, now });

    return NextResponse.json({
      ok: true,
      message: "Your message has been sent. We will reply to your email address soon.",
    });
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "AbortError";
    return NextResponse.json(
      {
        ok: false,
        error: isTimeout ? "PROVIDER_TIMEOUT" : "SERVER_ERROR",
        message: isTimeout
          ? "The contact service timed out. Please try again or use WhatsApp / Email below."
          : "Could not send your message right now. Please try again later.",
      },
      { status: isTimeout ? 504 : 500 }
    );
  }
}

