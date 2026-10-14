import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeNetBalances } from "@/lib/debt";
import { toPaise } from "@/lib/money";

export const dynamic = "force-dynamic";

class SettlementError extends Error {
  constructor(public code: string, public status: number, message: string) {
    super(message);
  }
}

/** POST /api/payments: record a direct settlement payment between two members in a group */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { groupId, payerId, receiverId, amount, notes, callerId, idempotencyKey } = body;

    if (!groupId || !payerId || !receiverId || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { ok: false, error: "VALIDATION_FAILED", issues: ["groupId, payerId, receiverId, and positive numeric amount are required"] },
        { status: 400 }
      );
    }

    let amountPaise = 0;
    try {
      amountPaise = toPaise(amount);
    } catch (e: any) {
      return NextResponse.json(
        { ok: false, error: "INVALID_AMOUNT", issues: [e.message || "Invalid amount format"] },
        { status: 400 }
      );
    }

    if (payerId === receiverId) {
      return NextResponse.json({ ok: false, error: "Payer and receiver cannot be the same person" }, { status: 400 });
    }

    // 1. Verify Group & Memberships
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: { select: { userId: true, joinedAt: true }, orderBy: { joinedAt: "asc" } },
        activityLogs: {
          where: { action: "GROUP_CREATED" },
          select: { userId: true },
          take: 1,
        },
      },
    });

    if (!group) {
      return NextResponse.json({ ok: false, error: "GROUP_NOT_FOUND" }, { status: 404 });
    }

    const memberIds = new Set(group.members.map((m) => m.userId));
    if (!memberIds.has(payerId) || !memberIds.has(receiverId)) {
      return NextResponse.json(
        { ok: false, error: "INVALID_MEMBERS", issues: ["Both payer and receiver must be members of this group"] },
        { status: 400 }
      );
    }

    // Determine Group Admin / Creator
    const creatorId = group.activityLogs[0]?.userId || group.members[0]?.userId;

    // 2. Server-side role authorization: Payer, Receiver, or Group Admin
    if (callerId) {
      const isCallerAdmin = callerId === creatorId;
      const isCallerPayer = callerId === payerId;
      const isCallerReceiver = callerId === receiverId;
      if (!isCallerAdmin && !isCallerPayer && !isCallerReceiver) {
        return NextResponse.json(
          { ok: false, error: "FORBIDDEN", issues: ["Only the paying debtor, the receiving creditor, or a group admin is authorized to record this settlement"] },
          { status: 403 }
        );
      }
    }

    // 3. Atomic Transaction execution with row locking, idempotency check, and ledger validation
    const result = await prisma.$transaction(async (tx) => {
      // Row lock on group record to serialize concurrent settlements in PostgreSQL
      await tx.group.update({
        where: { id: groupId },
        data: { updatedAt: new Date() },
      });

      // Idempotency check: if client retries after a network timeout with the same key
      if (idempotencyKey && typeof idempotencyKey === "string") {
        const existing = await tx.payment.findFirst({
          where: {
            groupId,
            notes: { contains: `[idempotency:${idempotencyKey}]` },
          },
          include: {
            payer: { select: { id: true, name: true, avatarColor: true } },
            receiver: { select: { id: true, name: true, avatarColor: true } },
            group: { select: { id: true, name: true } },
          },
        });
        if (existing) {
          return { payment: existing, idempotent: true };
        }
      }

      // Query live expenses and payments INSIDE the transaction lock
      const [expenses, existingPayments] = await Promise.all([
        tx.expense.findMany({
          where: { groupId, isDeleted: false },
          select: { paidById: true, splits: { select: { userId: true, amount: true } } },
        }),
        tx.payment.findMany({
          where: { groupId },
          select: { payerId: true, receiverId: true, amount: true, notes: true },
        }),
      ]);

      const netBalances = computeNetBalances(
        expenses,
        Array.from(memberIds),
        existingPayments
      );

      const payerNetPaise = netBalances[payerId] ?? 0;
      const receiverNetPaise = netBalances[receiverId] ?? 0;

      // Payer must owe money (net balance < 0)
      if (payerNetPaise >= 0) {
        throw new SettlementError("PAYER_NOT_DEBTOR", 400, "Payer does not have an outstanding debt in this group");
      }

      // Receiver must be owed money (net balance > 0)
      if (receiverNetPaise <= 0) {
        throw new SettlementError("RECEIVER_NOT_CREDITOR", 400, "Receiver is not entitled to receive payments in this group");
      }

      // Prevent over-settlement: Amount cannot exceed payer's remaining debt
      const payerDebtPaise = Math.abs(payerNetPaise);
      if (amountPaise > payerDebtPaise) {
        throw new SettlementError(
          "OVER_SETTLEMENT",
          400,
          `Payment amount ₹${amount.toFixed(2)} exceeds payer's remaining debt of ₹${(payerDebtPaise / 100).toFixed(2)}`
        );
      }

      const finalNotes = idempotencyKey
        ? `${notes ? notes + " " : ""}[idempotency:${idempotencyKey}]`
        : notes || null;

      const p = await tx.payment.create({
        data: {
          groupId,
          payerId,
          receiverId,
          amount: Number(amount),
          notes: finalNotes,
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

      return { payment: p, idempotent: false };
    });

    return NextResponse.json({ ok: true, payment: result.payment, idempotent: result.idempotent }, { status: 201 });
  } catch (e: any) {
    if (e instanceof SettlementError) {
      return NextResponse.json({ ok: false, error: e.code, issues: [e.message] }, { status: e.status });
    }
    console.error("[POST /api/payments]", e);
    return NextResponse.json({ ok: false, error: "PAYMENT_FAILED", issues: [e.message || "Failed to record payment"] }, { status: 500 });
  }
}

/** DELETE /api/payments: Reverse an existing settlement with auditable log and single-apply guarantee */
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const paymentId = body.paymentId || url.searchParams.get("paymentId");
    const callerId = body.callerId || url.searchParams.get("callerId");
    const reason = body.reason || url.searchParams.get("reason");

    if (!paymentId) {
      return NextResponse.json(
        { ok: false, error: "VALIDATION_FAILED", issues: ["paymentId is required to reverse a settlement"] },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: {
          payer: { select: { id: true, name: true } },
          receiver: { select: { id: true, name: true } },
          group: {
            include: {
              members: { select: { userId: true, joinedAt: true }, orderBy: { joinedAt: "asc" } },
              activityLogs: { where: { action: "GROUP_CREATED" }, select: { userId: true }, take: 1 },
            },
          },
        },
      });

      if (!payment) {
        throw new SettlementError("NOT_FOUND", 404, "Payment not found or already reversed");
      }

      // Authorization: Admin or Receiver who received money can reverse
      const creatorId = payment.group.activityLogs[0]?.userId || payment.group.members[0]?.userId;
      if (callerId) {
        const isAdmin = callerId === creatorId;
        const isReceiver = callerId === payment.receiverId;
        if (!isAdmin && !isReceiver) {
          throw new SettlementError("FORBIDDEN", 403, "Only group admin or the receiving creditor is authorized to reverse this payment");
        }
      }

      // Row lock on group
      await tx.group.update({
        where: { id: payment.groupId },
        data: { updatedAt: new Date() },
      });

      // Delete payment row
      await tx.payment.delete({
        where: { id: paymentId },
      });

      // Write permanent auditable activity log
      await tx.activityLog.create({
        data: {
          groupId: payment.groupId,
          userId: callerId || payment.receiverId,
          action: "PAYMENT_SETTLED",
          entityTitle: `Settlement Reversed: ₹${Number(payment.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
          details: `Settlement of ₹${Number(payment.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })} from ${payment.payer.name} to ${payment.receiver.name} was reversed${reason ? ` ("${reason}")` : ""}`,
        },
      });

      return { reversedPaymentId: paymentId, amount: payment.amount, groupId: payment.groupId };
    });

    return NextResponse.json({ ok: true, ...result }, { status: 200 });
  } catch (e: any) {
    if (e instanceof SettlementError) {
      return NextResponse.json({ ok: false, error: e.code, issues: [e.message] }, { status: e.status });
    }
    console.error("[DELETE /api/payments]", e);
    return NextResponse.json({ ok: false, error: "REVERSAL_FAILED", issues: [e.message || "Failed to reverse payment"] }, { status: 500 });
  }
}
