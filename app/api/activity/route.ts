import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** GET /api/activity: fetch chronological audit log / activity feed */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const where: any = {};
    if (groupId) {
      where.groupId = groupId;
    } else if (userId) {
      // Find groups where this user is a member
      where.group = {
        members: {
          some: { userId },
        },
      };
    }

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: { select: { id: true, name: true, avatarColor: true } },
        group: { select: { id: true, name: true, type: true } },
      },
    });

    return NextResponse.json({
      ok: true,
      activities: logs.map((l) => ({
        id: l.id,
        groupId: l.groupId,
        userId: l.userId,
        action: l.action,
        entityTitle: l.entityTitle,
        details: l.details,
        createdAt: l.createdAt.toISOString(),
        user: l.user,
        group: l.group,
      })),
    });
  } catch (e) {
    console.error("[GET /api/activity]", e);
    return NextResponse.json({ ok: false, error: "FETCH_ACTIVITIES_FAILED" }, { status: 500 });
  }
}
