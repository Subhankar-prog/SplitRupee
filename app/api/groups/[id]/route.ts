import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Params {
  params: { id: string };
}

/** GET /api/groups/[id]: get full group data (members, expenses, payments, activityLogs) */
export async function GET(req: Request, { params }: Params) {
  try {
    const rawId = params?.id;
    const id = typeof rawId === "string" ? decodeURIComponent(rawId).trim() : "";

    if (!id) {
      return NextResponse.json({ ok: false, error: "INVALID_GROUP_ID" }, { status: 400 });
    }

    const group = await prisma.group.findFirst({
      where: {
        OR: [{ id }, { inviteCode: id }],
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarColor: true, upiId: true } },
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

    const creatorId =
      group.activityLogs.find((l) => l.action === "GROUP_CREATED")?.userId ||
      group.members[0]?.userId ||
      null;

    const hasAnyAdmin = group.members.some((m) => m.role === "ADMIN");

    return NextResponse.json({
      ok: true,
      group: {
        id: group.id,
        name: group.name,
        description: group.description || null,
        type: group.type,
        currency: group.currency,
        inviteCode: group.inviteCode || group.id.slice(0, 8),
        creatorId,
        createdAt: group.createdAt ? new Date(group.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: group.updatedAt ? new Date(group.updatedAt).toISOString() : new Date().toISOString(),
        members: group.members.map((m) => {
          const isExplicitAdmin = m.role === "ADMIN";
          const isFallbackAdmin = !hasAnyAdmin && m.userId === creatorId;
          return {
            ...m.user,
            role: (isExplicitAdmin || isFallbackAdmin) ? ("ADMIN" as const) : ("MEMBER" as const),
          };
        }),
        expenses: group.expenses.map((e) => ({
          id: e.id,
          groupId: e.groupId,
          paidById: e.paidById,
          title: e.title,
          totalAmount: e.totalAmount,
          originalAmount: e.originalAmount,
          currency: e.currency,
          exchangeRate: e.exchangeRate,
          receiptUrl: e.receiptUrl,
          isDeleted: e.isDeleted,
          splitType: e.splitType,
          category: e.category,
          notes: e.notes,
          date: e.date ? new Date(e.date).toISOString() : new Date().toISOString(),
          createdAt: e.createdAt ? new Date(e.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: e.updatedAt ? new Date(e.updatedAt).toISOString() : new Date().toISOString(),
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
          createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
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
          createdAt: l.createdAt ? new Date(l.createdAt).toISOString() : new Date().toISOString(),
          user: l.user,
        })),
      },
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (e) {
    console.error("[GET /api/groups/[id]]", e);
    return NextResponse.json({ ok: false, error: "FETCH_FAILED" }, {
      status: 500,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  }
}

/** PUT /api/groups/[id]: update group name, description, type, currency */
export async function PUT(req: Request, { params }: Params) {
  try {
    const rawId = params?.id;
    const id = typeof rawId === "string" ? decodeURIComponent(rawId).trim() : "";
    const body = await req.json();
    const { name, description, type, currency, updatedById } = body;

    const groupCheck = await prisma.group.findFirst({
      where: {
        OR: [{ id }, { inviteCode: id }],
      },
      include: {
        members: { orderBy: { joinedAt: "asc" } },
        activityLogs: { where: { action: "GROUP_CREATED" }, take: 1 },
      },
    });

    if (!groupCheck) {
      return NextResponse.json({ ok: false, error: "GROUP_NOT_FOUND" }, { status: 404 });
    }

    // Verify caller is admin if updatedById is provided
    if (updatedById) {
      const caller = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: groupCheck.id, userId: updatedById } },
      });
      const creatorId = groupCheck?.activityLogs[0]?.userId || groupCheck?.members[0]?.userId;
      const hasAnyAdmin = groupCheck?.members.some((m) => m.role === "ADMIN");
      const isFallbackAdmin = !hasAnyAdmin && caller?.userId === creatorId;
      const isAdmin = caller?.role === "ADMIN" || caller?.userId === creatorId || isFallbackAdmin;
      if (!isAdmin) {
        return NextResponse.json(
          { ok: false, error: "FORBIDDEN", message: "Only group admins can modify group settings." },
          { status: 403 }
        );
      }
    }

    const group = await prisma.group.update({
      where: { id: groupCheck.id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description: description ? description.trim() : null } : {}),
        ...(type ? { type } : {}),
        ...(currency ? { currency } : {}),
      },
    });

    if (updatedById) {
      await prisma.activityLog.create({
        data: {
          groupId: groupCheck.id,
          userId: updatedById,
          action: "GROUP_CREATED",
          entityTitle: group.name,
          details: `Updated group settings (name, description, or category)`,
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
    const rawId = params?.id;
    const id = typeof rawId === "string" ? decodeURIComponent(rawId).trim() : "";
    const { searchParams } = new URL(req.url);
    const deletedById = searchParams.get("deletedById");

    const groupCheck = await prisma.group.findFirst({
      where: {
        OR: [{ id }, { inviteCode: id }],
      },
      include: { activityLogs: { where: { action: "GROUP_CREATED" }, take: 1 } },
    });

    if (!groupCheck) {
      return NextResponse.json({ ok: false, error: "GROUP_NOT_FOUND" }, { status: 404 });
    }

    // Verify caller is admin if deletedById is provided
    if (deletedById) {
      const caller = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: groupCheck.id, userId: deletedById } },
      });
      const creatorId = groupCheck?.activityLogs[0]?.userId;
      const isAdmin = caller?.role === "ADMIN" || caller?.userId === creatorId;
      if (!isAdmin) {
        return NextResponse.json(
          { ok: false, error: "FORBIDDEN", message: "Only group admins can delete this group." },
          { status: 403 }
        );
      }
    }

    await prisma.group.delete({ where: { id: groupCheck.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/groups/[id]]", e);
    return NextResponse.json({ ok: false, error: "DELETE_FAILED" }, { status: 500 });
  }
}
