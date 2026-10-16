import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeSplits } from "@/lib/split";
import { broadcastEvent } from "@/lib/eventBus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: { id: string };
}

function calculateNextRunDate(dayOfMonth: number, frequency = "MONTHLY"): Date {
  const now = new Date();
  if (frequency === "WEEKLY") {
    const next = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return next;
  }

  // Monthly:
  const year = now.getFullYear();
  const month = now.getMonth();
  const currentDay = now.getDate();

  if (dayOfMonth > currentDay) {
    // Due later this month
    return new Date(year, month, dayOfMonth, 9, 0, 0);
  } else {
    // Due next month
    return new Date(year, month + 1, dayOfMonth, 9, 0, 0);
  }
}

/**
 * Process any recurring expenses in this group that have nextRunAt <= now()
 */
async function processDueRecurringExpenses(groupId: string) {
  const now = new Date();
  const due = await prisma.recurringExpense.findMany({
    where: {
      groupId,
      isActive: true,
      nextRunAt: { lte: now },
    },
    include: {
      group: {
        include: {
          members: { select: { userId: true } },
        },
      },
    },
  });

  if (due.length === 0) return [];

  const createdExpenses = [];

  for (const item of due) {
    const memberIds = item.group.members.map((m) => m.userId);
    if (memberIds.length === 0) continue;

    // Verify payer is in member list, otherwise fallback to first member
    const payerId = memberIds.includes(item.paidById) ? item.paidById : memberIds[0];

    try {
      const { totalPaise, splits } = computeSplits(
        item.totalAmount,
        "EQUAL",
        memberIds.map((uid) => ({ userId: uid }))
      );

      const created = await prisma.$transaction(async (tx) => {
        const exp = await tx.expense.create({
          data: {
            groupId: item.groupId,
            paidById: payerId,
            title: item.title,
            totalAmount: totalPaise / 100,
            currency: item.currency || "INR",
            exchangeRate: 1.0,
            splitType: "EQUAL",
            category: item.category,
            notes: item.notes ? `${item.notes} · (Automated Monthly Recurring Bill)` : "(Automated Monthly Recurring Bill)",
            date: new Date(),
          },
          include: {
            paidBy: { select: { name: true } },
          },
        });

        await tx.expenseSplit.createMany({
          data: splits.map((s) => ({
            expenseId: exp.id,
            userId: s.userId,
            amount: s.amountPaise / 100,
            percentage: s.percentage,
          })),
        });

        await tx.activityLog.create({
          data: {
            groupId: item.groupId,
            userId: payerId,
            action: "EXPENSE_CREATED",
            entityTitle: item.title,
            details: `Auto-posted recurring expense "${item.title}" of ₹${(totalPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })} for this month`,
          },
        });

        // Compute subsequent nextRunAt
        const nextMonth = new Date(item.nextRunAt);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        await tx.recurringExpense.update({
          where: { id: item.id },
          data: {
            lastRunAt: new Date(),
            nextRunAt: nextMonth,
          },
        });

        return exp;
      });

      broadcastEvent({ type: "EXPENSE_CREATED", payload: created });
      createdExpenses.push(created);
    } catch (err) {
      console.error(`[Recurring Expense ${item.id}] Error auto-posting:`, err);
    }
  }

  return createdExpenses;
}

/**
 * GET /api/groups/[id]/recurring:
 * Lists recurring expenses and auto-processes any overdue runs
 */
export async function GET(req: Request, { params }: Params) {
  try {
    const { id } = params;

    // Process overdue runs first
    await processDueRecurringExpenses(id);

    const recurring = await prisma.recurringExpense.findMany({
      where: { groupId: id },
      orderBy: { createdAt: "desc" },
      include: {
        paidBy: { select: { id: true, name: true, avatarColor: true } },
      },
    });

    return NextResponse.json({ ok: true, recurring });
  } catch (e: any) {
    console.error("[GET /api/groups/[id]/recurring] Error:", e);
    return NextResponse.json({ ok: false, error: "FETCH_FAILED" }, { status: 500 });
  }
}

/**
 * POST /api/groups/[id]/recurring:
 * Create a new recurring expense rule (Rent, Maid, Cook, Wi-Fi, Subscriptions)
 */
export async function POST(req: Request, { params }: Params) {
  try {
    const { id: groupId } = params;
    const body = await req.json();
    const { title, totalAmount, paidById, dayOfMonth, frequency, category, notes } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ ok: false, error: "Title is required" }, { status: 400 });
    }

    const numAmount = Number(totalAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ ok: false, error: "Valid positive amount is required" }, { status: 400 });
    }

    if (!paidById) {
      return NextResponse.json({ ok: false, error: "Payer is required" }, { status: 400 });
    }

    const payer = await prisma.user.findUnique({
      where: { id: paidById },
      select: { isPro: true },
    });
    if (!payer?.isPro) {
      return NextResponse.json(
        { ok: false, error: "PRO_REQUIRED", message: "Automated Recurring Expenses is exclusively available to SplitRupee Pro members." },
        { status: 403 }
      );
    }

    const day = Math.min(31, Math.max(1, parseInt(dayOfMonth, 10) || 1));
    const nextRun = calculateNextRunDate(day, frequency || "MONTHLY");

    const created = await prisma.recurringExpense.create({
      data: {
        groupId,
        paidById,
        title: title.trim(),
        totalAmount: Math.round(numAmount * 100) / 100,
        currency: "INR",
        category: category || "Rent",
        frequency: frequency || "MONTHLY",
        dayOfMonth: day,
        splitType: "EQUAL",
        notes: notes?.trim() || null,
        nextRunAt: nextRun,
      },
      include: {
        paidBy: { select: { id: true, name: true, avatarColor: true } },
      },
    });

    // Write Activity Log
    await prisma.activityLog.create({
      data: {
        groupId,
        userId: paidById,
        action: "EXPENSE_CREATED",
        entityTitle: title.trim(),
        details: `Configured automated monthly recurring expense "${title.trim()}" of ₹${numAmount.toLocaleString("en-IN")} on the ${day}th of every month`,
      },
    });

    return NextResponse.json({ ok: true, recurring: created }, { status: 201 });
  } catch (e: any) {
    console.error("[POST /api/groups/[id]/recurring] Error:", e);
    return NextResponse.json({ ok: false, error: "CREATE_FAILED", message: e.message }, { status: 500 });
  }
}

/**
 * DELETE /api/groups/[id]/recurring?ruleId=...:
 * Delete or toggle a recurring rule
 */
export async function DELETE(req: Request, { params }: Params) {
  try {
    const { searchParams } = new URL(req.url);
    const ruleId = searchParams.get("ruleId");
    if (!ruleId) {
      return NextResponse.json({ ok: false, error: "MISSING_RULE_ID" }, { status: 400 });
    }

    await prisma.recurringExpense.delete({
      where: { id: ruleId },
    });

    return NextResponse.json({ ok: true, deleted: true });
  } catch (e: any) {
    console.error("[DELETE /api/groups/[id]/recurring] Error:", e);
    return NextResponse.json({ ok: false, error: "DELETE_FAILED" }, { status: 500 });
  }
}
