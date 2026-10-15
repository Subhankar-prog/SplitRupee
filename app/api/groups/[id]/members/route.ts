import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface Params {
  params: { id: string };
}

/** POST /api/groups/[id]/members: add member to group by userId, email, or phone number */
export async function POST(req: Request, { params }: Params) {
  try {
    const { id: groupId } = params;
    const body = await req.json();
    const { userId, email, phone, name, addedById } = body;

    let targetUserId = userId;

    if (!targetUserId && (email || phone)) {
      const cleanEmail = email ? email.trim().toLowerCase() : null;
      const cleanPhone = phone ? phone.trim().replace(/\D/g, "").slice(-10) : null;

      // 1. Search for existing registered or placeholder user by email OR phone
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            ...(cleanEmail ? [{ email: cleanEmail }] : []),
            ...(cleanPhone ? [{ phone: cleanPhone }] : []),
          ],
        },
      });

      // 2. If user already exists, update their phone if previously missing
      if (user) {
        if (cleanPhone && !user.phone) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { phone: cleanPhone },
          });
        }
      } else {
        // 3. User does not exist yet: create a placeholder account
        // When they later sign up using this email or mobile, they can claim the account & their groups auto-fetch!
        const fallbackEmail =
          cleanEmail ||
          (cleanPhone ? `${cleanPhone}@splitrupee.in` : `user.${Date.now()}@splitrupee.in`);
        const colors = ["#10b981", "#f43f5e", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#3b82f6"];
        const chosenColor = colors[Math.floor(Math.random() * colors.length)];

        user = await prisma.user.create({
          data: {
            name: (name || (cleanEmail ? cleanEmail.split("@")[0] : `Member ${cleanPhone}`)).trim(),
            email: fallbackEmail,
            phone: cleanPhone || null,
            avatarColor: chosenColor,
            passwordHash: null, // Invited placeholder until sign up
          },
        });
      }
      targetUserId = user.id;
    }

    if (!targetUserId) {
      return NextResponse.json({ ok: false, error: "User ID, Email, or Phone number is required" }, { status: 400 });
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

/** PATCH /api/groups/[id]/members: promote or demote a member (make admin / remove admin) */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id: groupId } = params;
    const body = await req.json();
    const { targetUserId, role, performedById } = body;

    if (!targetUserId || !role) {
      return NextResponse.json({ ok: false, error: "targetUserId and role are required" }, { status: 400 });
    }

    // Verify caller is admin
    if (performedById) {
      const caller = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId: performedById } },
      });
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: { activityLogs: { where: { action: "GROUP_CREATED" }, take: 1 } },
      });
      const creatorId = group?.activityLogs[0]?.userId;
      const isCallerAdmin = caller?.role === "ADMIN" || caller?.userId === creatorId;
      if (!isCallerAdmin) {
        return NextResponse.json(
          { ok: false, error: "FORBIDDEN", message: "Only group admins can manage member roles." },
          { status: 403 }
        );
      }
    }

    const updated = await prisma.groupMember.update({
      where: { groupId_userId: { groupId, userId: targetUserId } },
      data: { role: role === "ADMIN" ? "ADMIN" : "MEMBER" },
      include: { user: true },
    });

    if (performedById) {
      await prisma.activityLog.create({
        data: {
          groupId,
          userId: performedById,
          action: "GROUP_CREATED",
          entityTitle: updated.user.name,
          details: role === "ADMIN" ? `Promoted ${updated.user.name} to Group Admin` : `Changed ${updated.user.name}'s role to Member`,
        },
      });
    }

    return NextResponse.json({ ok: true, member: updated });
  } catch (e) {
    console.error("[PATCH /api/groups/[id]/members]", e);
    return NextResponse.json({ ok: false, error: "FAILED_TO_UPDATE_ROLE" }, { status: 500 });
  }
}

/** DELETE /api/groups/[id]/members: remove member from group or handle exit with random admin promotion */
export async function DELETE(req: Request, { params }: Params) {
  try {
    const { id: groupId } = params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const removedById = searchParams.get("removedById");
    const isExit = !removedById || removedById === userId;

    if (!userId) {
      return NextResponse.json({ ok: false, error: "userId query param required" }, { status: 400 });
    }

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
      include: { user: true },
    });

    if (!membership) {
      return NextResponse.json({ ok: false, error: "Membership not found" }, { status: 404 });
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: { include: { user: true } },
        activityLogs: { where: { action: "GROUP_CREATED" }, take: 1 },
      },
    });

    if (!group) {
      return NextResponse.json({ ok: false, error: "Group not found" }, { status: 404 });
    }

    const creatorId = group.activityLogs[0]?.userId;
    const isExitingAdmin = membership.role === "ADMIN" || membership.userId === creatorId;
    const remainingMembers = group.members.filter((m) => m.userId !== userId);

    let newlyPromotedAdmin: any = null;

    // If the exiting / removed member was an Admin:
    if (isExitingAdmin && remainingMembers.length > 0) {
      // Check if any other remaining member is already an Admin
      const hasOtherAdmin = remainingMembers.some((m) => m.role === "ADMIN");
      if (!hasOtherAdmin) {
        // Randomly appoint one of the remaining members as the new Admin!
        const randomIndex = Math.floor(Math.random() * remainingMembers.length);
        const luckyMember = remainingMembers[randomIndex];

        await prisma.groupMember.update({
          where: { id: luckyMember.id },
          data: { role: "ADMIN" },
        });

        newlyPromotedAdmin = luckyMember.user;
      }
    }

    // Delete membership
    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId } },
    });

    // Write Activity Log
    const actionDetails = isExit
      ? `${membership.user.name} left the group${
          newlyPromotedAdmin ? `. ${newlyPromotedAdmin.name} was appointed as the new Group Admin.` : ""
        }`
      : `Removed ${membership.user.name} from the group${
          newlyPromotedAdmin ? `. ${newlyPromotedAdmin.name} was appointed as the new Group Admin.` : ""
        }`;

    await prisma.activityLog.create({
      data: {
        groupId,
        userId: removedById || userId,
        action: "MEMBER_REMOVED",
        entityTitle: membership.user.name,
        details: actionDetails,
      },
    });

    return NextResponse.json({
      ok: true,
      message: actionDetails,
      newAdmin: newlyPromotedAdmin,
      remainingCount: remainingMembers.length,
    });
  } catch (e) {
    console.error("[DELETE /api/groups/[id]/members]", e);
    return NextResponse.json({ ok: false, error: "FAILED_TO_REMOVE_MEMBER" }, { status: 500 });
  }
}
