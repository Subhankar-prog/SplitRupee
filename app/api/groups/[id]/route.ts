import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface Params {
  params: { id: string };
}

/** GET /api/groups/[id]: get full group data (members, expenses, payments, activityLogs) */
export async function GET(req: Request, { params }: Params) {
  try {
    const { id } = params;
    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarColor: true } },
          },
          orderBy: { joinedAt: "asc" },
        },
        expenses: {
          orderBy: { createdAt: "desc" },
          include: {
            paidBy: { select: { id: true, name: true, avatarColor: true } },
            splits: {
              include: {
                user: { select: { id: true, name: true, avatarColor: true } },
              },
            },
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          include: {
            payer: { select: { id: true, name: true, avatarColor: true } },
            receiver: { select: { id: true, name: true, avatarColor: true } },
          },
        },
        activityLogs: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            user: { select: { id: true, name: true, avatarColor: true } },
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ ok: false, error: "GROUP_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      group: {
        id: group.id,
        name: group.name,
        type: group.type,
        currency: group.currency,
        createdAt: group.createdAt.toISOString(),
        updatedAt: group.updatedAt.toISOString(),
        members: group.members.map((m) => m.user),
        expenses: group.expenses.map((e) => ({
          id: e.id,
          groupId: e.groupId,
          paidById: e.paidById,
          title: e.title,
          totalAmount: e.totalAmount,
          splitType: e.splitType,
          category: e.category,
          notes: e.notes,
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
        payments: group.payments.map((p) => ({
          id: p.id,
          groupId: p.groupId,
          payerId: p.payerId,
          receiverId: p.receiverId,
          amount: p.amount,
          notes: p.notes,
          createdAt: p.createdAt.toISOString(),
          payer: p.payer,
          receiver: p.receiver,
        })),
        activityLogs: group.activityLogs.map((l) => ({
          id: l.id,
          groupId: l.groupId,
          userId: l.userId,
          action: l.action,
          entityTitle: l.entityTitle,
          details: l.details,
          createdAt: l.createdAt.toISOString(),
          user: l.user,
        })),
      },
    });
  } catch (e) {
    console.error("[GET /api/groups/[id]]", e);
    return NextResponse.json({ ok: false, error: "FETCH_FAILED" }, { status: 500 });
  }
}

/** PUT /api/groups/[id]: update group name or type */
export async function PUT(req: Request, { params }: Params) {
  try {
    const { id } = params;
    const body = await req.json();
    const { name, type, currency, updatedById } = body;

    const group = await prisma.group.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(type ? { type } : {}),
        ...(currency ? { currency } : {}),
      },
    });

    if (updatedById) {
      await prisma.activityLog.create({
        data: {
          groupId: id,
          userId: updatedById,
          action: "GROUP_CREATED",
          entityTitle: group.name,
          details: `Updated group settings`,
        },
      });
    }

    return NextResponse.json({ ok: true, group });
  } catch (e) {
    console.error("[PUT /api/groups/[id]]", e);
    return NextResponse.json({ ok: false, error: "UPDATE_FAILED" }, { status: 500 });
  }
}

/** DELETE /api/groups/[id]: delete group */
export async function DELETE(req: Request, { params }: Params) {
  try {
    const { id } = params;
    await prisma.group.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/groups/[id]]", e);
    return NextResponse.json({ ok: false, error: "DELETE_FAILED" }, { status: 500 });
  }
}
