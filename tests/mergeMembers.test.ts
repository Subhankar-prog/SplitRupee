import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPrisma } = vi.hoisted(() => {
  const mockPrisma: any = {
    group: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    groupMember: {
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    expense: {
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    recurringExpense: {
      updateMany: vi.fn(),
    },
    expenseSplit: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    payment: {
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
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

import { POST } from "@/app/api/groups/[id]/merge-members/route";

describe("POST /api/groups/[id]/merge-members", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fails with 404 if group is not found", async () => {
    mockPrisma.group.findFirst.mockResolvedValueOnce(null);

    const req = new Request("http://localhost/api/groups/non-existent/merge-members", {
      method: "POST",
      body: JSON.stringify({
        sourceUserId: "user-1",
        targetUserId: "user-2",
      }),
    });

    const res = await POST(req, { params: { id: "non-existent" } });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.ok).toBe(false);
    expect(data.error).toBe("GROUP_NOT_FOUND");
  });

  it("fails with 400 if sourceUserId or targetUserId is missing", async () => {
    mockPrisma.group.findFirst.mockResolvedValueOnce({ id: "group-1" });

    const req = new Request("http://localhost/api/groups/group-1/merge-members", {
      method: "POST",
      body: JSON.stringify({
        sourceUserId: "user-1",
      }),
    });

    const res = await POST(req, { params: { id: "group-1" } });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(data.error).toBe("MISSING_PARAMS");
  });

  it("fails with 400 if sourceUserId and targetUserId are identical", async () => {
    mockPrisma.group.findFirst.mockResolvedValueOnce({ id: "group-1" });

    const req = new Request("http://localhost/api/groups/group-1/merge-members", {
      method: "POST",
      body: JSON.stringify({
        sourceUserId: "user-1",
        targetUserId: "user-1",
      }),
    });

    const res = await POST(req, { params: { id: "group-1" } });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(data.error).toBe("IDENTICAL_USERS");
  });

  it("successfully merges duplicate member into active member", async () => {
    mockPrisma.group.findFirst.mockResolvedValueOnce({ id: "group-1" });
    mockPrisma.group.findUnique.mockResolvedValueOnce({
      id: "group-1",
      creatorId: "admin-1",
      activityLogs: [{ userId: "admin-1" }],
      members: [
        {
          userId: "admin-1",
          role: "ADMIN",
          user: { id: "admin-1", name: "Admin", email: "admin@test.com", passwordHash: "hash" },
        },
        {
          userId: "phone-user",
          role: "MEMBER",
          user: {
            id: "phone-user",
            name: "Member 9876543210",
            email: "9876543210@splitrupee.in",
            phone: "9876543210",
            upiId: "9876543210@ybl",
            passwordHash: null,
          },
        },
        {
          userId: "gmail-user",
          role: "MEMBER",
          user: {
            id: "gmail-user",
            name: "Rahul Sharma",
            email: "rahul@gmail.com",
            phone: null,
            upiId: null,
            passwordHash: "hash",
          },
        },
      ],
    });

    // Mock splits consolidation
    mockPrisma.expenseSplit.findMany.mockResolvedValueOnce([
      { id: "split-1", expenseId: "exp-1", userId: "phone-user", amount: 250, percentage: 50 },
    ]);
    mockPrisma.expenseSplit.findUnique.mockResolvedValueOnce({
      id: "split-2",
      expenseId: "exp-1",
      userId: "gmail-user",
      amount: 100,
      percentage: 20,
    });

    // Mock payments
    mockPrisma.payment.findMany
      .mockResolvedValueOnce([]) // payer payments
      .mockResolvedValueOnce([]); // receiver payments

    // Mock counts for placeholder cleanup check
    mockPrisma.groupMember.count.mockResolvedValueOnce(0);
    mockPrisma.expense.count.mockResolvedValueOnce(0);
    mockPrisma.expenseSplit.count.mockResolvedValueOnce(0);
    mockPrisma.payment.count.mockResolvedValueOnce(0);

    const req = new Request("http://localhost/api/groups/group-1/merge-members", {
      method: "POST",
      body: JSON.stringify({
        sourceUserId: "phone-user",
        targetUserId: "gmail-user",
        requesterId: "admin-1",
      }),
    });

    const res = await POST(req, { params: { id: "group-1" } });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.sourceName).toBe("Member 9876543210");
    expect(data.targetName).toBe("Rahul Sharma");

    // Verified expenses were updated to gmail-user
    expect(mockPrisma.expense.updateMany).toHaveBeenCalledWith({
      where: { groupId: "group-1", paidById: "phone-user" },
      data: { paidById: "gmail-user" },
    });

    // Verified target split was consolidated (100 + 250 = 350)
    expect(mockPrisma.expenseSplit.update).toHaveBeenCalledWith({
      where: { id: "split-2" },
      data: { amount: 350, percentage: 70 },
    });

    // Verified duplicate split was deleted
    expect(mockPrisma.expenseSplit.delete).toHaveBeenCalledWith({
      where: { id: "split-1" },
    });

    // Verified phone & upi backfilled onto target user
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "gmail-user" },
      data: { phone: "9876543210", upiId: "9876543210@ybl" },
    });

    // Verified duplicate group member removed
    expect(mockPrisma.groupMember.deleteMany).toHaveBeenCalledWith({
      where: { groupId: "group-1", userId: "phone-user" },
    });

    // Verified placeholder account safely deleted
    expect(mockPrisma.user.delete).toHaveBeenCalledWith({
      where: { id: "phone-user" },
    });

    // Verified activity log written
    expect(mockPrisma.activityLog.create).toHaveBeenCalled();
  });
});
