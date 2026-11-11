import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPrisma } = vi.hoisted(() => {
  const mockPrisma: any = {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    groupMember: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    expense: {
      updateMany: vi.fn(),
    },
    recurringExpense: {
      updateMany: vi.fn(),
    },
    expenseSplit: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    payment: {
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    activityLog: {
      create: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(async (callback: any) => {
      return await callback(mockPrisma);
    }),
  };
  return { mockPrisma };
});

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { PATCH } from "@/app/api/users/route";

describe("PATCH /api/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fails with 400 if userId is missing", async () => {
    const req = new Request("http://localhost/api/users", {
      method: "PATCH",
      body: JSON.stringify({ name: "Rahul" }),
    });

    const res = await PATCH(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.ok).toBe(false);
  });

  it("fails with 404 if user not found", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    const req = new Request("http://localhost/api/users", {
      method: "PATCH",
      body: JSON.stringify({ userId: "missing-user", name: "Rahul" }),
    });

    const res = await PATCH(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.ok).toBe(false);
  });

  it("fails with 400 if phone number is not 10 digits", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: "u1",
      name: "Rahul",
      email: "rahul@gmail.com",
    });

    const req = new Request("http://localhost/api/users", {
      method: "PATCH",
      body: JSON.stringify({ userId: "u1", phone: "12345" }),
    });

    const res = await PATCH(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(data.error).toBe("INVALID_PHONE");
  });

  it("fails with 409 if phone number belongs to another real registered user", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: "u1",
      name: "Rahul",
      email: "rahul@gmail.com",
    });

    mockPrisma.user.findMany.mockResolvedValueOnce([
      {
        id: "u2",
        email: "other@gmail.com",
        passwordHash: "secure_hash",
      },
    ]);

    const req = new Request("http://localhost/api/users", {
      method: "PATCH",
      body: JSON.stringify({ userId: "u1", phone: "9876543210" }),
    });

    const res = await PATCH(req);
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.ok).toBe(false);
    expect(data.error).toBe("PHONE_IN_USE");
  });

  it("updates profile and bulk auto-claims placeholder accounts matching mobile number", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: "u1",
      name: "Rahul",
      email: "rahul@gmail.com",
    });

    // Found placeholder account created when friends added him by phone
    mockPrisma.user.findMany.mockResolvedValueOnce([
      {
        id: "placeholder-1",
        email: "9876543210@splitrupee.in",
        passwordHash: null,
      },
    ]);

    // 1st groupMember.findMany -> placeholder memberships; 2nd -> existing target memberships
    mockPrisma.groupMember.findMany
      .mockResolvedValueOnce([{ id: "mem-1", groupId: "group-trip", userId: "placeholder-1" }])
      .mockResolvedValueOnce([]);

    // 1st expenseSplit.findMany -> placeholder splits; 2nd -> existing target splits
    mockPrisma.expenseSplit.findMany
      .mockResolvedValueOnce([{ id: "spl-1", expenseId: "exp-1", userId: "placeholder-1", amount: 400, percentage: 50 }])
      .mockResolvedValueOnce([]);

    // Mock final update
    mockPrisma.user.update.mockResolvedValueOnce({
      id: "u1",
      name: "Rahul Sharma",
      email: "rahul@gmail.com",
      phone: "9876543210",
      upiId: "rahul@ybl",
      avatarColor: "#0ea5e9",
      isPro: false,
    });

    const req = new Request("http://localhost/api/users", {
      method: "PATCH",
      body: JSON.stringify({
        userId: "u1",
        name: "Rahul Sharma",
        phone: "9876543210",
        upiId: "rahul@ybl",
        avatarColor: "#0ea5e9",
      }),
    });

    const res = await PATCH(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.claimedGroupsCount).toBe(1);
    expect(data.user.phone).toBe("9876543210");
    expect(data.user.upiId).toBe("rahul@ybl");

    // Verified memberships bulk reassigned to active user
    expect(mockPrisma.groupMember.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["mem-1"] } },
      data: { userId: "u1" },
    });

    // Verified splits bulk reassigned
    expect(mockPrisma.expenseSplit.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["spl-1"] } },
      data: { userId: "u1" },
    });

    // Verified activity logs batched
    expect(mockPrisma.activityLog.createMany).toHaveBeenCalled();

    // Verified placeholder user was bulk deleted
    expect(mockPrisma.user.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["placeholder-1"] } },
    });
  });

  it("retries once and recovers if auto-claim hits transient Transaction not found error", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: "u1",
      name: "Rahul",
      email: "rahul@gmail.com",
    });

    mockPrisma.user.findMany.mockResolvedValueOnce([
      {
        id: "placeholder-1",
        email: "9876543210@splitrupee.in",
        passwordHash: null,
      },
    ]);

    mockPrisma.$transaction
      .mockRejectedValueOnce(
        Object.assign(
          new Error(
            "Transaction API error: Transaction not found. Transaction ID is invalid, refers to an old closed transaction Prisma doesn't have information about anymore, or was obtained before disconnecting."
          ),
          { code: "P2028" }
        )
      )
      .mockImplementationOnce(async (callback: any) => callback(mockPrisma));

    mockPrisma.groupMember.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    mockPrisma.expenseSplit.findMany.mockResolvedValueOnce([]);

    mockPrisma.user.update.mockResolvedValueOnce({
      id: "u1",
      name: "Rahul",
      email: "rahul@gmail.com",
      phone: "9876543210",
      upiId: null,
      avatarColor: "#10b981",
      isPro: false,
    });

    const req = new Request("http://localhost/api/users", {
      method: "PATCH",
      body: JSON.stringify({ userId: "u1", phone: "9876543210" }),
    });

    const res = await PATCH(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(2);
  });

  it("successfully deletes/clears UPI ID when upiId is null or empty string", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: "u1",
      name: "Rahul",
      email: "rahul@gmail.com",
      upiId: "old@ybl",
    });

    mockPrisma.user.update.mockResolvedValueOnce({
      id: "u1",
      name: "Rahul",
      email: "rahul@gmail.com",
      upiId: null,
    });

    const req = new Request("http://localhost/api/users", {
      method: "PATCH",
      body: JSON.stringify({
        userId: "u1",
        upiId: null,
      }),
    });

    const res = await PATCH(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { upiId: null },
      select: expect.any(Object),
    });
  });
});
