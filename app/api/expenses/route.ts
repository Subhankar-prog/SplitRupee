import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { expensePayloadSchema } from "@/lib/validation";
import { computeSplits, SplitValidationError } from "@/lib/split";
import { broadcastEvent } from "@/lib/eventBus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

class IntegrityError extends Error {}

function fail(status: number, error: string, issues: string[] = []) {
  return NextResponse.json({ ok: false, error, issues }, { status });
}

/** POST /api/expenses: validate, then write Expense + ExpenseSplit rows + ActivityLog + SSE broadcast. */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail(400, "MALFORMED_JSON", ["Request body must be valid JSON"]);
  }

  const parsed = expensePayloadSchema.safeParse(body);
  if (!parsed.success) {
    return fail(
      422,
      "VALIDATION_FAILED",
      parsed.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`)
    );
  }
  const p = parsed.data;

  let computed;
  try {
    computed = computeSplits(p.totalAmount, p.splitType, p.splits);
  } catch (e) {
    if (e instanceof SplitValidationError) return fail(422, "SPLIT_VALIDATION_FAILED", e.issues);
    throw e;
  }
  const { totalPaise, splits } = computed;

  try {
    const expense = await prisma.$transaction(
      async (tx) => {
        const members = await tx.groupMember.findMany({
          where: { groupId: p.groupId },
          select: { userId: true },
        });
        const memberIds = new Set(members.map((m) => m.userId));
        const issues: string[] = [];
        if (memberIds.size === 0) issues.push("Group not found or has no members");
        if (!memberIds.has(p.paidById)) issues.push("Payer is not a member of this group");
        for (const s of splits) {
          if (!memberIds.has(s.userId)) issues.push(`User ${s.userId} is not a member of this group`);
        }
        if (issues.length > 0) throw new SplitValidationError(issues);

        const created = await tx.expense.create({
          data: {
            groupId: p.groupId,
            paidById: p.paidById,
            title: p.title,
            totalAmount: totalPaise / 100,
            splitType: p.splitType,
            category: p.category,
            notes: p.notes,
            receiptUrl: p.receiptUrl,
            date: p.date ? new Date(p.date) : new Date(),
          },
          include: {
            paidBy: { select: { name: true } },
            group: { select: { name: true } },
          },
        });

        await tx.expenseSplit.createMany({
          data: splits.map((s) => ({
            expenseId: created.id,
            userId: s.userId,
            amount: s.amountPaise / 100,
            percentage: s.percentage,
          })),
        });

        // Integrity check
        const agg = await tx.expenseSplit.aggregate({
          where: { expenseId: created.id },
          _sum: { amount: true },
        });
        if (Math.round((agg._sum.amount ?? 0) * 100) !== totalPaise) {
          throw new IntegrityError("Stored splits do not add up to the bill total");
        }

        // Log to Activity Log
        await tx.activityLog.create({
          data: {
            groupId: p.groupId,
            userId: p.paidById,
            action: "EXPENSE_CREATED",
            entityTitle: p.title,
            details: `Added expense "${p.title}" of ₹${(totalPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })} (${p.splitType === "EQUAL" ? "Equal split" : p.splitType === "PERCENTAGE" ? "Percentage split" : "Exact split"} among ${splits.length} members)${p.receiptUrl ? " with receipt attached" : ""}`,
          },
        });

        // Touch group updatedAt
        await tx.group.update({
          where: { id: p.groupId },
          data: { updatedAt: new Date() },
        });

        return created;
      },
      { maxWait: 5_000, timeout: 10_000 }
    );

    // Broadcast SSE
    broadcastEvent({ type: "EXPENSE_CREATED", payload: expense });

    return NextResponse.json(
      {
        ok: true,
        expense,
        splits: splits.map((s) => ({ userId: s.userId, amount: s.amountPaise / 100, percentage: s.percentage })),
      },
      { status: 201 }
    );
  } catch (e) {
    if (e instanceof SplitValidationError) return fail(422, "SPLIT_VALIDATION_FAILED", e.issues);
    if (e instanceof IntegrityError) return fail(409, "INTEGRITY_CHECK_FAILED", [e.message]);
    const code = (e as { code?: string })?.code;
    if (code === "P2028") {
      return fail(504, "TRANSACTION_TIMEOUT", ["The database took too long; nothing was saved. Please retry."]);
    }
    console.error("[POST /api/expenses] error:", e);
    return fail(500, "TRANSACTION_ROLLED_BACK", ["Could not save the expense. Please retry."]);
  }
}

/** GET /api/expenses: filter by groupId or userId or list all non-deleted expenses */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");
    const userId = searchParams.get("userId");
    const includeDeleted = searchParams.get("includeDeleted") === "true";

    const where: any = {};
    if (!includeDeleted) where.isDeleted = false;
    if (groupId) where.groupId = groupId;
    if (userId) {
      where.OR = [
        { paidById: userId },
        { splits: { some: { userId } } },
      ];
    }

    const person = { select: { id: true, name: true, avatarColor: true } } as const;
    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        paidBy: person,
        group: { select: { id: true, name: true } },
        splits: { include: { user: person } },
      },
    });

    return NextResponse.json({
      ok: true,
      expenses: expenses.map((e) => ({
        id: e.id,
        groupId: e.groupId,
        groupName: e.group.name,
        paidById: e.paidById,
        title: e.title,
        totalAmount: e.totalAmount,
        splitType: e.splitType,
        category: e.category,
        notes: e.notes,
        receiptUrl: e.receiptUrl,
        isDeleted: e.isDeleted,
        deletedAt: e.deletedAt ? e.deletedAt.toISOString() : null,
        date: e.date.toISOString(),
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
        paidBy: e.paidBy,
        splits: e.splits.map((s) => ({
          id: s.id,
          userId: s.userId,
          amount: s.amount,
          percentage: s.percentage,
          user: s.user,
        })),
      })),
    });
  } catch (e) {
    console.error("[GET /api/expenses]", e);
    return fail(500, "FETCH_FAILED", ["Could not load expenses"]);
  }
}
