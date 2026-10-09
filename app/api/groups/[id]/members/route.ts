import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface Params {
  params: { id: string };
}

/** POST /api/groups/[id]/members: add member to group by userId or email/name */
export async function POST(req: Request, { params }: Params) {
  try {
    const { id: groupId } = params;
    const body = await req.json();
    const { userId, email, name, addedById } = body;

    let targetUserId = userId;

    if (!targetUserId && email) {
      const cleanEmail = email.trim().toLowerCase();
      let user = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (!user) {
        const colors = ["#10b981", "#f43f5e", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ec4899"];
        user = await prisma.user.create({
          data: {
            name: (name || cleanEmail.split("@")[0]).trim(),
            email: cleanEmail,
            avatarColor: colors[Math.floor(Math.random() * colors.length)],
          },
        });
      }
      targetUserId = user.id;
    }

    if (!targetUserId) {
      return NextResponse.json({ ok: false, error: "User ID or Email is required" }, { status: 400 });
    }

    const existingMembership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId, userId: targetUserId },
      },
    });

    if (existingMembership) {
      return NextResponse.json({ ok: false, error: "User is already a member of this group" }, { status: 400 });
    }

    const membership = await prisma.groupMember.create({
      data: { groupId, userId: targetUserId },
      include: {
        user: { select: { id: true, name: true, email: true, avatarColor: true } },
      },
    });

    // Write to Activity Log
    if (addedById) {
      await prisma.activityLog.create({
        data: {
          groupId,
          userId: addedById,
          action: "MEMBER_ADDED",
          entityTitle: membership.user.name,
          details: `Added ${membership.user.name} to the group`,
        },
      });
    }

    return NextResponse.json({ ok: true, member: membership.user });
  } catch (e) {
    console.error("[POST /api/groups/[id]/members]", e);
    return NextResponse.json({ ok: false, error: "FAILED_TO_ADD_MEMBER" }, { status: 500 });
  }
}

/** DELETE /api/groups/[id]/members: remove member from group */
export async function DELETE(req: Request, { params }: Params) {
  try {
    const { id: groupId } = params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const removedById = searchParams.get("removedById");

    if (!userId) {
      return NextResponse.json({ ok: false, error: "userId query param required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    await prisma.groupMember.delete({
      where: {
        groupId_userId: { groupId, userId },
      },
    });

    if (removedById && user) {
      await prisma.activityLog.create({
        data: {
          groupId,
          userId: removedById,
          action: "MEMBER_REMOVED",
          entityTitle: user.name,
          details: `Removed ${user.name} from the group`,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/groups/[id]/members]", e);
    return NextResponse.json({ ok: false, error: "FAILED_TO_REMOVE_MEMBER" }, { status: 500 });
  }
}
