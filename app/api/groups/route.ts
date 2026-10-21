import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** GET /api/groups: list groups (optionally filtered by userId) */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    const where = userId ? { members: { some: { userId } } } : {};

    const groups = await prisma.group.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarColor: true, upiId: true },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        _count: {
          select: {
            expenses: true,
            members: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        ok: true,
        groups: groups.map((g) => ({
          id: g.id,
          name: g.name,
          description: g.description || null,
          type: g.type,
          currency: g.currency,
          inviteCode: g.inviteCode || g.id.slice(0, 8),
          createdAt: g.createdAt.toISOString(),
          updatedAt: g.updatedAt.toISOString(),
          members: g.members.map((m) => m.user),
          _count: g._count,
        })),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (e) {
    console.error("[GET /api/groups]", e);
    return NextResponse.json(
      { ok: false, error: "FETCH_FAILED", issues: ["Could not load groups"] },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}

/** POST /api/groups: create a new group */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, type = "OTHER", currency = "INR", memberUserIds = [], createdById } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ ok: false, error: "Group name is required" }, { status: 400 });
    }

    const uniqueMemberIds = Array.from(new Set([createdById, ...memberUserIds].filter(Boolean)));

    if (uniqueMemberIds.length === 0) {
      return NextResponse.json({ ok: false, error: "At least one member is required" }, { status: 400 });
    }

    const cleanName = name.trim();
    let generatedInviteCode = cleanName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6);
    if (!generatedInviteCode || generatedInviteCode.length < 3) {
      generatedInviteCode = "group";
    }
    generatedInviteCode += Math.floor(1000 + Math.random() * 9000);

    const group = await prisma.group.create({
      data: {
        name: cleanName,
        description: description?.trim() || null,
        type: ["TRIP", "HOME", "COUPLE", "OTHER"].includes(type) ? type : "OTHER",
        currency,
        inviteCode: generatedInviteCode,
        members: {
          create: uniqueMemberIds.map((uid) => ({
            userId: uid,
            role: uid === createdById ? "ADMIN" : "MEMBER",
          })),
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarColor: true, upiId: true } },
          },
        },
      },
    });

    // Write to Activity Log
    if (createdById) {
      await prisma.activityLog.create({
        data: {
          groupId: group.id,
          userId: createdById,
          action: "GROUP_CREATED",
          entityTitle: group.name,
          details: `Created group "${group.name}" with ${group.members.length} members`,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      group: {
        id: group.id,
        name: group.name,
        type: group.type,
        currency: group.currency,
        inviteCode: group.inviteCode,
        createdAt: group.createdAt.toISOString(),
        updatedAt: group.updatedAt.toISOString(),
        members: group.members.map((m) => m.user),
      },
    });
  } catch (e) {
    console.error("[POST /api/groups]", e);
    return NextResponse.json({ ok: false, error: "CREATE_FAILED" }, { status: 500 });
  }
}
