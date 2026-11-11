import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

/**
 * GET /api/realtime/stream
 *
 * - `?mode=version&userId=...`: Lightweight change-detection check returning the latest
 *   timestamp fingerprint across the user's groups, expenses, payments, and activity logs.
 *   Completes immediately instead of holding a 300s Vercel serverless function open.
 * - Legacy bare SSE callers (no `mode=version`): Returns an immediate non-hanging SSE frame
 *   and closes cleanly so stale tabs never trigger 300s Vercel runtime timeouts.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode");
  const userId = searchParams.get("userId")?.trim();

  if (mode === "version") {
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "userId is required" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    try {
      const [memberCount, latestGroup, latestExpense, latestPayment, latestActivity] =
        await Promise.all([
          prisma.groupMember.count({ where: { userId } }),
          prisma.group.findFirst({
            where: { members: { some: { userId } } },
            orderBy: { updatedAt: "desc" },
            select: { id: true, updatedAt: true },
          }),
          prisma.expense.findFirst({
            where: { group: { members: { some: { userId } } } },
            orderBy: { updatedAt: "desc" },
            select: { id: true, updatedAt: true },
          }),
          prisma.payment.findFirst({
            where: { group: { members: { some: { userId } } } },
            orderBy: { createdAt: "desc" },
            select: { id: true, createdAt: true },
          }),
          prisma.activityLog.findFirst({
            where: { group: { members: { some: { userId } } } },
            orderBy: { createdAt: "desc" },
            select: { id: true, createdAt: true },
          }),
        ]);

      const version = [
        memberCount,
        latestGroup?.id ?? "",
        latestGroup?.updatedAt ? new Date(latestGroup.updatedAt).getTime() : 0,
        latestExpense?.id ?? "",
        latestExpense?.updatedAt ? new Date(latestExpense.updatedAt).getTime() : 0,
        latestPayment?.id ?? "",
        latestPayment?.createdAt ? new Date(latestPayment.createdAt).getTime() : 0,
        latestActivity?.id ?? "",
        latestActivity?.createdAt ? new Date(latestActivity.createdAt).getTime() : 0,
      ].join(":");

      return NextResponse.json(
        { ok: true, version },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        }
      );
    } catch (err) {
      console.warn("[GET /api/realtime/stream] version check failed:", err);
      return NextResponse.json(
        { ok: false, version: null },
        { status: 200, headers: { "Cache-Control": "no-store" } }
      );
    }
  }

  return new Response('retry: 30000\ndata: {"type":"CONNECTED"}\n\n', {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-cache, no-transform",
    },
  });
}
