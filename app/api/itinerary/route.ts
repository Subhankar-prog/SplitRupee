import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/itinerary
 * Retrieves saved itineraries filtered by userId or groupId
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const groupId = searchParams.get("groupId");
    const id = searchParams.get("id");

    if (id) {
      const single = await prisma.itinerary.findUnique({
        where: { id },
        include: {
          group: {
            select: { id: true, name: true, type: true, members: { include: { user: true } } }
          },
          user: {
            select: { id: true, name: true, email: true, avatarColor: true }
          }
        }
      });
      if (!single) {
        return NextResponse.json({ ok: false, error: "Itinerary not found" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, itinerary: single });
    }

    const where: any = {};
    if (groupId) {
      where.groupId = groupId;
    } else if (userId) {
      where.userId = userId;
    }

    const itineraries = await prisma.itinerary.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        group: {
          select: { id: true, name: true, type: true }
        },
        user: {
          select: { id: true, name: true, email: true, avatarColor: true }
        }
      }
    });

    return NextResponse.json({
      ok: true,
      itineraries: itineraries.map((it) => {
        let parsedPlan: any = null;
        try {
          parsedPlan = typeof it.planData === "string" ? JSON.parse(it.planData) : it.planData;
        } catch {
          parsedPlan = null;
        }
        return {
          id: it.id,
          userId: it.userId,
          groupId: it.groupId,
          title: it.title,
          origin: it.origin,
          destination: it.destination,
          startDate: it.startDate.toISOString().split("T")[0],
          endDate: it.endDate.toISOString().split("T")[0],
          days: it.days,
          groupSize: it.groupSize,
          totalBudget: it.totalBudget,
          group: it.group,
          user: it.user,
          createdAt: it.createdAt.toISOString(),
          updatedAt: it.updatedAt.toISOString(),
          planData: parsedPlan,
          chatSession: parsedPlan?.chatSession || []
        };
      })
    });
  } catch (err: any) {
    console.error("[GET /api/itinerary]", err);
    return NextResponse.json({ ok: false, error: err.message || "Failed to load itineraries" }, { status: 500 });
  }
}

/**
 * POST /api/itinerary
 * Saves an itinerary and its Copilot chat session.
 * Supports forwarding to a Travel Group (ADMIN ONLY).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      userId,
      title,
      origin,
      destination,
      startDate,
      endDate,
      days = 1,
      groupSize = 1,
      totalBudget = 0,
      preferences = {},
      planData,
      chatSession = [],
      forwardToGroupId
    } = body;

    if (!origin || !destination) {
      return NextResponse.json({ ok: false, error: "Origin and Destination are required" }, { status: 400 });
    }

    if (!planData) {
      return NextResponse.json({ ok: false, error: "Plan data is required" }, { status: 400 });
    }

    let targetGroupId: string | null = forwardToGroupId || body.groupId || null;

    // ADMIN PERMISSION CHECK IF FORWARDING TO A GROUP
    if (forwardToGroupId) {
      if (!userId) {
        return NextResponse.json(
          { ok: false, error: "ADMIN_ONLY", message: "You must be signed in to forward to a group." },
          { status: 401 }
        );
      }

      const membership = await prisma.groupMember.findFirst({
        where: { groupId: forwardToGroupId, userId }
      });

      if (!membership) {
        return NextResponse.json(
          { ok: false, error: "NOT_A_MEMBER", message: "You are not a member of this group." },
          { status: 403 }
        );
      }

      // Check if user is an ADMIN or creator
      const isExplicitAdmin = membership.role === "ADMIN";
      let isCreator = false;

      if (!isExplicitAdmin) {
        const creatorLog = await prisma.activityLog.findFirst({
          where: { groupId: forwardToGroupId, action: "GROUP_CREATED", userId }
        });
        isCreator = !!creatorLog;
      }

      if (!isExplicitAdmin && !isCreator) {
        return NextResponse.json(
          {
            ok: false,
            error: "ADMIN_ONLY",
            message: "Admin-Only Privilege: Only group admins can forward itineraries and sync calendar schedules to this travel group."
          },
          { status: 403 }
        );
      }

      targetGroupId = forwardToGroupId;
    }

    // Embed chatSession inside planData so it persists seamlessly
    const completePlanData = {
      ...(typeof planData === "object" ? planData : {}),
      chatSession: Array.isArray(chatSession) ? chatSession : []
    };

    const sDate = startDate ? new Date(startDate) : new Date();
    const eDate = endDate ? new Date(endDate) : new Date(Date.now() + days * 86400000);
    const tripTitle = title || `Trip: ${origin} to ${destination} (${days} Days)`;

    let saved;

    if (id) {
      // Update existing
      saved = await prisma.itinerary.update({
        where: { id },
        data: {
          title: tripTitle,
          origin,
          destination,
          startDate: sDate,
          endDate: eDate,
          days: Number(days) || 1,
          groupSize: Number(groupSize) || 1,
          totalBudget: Number(totalBudget) || 0,
          preferences: typeof preferences === "string" ? preferences : JSON.stringify(preferences),
          planData: JSON.stringify(completePlanData),
          userId: userId || null,
          groupId: targetGroupId
        }
      });
    } else {
      // Create new
      saved = await prisma.itinerary.create({
        data: {
          title: tripTitle,
          origin,
          destination,
          startDate: sDate,
          endDate: eDate,
          days: Number(days) || 1,
          groupSize: Number(groupSize) || 1,
          totalBudget: Number(totalBudget) || 0,
          preferences: typeof preferences === "string" ? preferences : JSON.stringify(preferences),
          planData: JSON.stringify(completePlanData),
          userId: userId || null,
          groupId: targetGroupId
        }
      });
    }

    // If forwarded to group, log activity in group
    if (forwardToGroupId && userId) {
      try {
        await prisma.activityLog.create({
          data: {
            groupId: forwardToGroupId,
            userId,
            action: "EXPENSE_CREATED",
            entityTitle: `Travel Itinerary Forwarded: ${origin} ➜ ${destination}`,
            details: `Admin forwarded trip itinerary (${days} Days) with verified transit, stays, and Copilot travel guide notes.`
          }
        });
      } catch (logErr) {
        console.warn("Could not log activity in group:", logErr);
      }
    }

    return NextResponse.json({
      ok: true,
      itinerary: {
        id: saved.id,
        title: saved.title,
        groupId: saved.groupId,
        updatedAt: saved.updatedAt.toISOString(),
        message: forwardToGroupId
          ? "Itinerary and Copilot chat successfully forwarded to your travel group!"
          : "Itinerary and chat session saved successfully!"
      }
    });
  } catch (err: any) {
    console.error("[POST /api/itinerary]", err);
    return NextResponse.json({ ok: false, error: err.message || "Failed to save itinerary" }, { status: 500 });
  }
}

/**
 * DELETE /api/itinerary
 * Removes a saved itinerary
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!id) {
      return NextResponse.json({ ok: false, error: "Itinerary ID is required" }, { status: 400 });
    }

    const item = await prisma.itinerary.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ ok: false, error: "Itinerary not found" }, { status: 404 });
    }

    if (userId && item.userId && item.userId !== userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 403 });
    }

    await prisma.itinerary.delete({ where: { id } });
    return NextResponse.json({ ok: true, message: "Itinerary deleted successfully" });
  } catch (err: any) {
    console.error("[DELETE /api/itinerary]", err);
    return NextResponse.json({ ok: false, error: err.message || "Failed to delete itinerary" }, { status: 500 });
  }
}
