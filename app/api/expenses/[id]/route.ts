import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { expensePayloadSchema } from "@/lib/validation";
import { computeSplits, SplitValidationError } from "@/lib/split";
import { broadcastEvent } from "@/lib/eventBus";
import { roundFigure } from "@/lib/money";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: { id: string };
}

function fail(status: number, error: string, issues: string[] = []) {
  return NextResponse.json({ ok: false, error, issues }, { status });
}

/** GET /api/expenses/[id]: single expense */
export async function GET(req: Request, { params }: Params) {
  try {
    const { id } = params;
    const person = { select: { id: true, name: true, avatarColor: true } } as const;
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        paidBy: person,
        group: { select: { id: true, name: true } },
        splits: { include: { user: person } },
      },
    });

    if (!expense) return fail(404, "NOT_FOUND", ["Expense not found"]);

    return NextResponse.json({ ok: true, expense });
  } catch (e) {
    console.error("[GET /api/expenses/[id]]", e);
    return fail(500, "FETCH_FAILED");
  }
}

/** PUT /api/expenses/[id]: update expense or restore soft-deleted expense, and broadcast SSE */
export async function PUT(req: Request, { params }: Params) {
  const { id } = params;
  let body: any;
  try {
    body = await req.json();
  } catch {
    return fail(400, "MALFORMED_JSON");
  }

  // Check if restore action
  if (body.action === "RESTORE") {
    try {
      const restored = await prisma.$transaction(async (tx) => {
        const exp = await tx.expense.update({
          where: { id },
          data: { isDeleted: false, deletedAt: null },
        });

        await tx.activityLog.create({
          data: {
            groupId: exp.groupId,
            userId: body.userId || exp.paidById,
            action: "EXPENSE_RESTORED",
            entityTitle: exp.title,
            details: `Restored deleted expense "${exp.title}"`,
          },
        });

        await tx.group.update({
          where: { id: exp.groupId },
          data: { updatedAt: new Date() },
        });

        return exp;
      });

      broadcastEvent({ type: "EXPENSE_RESTORED", payload: restored });
      return NextResponse.json({ ok: true, expense: restored });
    } catch (e) {
      return fail(500, "RESTORE_FAILED");
    }
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
    const updated = await prisma.$transaction(
      async (tx) => {
        const oldExpense = await tx.expense.findUnique({
          where: { id },
          include: { paidBy: true },
        });
        if (!oldExpense) throw new Error("Expense not found");

        const exp = await tx.expense.update({
          where: { id },
          data: {
            title: p.title,
            paidById: p.paidById,
            totalAmount: totalPaise / 100,
            originalAmount: p.originalAmount !== undefined && p.originalAmount !== null ? Number(p.originalAmount) : null,
            currency: p.currency || "INR",
            exchangeRate: p.exchangeRate !== undefined && p.exchangeRate !== null ? Number(p.exchangeRate) : 1.0,
            splitType: p.splitType,
            category: p.category,
            notes: p.notes,
            receiptUrl: p.receiptUrl !== undefined ? p.receiptUrl : oldExpense.receiptUrl,
            date: p.date ? new Date(p.date) : undefined,
          },
        });

        // Replace splits
        await tx.expenseSplit.deleteMany({ where: { expenseId: id } });
        await tx.expenseSplit.createMany({
          data: splits.map((s) => ({
            expenseId: id,
            userId: s.userId,
            amount: s.amountPaise / 100,
            percentage: s.percentage,
          })),
        });

        // Audit Log for update
        const diffs: string[] = [];
        if (oldExpense.title !== p.title) diffs.push(`title: "${oldExpense.title}" → "${p.title}"`);
        if (oldExpense.totalAmount !== totalPaise / 100) {
          diffs.push(`amount: ₹${roundFigure(oldExpense.totalAmount)} → ₹${Math.round(totalPaise / 100)}`);
        }
        if (oldExpense.currency !== (p.currency || "INR")) {
          diffs.push(`currency: ${oldExpense.currency} → ${p.currency || "INR"}`);
        }
        if (oldExpense.category !== p.category) diffs.push(`category: ${oldExpense.category} → ${p.category}`);

        await tx.activityLog.create({
          data: {
            groupId: oldExpense.groupId,
            userId: p.paidById,
            action: "EXPENSE_UPDATED",
            entityTitle: p.title,
            details: diffs.length > 0 ? `Updated ${diffs.join(", ")}` : `Updated details of "${p.title}"`,
          },
        });

        await tx.group.update({
          where: { id: oldExpense.groupId },
          data: { updatedAt: new Date() },
        });

        return exp;
      },
      { maxWait: 5_000, timeout: 10_000 }
    );

    broadcastEvent({ type: "EXPENSE_UPDATED", payload: updated });

    return NextResponse.json({ ok: true, expense: updated });
  } catch (e: any) {
    if (e instanceof SplitValidationError) return fail(422, "SPLIT_VALIDATION_FAILED", e.issues);
    console.error("[PUT /api/expenses/[id]]", e);
    return fail(500, "UPDATE_FAILED", [e.message || "Failed to update expense"]);
  }
}

/** DELETE /api/expenses/[id]: soft delete expense and log to ActivityLog + SSE broadcast */
export async function DELETE(req: Request, { params }: Params) {
  const { id } = params;
  const { searchParams } = new URL(req.url);
  const deletedById = searchParams.get("deletedById");

  try {
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: { paidBy: true },
    });

    if (!expense) return fail(404, "NOT_FOUND");

    // Soft Delete
    await prisma.expense.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    // Write Activity Log
    await prisma.activityLog.create({
      data: {
        groupId: expense.groupId,
        userId: deletedById || expense.paidById,
        action: "EXPENSE_DELETED",
        entityTitle: expense.title,
        details: `Deleted expense "${expense.title}" (₹${roundFigure(expense.totalAmount).toLocaleString("en-IN")})`,
      },
    });

    await prisma.group.update({
      where: { id: expense.groupId },
      data: { updatedAt: new Date() },
    });

    broadcastEvent({ type: "EXPENSE_DELETED", payload: { id, groupId: expense.groupId } });

    return NextResponse.json({ ok: true, softDeleted: true });
  } catch (e) {
    console.error("[DELETE /api/expenses/[id]]", e);
    return fail(500, "DELETE_FAILED");
  }
}
