import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPrisma } = vi.hoisted(() => {
  const mockPrisma: any = {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    groupMember: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    expense: {
      updateMany: vi.fn(),
    },
    recurringExpense: {
      updateMany: vi.fn(),
    },
    expenseSplit: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    payment: {
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    activityLog: {
      create: vi.fn(),
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
        name: "Other User",
        email: "other@gmail.com",
        passwordHash: "secure_hash",
        memberships: [],
        splits: [],
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

  it("updates profile and auto-claims placeholder accounts matching mobile number", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: "u1",
      name: "Rahul",
      email: "rahul@gmail.com",
    });

    // Found placeholder account created when friends added him by phone
    mockPrisma.user.findMany.mockResolvedValueOnce([
      {
        id: "placeholder-1",
        name: "Member 9876543210",
        email: "9876543210@splitrupee.in",
        phone: "9876543210",
        passwordHash: null,
        memberships: [{ id: "mem-1", groupId: "group-trip", userId: "placeholder-1" }],
        splits: [{ id: "spl-1", expenseId: "exp-1", userId: "placeholder-1", amount: 400 }],
      },
    ]);

    // Active user is not already member in group-trip
    mockPrisma.groupMember.findUnique.mockResolvedValueOnce(null);
    // Active user has no existing split on exp-1
    mockPrisma.expenseSplit.findUnique.mockResolvedValueOnce(null);

    // Mock payments
    mockPrisma.payment.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

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

    // Verified membership reassigned to active user
    expect(mockPrisma.groupMember.update).toHaveBeenCalledWith({
      where: { id: "mem-1" },
      data: { userId: "u1" },
    });

    // Verified split reassigned
    expect(mockPrisma.expenseSplit.update).toHaveBeenCalledWith({
      where: { id: "spl-1" },
      data: { userId: "u1" },
    });

    // Verified placeholder user was deleted
    expect(mockPrisma.user.delete).toHaveBeenCalledWith({
      where: { id: "placeholder-1" },
    });
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
