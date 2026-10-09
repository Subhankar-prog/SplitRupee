import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** POST /api/groups/join: join group by inviteCode */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { inviteCode, userId } = body;

    if (!inviteCode || !userId) {
      return NextResponse.json({ ok: false, error: "inviteCode and userId are required" }, { status: 400 });
    }

    const group = await prisma.group.findFirst({
      where: {
        OR: [{ inviteCode }, { id: inviteCode }],
      },
      include: {
        members: { include: { user: true } },
      },
    });

    if (!group) {
      return NextResponse.json({ ok: false, error: "Invalid invite link or group not found" }, { status: 404 });
    }

    const isAlreadyMember = group.members.some((m) => m.userId === userId);
    if (isAlreadyMember) {
      return NextResponse.json({ ok: true, group, alreadyMember: true });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    await prisma.groupMember.create({
      data: { groupId: group.id, userId },
    });

    // Write Activity Log
    await prisma.activityLog.create({
      data: {
        groupId: group.id,
        userId,
        action: "MEMBER_ADDED",
        entityTitle: user.name,
        details: `${user.name} joined the group via invite link`,
      },
    });

    return NextResponse.json({ ok: true, group, joined: true });
  } catch (e) {
    console.error("[POST /api/groups/join]", e);
    return NextResponse.json({ ok: false, error: "JOIN_FAILED" }, { status: 500 });
  }
}
