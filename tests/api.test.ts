import { beforeEach, describe, expect, it, vi } from "vitest";
import { db, seedGroup } from "./fakeDb";

vi.mock("@/lib/prisma", async () => ({ prisma: (await import("./fakeDb")).db }));

import { GET, POST } from "@/app/api/expenses/route";

const post = (body: unknown) =>
  POST(new Request("http://localhost/api/expenses", { method: "POST", body: JSON.stringify(body) }));

const base = {
  groupId: "g1",
  paidById: "a",
  title: "Dinner",
  totalAmount: 100,
  splitType: "PERCENTAGE",
  category: "Food",
  splits: [
    { userId: "a", percentage: 33.34 },
    { userId: "b", percentage: 33.33 },
    { userId: "c", percentage: 33.33 },
  ],
};

beforeEach(() => seedGroup());

describe("POST /api/expenses", () => {
  it("Target A end-to-end: saves 33.34/33.33/33.33 with exact paise", async () => {
    const res = await post(base);
    expect(res.status).toBe(201);
    expect(db.expenses).toHaveLength(1);
    expect(db.splits.map((s) => s.amount)).toEqual([34, 33, 33]);
  });

  it("Target B: 99.5% payload is rejected with 422 and never opens a transaction", async () => {
    const res = await post({
      ...base,
      splits: [
        { userId: "a", percentage: 50 },
        { userId: "b", percentage: 49.5 },
      ],
    });
    const json = await res.json();
    expect(res.status).toBe(422);
    expect(json.ok).toBe(false);
    expect(json.issues[0]).toContain("99.50%");
    expect(db.transactionCalls).toBe(0);
    expect(db.expenses).toHaveLength(0);
  });

  it("Target B: exact total off by ₹1.50 is rejected before any DB work", async () => {
    const res = await post({
      ...base,
      splitType: "EXACT",
      totalAmount: 300,
      splits: [
        { userId: "a", amount: 150 },
        { userId: "b", amount: 151.5 },
      ],
    });
    expect(res.status).toBe(422);
    expect(db.transactionCalls).toBe(0);
  });

  it("rejects malformed JSON, schema violations, and non-members", async () => {
    const bad = await POST(new Request("http://localhost/api/expenses", { method: "POST", body: "{nope" }));
    expect(bad.status).toBe(400);
    expect((await post({ ...base, title: "" })).status).toBe(422);
    expect((await post({ ...base, totalAmount: "100" })).status).toBe(422);

    const outsider = await post({
      ...base,
      splitType: "EXACT",
      splits: [
        { userId: "a", amount: 50 },
        { userId: "zzz", amount: 50 },
      ],
    });
    expect(outsider.status).toBe(422);
    expect(db.expenses).toHaveLength(0); // transaction ran, then rolled back
  });

  it("Target D: connection drop after 1 of 3 split rows rolls everything back", async () => {
    db.failAfterSplitRows = 1;
    const res = await post(base);
    const json = await res.json();
    expect(res.status).toBe(500);
    expect(json.error).toBe("TRANSACTION_ROLLED_BACK");
    expect(db.transactionCalls).toBe(1);
    expect(db.expenses).toHaveLength(0);
    expect(db.splits).toHaveLength(0);
  });

  it("Target D: a transaction timeout (P2028) returns 504 and leaves nothing behind", async () => {
    db.timeoutInTransaction = true;
    const res = await post(base);
    expect(res.status).toBe(504);
    expect(db.expenses).toHaveLength(0);
    expect(db.splits).toHaveLength(0);
  });

  it("recovers cleanly: a retry after a failed attempt succeeds with no duplicates", async () => {
    db.failAfterSplitRows = 2;
    expect((await post(base)).status).toBe(500);
    db.failAfterSplitRows = null;
    expect((await post(base)).status).toBe(201);
    expect(db.expenses).toHaveLength(1);
    expect(db.splits).toHaveLength(3);
  });
});

describe("GET /api/expenses", () => {
  it("requires groupId", async () => {
    const res = await GET(new Request("http://localhost/api/expenses"));
    expect(res.status).toBe(400);
  });
  it("returns the group's expenses", async () => {
    await post(base);
    const res = await GET(new Request("http://localhost/api/expenses?groupId=g1"));
    const json = await res.json();
    expect(json.expenses).toHaveLength(1);
  });
});
