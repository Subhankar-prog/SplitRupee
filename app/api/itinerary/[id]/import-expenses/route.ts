import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { groupId, paidById, importableExpenses = [] } = body;

    if (!groupId) {
      return NextResponse.json(
        { ok: false, error: "groupId is required" },
        { status: 400 }
      );
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: true
      }
    });

    if (!group) {
      return NextResponse.json(
        { ok: false, error: "Group not found" },
        { status: 404 }
      );
    }

    const memberIds = group.members.map((m) => m.userId);
    if (memberIds.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Group has no members to split expenses with" },
        { status: 400 }
      );
    }

    const payer = paidById || memberIds[0];
    const createdExpenses = [];

    for (const item of importableExpenses) {
      const amount = Number(item.amount) || 0;
      if (amount <= 0) continue;

      const splitAmount = parseFloat((amount / memberIds.length).toFixed(2));

      const expense = await prisma.expense.create({
        data: {
          groupId,
          paidById: payer,
          title: item.title || "Itinerary Planned Expense",
          totalAmount: amount,
          category: ["Food", "Rent", "Travel", "Utilities", "Shopping", "Entertainment", "Miscellaneous"].includes(item.category)
            ? item.category
            : "Travel",
          splitType: "EQUAL",
          notes: "Auto-imported from AI Travel Itinerary",
          splits: {
            create: memberIds.map((uid) => ({
              userId: uid,
              amount: splitAmount
            }))
          }
        }
      });
      createdExpenses.push(expense);
    }

    // Record activity log
    if (payer) {
      await prisma.activityLog.create({
        data: {
          groupId,
          userId: payer,
          action: "EXPENSE_CREATED",
          entityTitle: `AI Itinerary (${createdExpenses.length} items)`,
          details: `Imported ${createdExpenses.length} planned trip expenses from AI Itinerary Studio`
        }
      });
    }

    return NextResponse.json({
      ok: true,
      importedCount: createdExpenses.length,
      groupId
    });
  } catch (err: any) {
    console.error("[POST /api/itinerary/[id]/import-expenses]", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to import expenses" },
      { status: 500 }
    );
  }
}
