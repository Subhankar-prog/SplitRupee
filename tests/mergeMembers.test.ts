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
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    payment: {
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
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

  it("successfully merges duplicate member into active member (consolidating overlapping + bulk-moving non-overlapping splits)", async () => {
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

    // 1st findMany: sourceSplits (1 overlapping on exp-1, 1 non-overlapping on exp-2)
    mockPrisma.expenseSplit.findMany
      .mockResolvedValueOnce([
        { id: "split-1", expenseId: "exp-1", userId: "phone-user", amount: 250, percentage: 50 },
        { id: "split-3", expenseId: "exp-2", userId: "phone-user", amount: 500, percentage: 100 },
      ])
      // 2nd findMany: targetSplits matching those expenseIds
      .mockResolvedValueOnce([
        {
          id: "split-2",
          expenseId: "exp-1",
          userId: "gmail-user",
          amount: 100,
          percentage: 20,
        },
      ]);

    // Sequential short-circuit counts for placeholder cleanup check
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

    // Verified target split on exp-1 was consolidated (100 + 250 = 350)
    expect(mockPrisma.expenseSplit.update).toHaveBeenCalledWith({
      where: { id: "split-2" },
      data: { amount: 350, percentage: 70 },
    });

    // Verified non-overlapping split on exp-2 was bulk reassigned
    expect(mockPrisma.expenseSplit.updateMany).toHaveBeenCalledWith({
      where: { userId: "phone-user", expenseId: { in: ["exp-2"] } },
      data: { userId: "gmail-user" },
    });

    // Verified overlapping duplicate split was deleted in bulk
    expect(mockPrisma.expenseSplit.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["split-1"] } },
    });

    // Verified payments consolidated in bulk
    expect(mockPrisma.payment.deleteMany).toHaveBeenCalledWith({
      where: {
        groupId: "group-1",
        OR: [
          { payerId: "phone-user", receiverId: "gmail-user" },
          { payerId: "gmail-user", receiverId: "phone-user" },
        ],
      },
    });
    expect(mockPrisma.payment.updateMany).toHaveBeenCalledTimes(2);

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

  it("retries once and succeeds if Prisma throws transient Transaction not found error", async () => {
    mockPrisma.group.findFirst.mockResolvedValueOnce({ id: "group-1" });
    mockPrisma.group.findUnique.mockResolvedValueOnce({
      id: "group-1",
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
            upiId: null,
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
            phone: "9876543210",
            upiId: null,
            passwordHash: "hash",
          },
        },
      ],
    });

    // First $transaction attempt fails with exact Prisma "Transaction not found" error
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

    mockPrisma.expenseSplit.findMany.mockResolvedValueOnce([]);
    mockPrisma.groupMember.count.mockResolvedValueOnce(1);

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
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(2);
  });
});
