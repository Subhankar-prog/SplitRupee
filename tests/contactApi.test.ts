import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../app/api/contact/route";
import { resetContactRateLimiterForTests } from "../lib/contactRateLimit";

function makeRequest(payload: Record<string, unknown>, ip = "203.0.113.10") {
  return new NextRequest("http://localhost:3000/api/contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(payload),
  });
}

describe("POST /api/contact (Web3Forms proxy)", () => {
  const originalKey = process.env.WEB3FORMS_ACCESS_KEY;

  beforeEach(() => {
    resetContactRateLimiterForTests();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.WEB3FORMS_ACCESS_KEY;
    } else {
      process.env.WEB3FORMS_ACCESS_KEY = originalKey;
    }
  });

  it("rejects spam honeypot submissions without contacting Web3Forms", async () => {
    process.env.WEB3FORMS_ACCESS_KEY = "test-access-key";
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const res = await POST(
      makeRequest({
        name: "Spam Bot",
        email: "bot@example.com",
        topic: "support",
        message: "This should be blocked by botcheck field validation.",
        botcheck: "filled-by-bot",
      })
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error).toBe("SPAM_DETECTED");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("validates required name, email format, and minimum message length", async () => {
    process.env.WEB3FORMS_ACCESS_KEY = "test-access-key";

    const badEmailRes = await POST(
      makeRequest({
        name: "Rohan",
        email: "not-an-email",
        topic: "support",
        message: "Please help me settle our Goa trip expenses cleanly.",
        botcheck: "",
      })
    );
    expect(badEmailRes.status).toBe(400);
    expect((await badEmailRes.json()).error).toBe("INVALID_EMAIL");

    const shortMsgRes = await POST(
      makeRequest({
        name: "Rohan",
        email: "rohan@example.com",
        topic: "support",
        message: "Hi",
        botcheck: "",
      })
    );
    expect(shortMsgRes.status).toBe(400);
    expect((await shortMsgRes.json()).error).toBe("INVALID_MESSAGE");
  });

  it("returns 503 when WEB3FORMS_ACCESS_KEY is missing instead of faking success", async () => {
    delete process.env.WEB3FORMS_ACCESS_KEY;
    const res = await POST(
      makeRequest({
        name: "Rohan Kulkarni",
        email: "rohan@example.com",
        topic: "pro",
        message: "Requesting access to SplitRupee Pro for monthly recurring rent.",
        botcheck: "",
      })
    );
    const json = await res.json();

    expect(res.status).toBe(503);
    expect(json.ok).toBe(false);
    expect(json.error).toBe("CONTACT_UNAVAILABLE");
  });

  it("validates Web3Forms JSON success flag even on HTTP 200 responses", async () => {
    process.env.WEB3FORMS_ACCESS_KEY = "test-access-key";
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ success: false, message: "Invalid access key." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const res = await POST(
      makeRequest({
        name: "Rohan Kulkarni",
        email: "rohan@example.com",
        topic: "support",
        message: "Need assistance with an expense split in my Goa group.",
        botcheck: "",
      })
    );
    const json = await res.json();

    expect(res.status).toBe(502);
    expect(json.ok).toBe(false);
    expect(json.error).toBe("DELIVERY_FAILED");
    expect(json.message).toContain("Invalid access key");
  });

  it("returns ok:true only when Web3Forms accepts the submission and prevents immediate duplicate burst", async () => {
    process.env.WEB3FORMS_ACCESS_KEY = "test-access-key";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: true, message: "Email sent successfully!" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const payload = {
      name: "Meera Nair",
      email: "meera@example.com",
      topic: "pro",
      plan: "yearly",
      message: "Hello team, please enable Pro access on my account.",
      botcheck: "",
    };

    const firstRes = await POST(makeRequest(payload, "198.51.100.4"));
    const firstJson = await firstRes.json();
    expect(firstRes.status).toBe(200);
    expect(firstJson.ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const sentBody = JSON.parse(String(fetchSpy.mock.calls[0]?.[1]?.body));
    expect(sentBody.access_key).toBe("test-access-key");
    expect(sentBody.email).toBe("meera@example.com");
    expect(sentBody.botcheck).toBe("");

    // Duplicate immediate click blocked
    const dupRes = await POST(makeRequest(payload, "198.51.100.4"));
    const dupJson = await dupRes.json();
    expect(dupRes.status).toBe(429);
    expect(dupJson.ok).toBe(false);
    expect(dupJson.error).toBe("DUPLICATE_SUBMISSION");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});

