import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    groupMember: { count: vi.fn() },
    group: { findFirst: vi.fn() },
    expense: { findFirst: vi.fn() },
    payment: { findFirst: vi.fn() },
    activityLog: { findFirst: vi.fn() },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { GET } from "@/app/api/realtime/stream/route";

describe("GET /api/realtime/stream", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("closes legacy SSE requests immediately so serverless functions never time out", async () => {
    const req = new Request("https://splitrupee.vercel.app/api/realtime/stream");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    const bodyText = await res.text();
    expect(bodyText).toContain('data: {"type":"CONNECTED"}');
    expect(mockPrisma.groupMember.count).not.toHaveBeenCalled();
  });

  it("returns 400 when mode=version is missing userId", async () => {
    const req = new Request("https://splitrupee.vercel.app/api/realtime/stream?mode=version");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error).toMatch(/userId/i);
  });

  it("returns deterministic version fingerprint for mode=version", async () => {
    mockPrisma.groupMember.count.mockResolvedValue(2);
    mockPrisma.group.findFirst.mockResolvedValue({
      id: "g1",
      updatedAt: new Date("2026-11-11T10:00:00.000Z"),
    });
    mockPrisma.expense.findFirst.mockResolvedValue({
      id: "e1",
      updatedAt: new Date("2026-11-11T10:05:00.000Z"),
    });
    mockPrisma.payment.findFirst.mockResolvedValue({
      id: "p1",
      createdAt: new Date("2026-11-11T10:06:00.000Z"),
    });
    mockPrisma.activityLog.findFirst.mockResolvedValue({
      id: "a1",
      createdAt: new Date("2026-11-11T10:07:00.000Z"),
    });

    const req = new Request(
      "https://splitrupee.vercel.app/api/realtime/stream?mode=version&userId=u1"
    );
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toContain("no-store");
    expect(json.ok).toBe(true);
    expect(json.version).toBe(
      `2:g1:${new Date("2026-11-11T10:00:00.000Z").getTime()}:e1:${new Date("2026-11-11T10:05:00.000Z").getTime()}:p1:${new Date("2026-11-11T10:06:00.000Z").getTime()}:a1:${new Date("2026-11-11T10:07:00.000Z").getTime()}`
    );
  });

  it("degrades gracefully with ok:false on transient database error", async () => {
    mockPrisma.groupMember.count.mockRejectedValue(new Error("DB timeout"));

    const req = new Request(
      "https://splitrupee.vercel.app/api/realtime/stream?mode=version&userId=u1"
    );
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(false);
    expect(json.version).toBeNull();
  });
});

