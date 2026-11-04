import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface Params {
  params: { id: string };
}

async function resolveGroupId(rawId: string | undefined): Promise<string | null> {
  const cleanId = typeof rawId === "string" ? decodeURIComponent(rawId).trim() : "";
  if (!cleanId) return null;
  const group = await prisma.group.findFirst({
    where: {
      OR: [
        { id: { equals: cleanId, mode: "insensitive" } },
        { inviteCode: { equals: cleanId, mode: "insensitive" } },
        { id: { startsWith: cleanId, mode: "insensitive" } },
        { inviteCode: { startsWith: cleanId, mode: "insensitive" } },
      ],
    },
    select: { id: true },
  });
  return group?.id || null;
}

/**
 * POST /api/groups/[id]/merge-members
 * Merges a duplicate member (sourceUserId, e.g. phone placeholder) into an active member (targetUserId).
 * Consolidates all Expense, ExpenseSplit, Payment, and RecurringExpense records, then cleans up the duplicate.
 */
export async function POST(req: Request, { params }: Params) {
  try {
    const groupId = await resolveGroupId(params?.id);
    if (!groupId) {
      return NextResponse.json({ ok: false, error: "GROUP_NOT_FOUND", message: "Group not found" }, { status: 404 });
    }

    const body = await req.json();
    const { sourceUserId, targetUserId, requesterId } = body;

    if (!sourceUserId || !targetUserId) {
      return NextResponse.json(
        { ok: false, error: "MISSING_PARAMS", message: "Both sourceUserId and targetUserId are required" },
        { status: 400 }
      );
    }

    if (sourceUserId === targetUserId) {
      return NextResponse.json(
        { ok: false, error: "IDENTICAL_USERS", message: "Cannot merge a member into themselves" },
        { status: 400 }
      );
    }

    // Verify group and membership
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        activityLogs: {
          where: { action: "GROUP_CREATED" },
          take: 1,
          select: { userId: true },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                upiId: true,
                passwordHash: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ ok: false, error: "GROUP_NOT_FOUND", message: "Group not found" }, { status: 404 });
    }

    // Check requester permissions (must be ADMIN, group creator, or targetUser)
    if (requesterId) {
      const creatorId = group.activityLogs[0]?.userId || group.members[0]?.userId;
      const requesterMember = group.members.find((m) => m.userId === requesterId);
      const hasAnyAdmin = group.members.some((m) => m.role === "ADMIN");
      const isCreator = creatorId === requesterId;
      const isAdmin = requesterMember?.role === "ADMIN" || (!hasAnyAdmin && isCreator);
      const isTarget = requesterId === targetUserId;

      if (!isCreator && !isAdmin && !isTarget) {
        return NextResponse.json(
          { ok: false, error: "FORBIDDEN", message: "Only group admins can merge members" },
          { status: 403 }
        );
      }
    }

    const sourceMember = group.members.find((m) => m.userId === sourceUserId);
    const targetMember = group.members.find((m) => m.userId === targetUserId);

    if (!sourceMember || !targetMember) {
      return NextResponse.json(
        { ok: false, error: "MEMBER_NOT_FOUND", message: "Both members must currently be part of the group" },
        { status: 400 }
      );
    }

    const sourceUser = sourceMember.user;
    const targetUser = targetMember.user;

    // Transactional merge
    await prisma.$transaction(async (tx) => {
      // 1. Reassign Expenses paid by sourceUser in this group
      await tx.expense.updateMany({
        where: {
          groupId,
          paidById: sourceUserId,
        },
        data: {
          paidById: targetUserId,
        },
      });

      // 2. Reassign RecurringExpenses paid by sourceUser in this group
      await tx.recurringExpense.updateMany({
        where: {
          groupId,
          paidById: sourceUserId,
        },
        data: {
          paidById: targetUserId,
        },
      });

      // 3. Consolidate ExpenseSplits in this group
      const sourceSplits = await tx.expenseSplit.findMany({
        where: {
          userId: sourceUserId,
          expense: { groupId },
        },
      });

      for (const split of sourceSplits) {
        const targetSplit = await tx.expenseSplit.findUnique({
          where: {
            expenseId_userId: {
              expenseId: split.expenseId,
              userId: targetUserId,
            },
          },
        });

        if (targetSplit) {
          // Both had splits on the same expense -> combine amounts and delete source split
          await tx.expenseSplit.update({
            where: { id: targetSplit.id },
            data: {
              amount: targetSplit.amount + split.amount,
              percentage:
                targetSplit.percentage !== null || split.percentage !== null
                  ? (targetSplit.percentage || 0) + (split.percentage || 0)
                  : null,
            },
          });
          await tx.expenseSplit.delete({
            where: { id: split.id },
          });
        } else {
          // Reassign split to targetUserId
          await tx.expenseSplit.update({
            where: { id: split.id },
            data: { userId: targetUserId },
          });
        }
      }

      // 4. Consolidate Payments in this group
      // Payer payments
      const sourcePayerPayments = await tx.payment.findMany({
        where: {
          groupId,
          payerId: sourceUserId,
        },
      });
      for (const p of sourcePayerPayments) {
        if (p.receiverId === targetUserId) {
          // Payment between the two personas -> remove duplicate self-payment
          await tx.payment.delete({ where: { id: p.id } });
        } else {
          await tx.payment.update({
            where: { id: p.id },
            data: { payerId: targetUserId },
          });
        }
      }

      // Receiver payments
      const sourceReceiverPayments = await tx.payment.findMany({
        where: {
          groupId,
          receiverId: sourceUserId,
        },
      });
      for (const p of sourceReceiverPayments) {
        if (p.payerId === targetUserId) {
          // Payment between the two personas -> remove duplicate self-payment
          await tx.payment.delete({ where: { id: p.id } });
        } else {
          await tx.payment.update({
            where: { id: p.id },
            data: { receiverId: targetUserId },
          });
        }
      }

      // 5. Backfill phone & upiId if targetUser was missing them
      const updateData: { phone?: string; upiId?: string } = {};
      if (!targetUser.phone && sourceUser.phone) {
        updateData.phone = sourceUser.phone;
      }
      if (!targetUser.upiId && sourceUser.upiId) {
        updateData.upiId = sourceUser.upiId;
      }
      if (Object.keys(updateData).length > 0) {
        await tx.user.update({
          where: { id: targetUserId },
          data: updateData,
        });
      }

      // 6. Remove sourceUser's GroupMember record
      await tx.groupMember.deleteMany({
        where: {
          groupId,
          userId: sourceUserId,
        },
      });

      // 7. Check if sourceUser was a placeholder account with no other active records
      const isPlaceholder =
        sourceUser.passwordHash === null &&
        (sourceUser.email.endsWith("@splitrupee.in") || sourceUser.email.startsWith("member_"));

      if (isPlaceholder) {
        const [otherMemberships, otherExpenses, otherSplits, otherPayments] = await Promise.all([
          tx.groupMember.count({ where: { userId: sourceUserId } }),
          tx.expense.count({ where: { paidById: sourceUserId } }),
          tx.expenseSplit.count({ where: { userId: sourceUserId } }),
          tx.payment.count({ where: { OR: [{ payerId: sourceUserId }, { receiverId: sourceUserId }] } }),
        ]);

        if (
          otherMemberships === 0 &&
          otherExpenses === 0 &&
          otherSplits === 0 &&
          otherPayments === 0
        ) {
          await tx.user.delete({ where: { id: sourceUserId } });
        }
      }

      // 8. Record ActivityLog
      await tx.activityLog.create({
        data: {
          groupId,
          userId: requesterId || targetUserId,
          action: "MEMBER_REMOVED",
          entityTitle: sourceUser.name,
          details: `Merged duplicate member "${sourceUser.name}" into "${targetUser.name}"`,
        },
      });
    });

    return NextResponse.json({
      ok: true,
      message: `Successfully merged "${sourceUser.name}" into "${targetUser.name}"`,
      sourceName: sourceUser.name,
      targetName: targetUser.name,
    });
  } catch (error: any) {
    console.error("[POST /api/groups/[id]/merge-members]", error);
    return NextResponse.json(
      { ok: false, error: "MERGE_FAILED", message: error.message || "Failed to merge members" },
      { status: 500 }
    );
  }
}
