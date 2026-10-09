import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** POST /api/payments: record a direct settlement payment between two members in a group */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { groupId, payerId, receiverId, amount, notes } = body;

    if (!groupId || !payerId || !receiverId || !amount || amount <= 0) {
      return NextResponse.json(
        { ok: false, error: "VALIDATION_FAILED", issues: ["groupId, payerId, receiverId, and positive amount are required"] },
        { status: 400 }
      );
    }

    if (payerId === receiverId) {
      return NextResponse.json({ ok: false, error: "Payer and receiver cannot be the same person" }, { status: 400 });
    }

    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          groupId,
          payerId,
          receiverId,
          amount: Number(amount),
          notes: notes || null,
        },
        include: {
          payer: { select: { id: true, name: true, avatarColor: true } },
          receiver: { select: { id: true, name: true, avatarColor: true } },
          group: { select: { id: true, name: true } },
        },
      });

      // Write to Activity Log
      await tx.activityLog.create({
        data: {
          groupId,
          userId: payerId,
          action: "PAYMENT_SETTLED",
          entityTitle: `Payment of ₹${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
          details: `${p.payer.name} paid ${p.receiver.name} ₹${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}${notes ? ` ("${notes}")` : ""}`,
        },
      });

      await tx.group.update({
        where: { id: groupId },
        data: { updatedAt: new Date() },
      });

      return p;
    });

    return NextResponse.json({ ok: true, payment }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/payments]", e);
    return NextResponse.json({ ok: false, error: "PAYMENT_FAILED" }, { status: 500 });
  }
}
