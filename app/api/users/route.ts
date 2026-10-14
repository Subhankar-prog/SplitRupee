import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** GET /api/users: fetch user details with optional userId filter */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const where: any = {};
    if (userId) {
      where.id = userId;
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        avatarColor: true,
        upiId: true,
        phone: true,
        isPro: true,
        _count: { select: { memberships: true } },
      },
    });
    return NextResponse.json({ ok: true, users });
  } catch (e) {
    console.error("[GET /api/users]", e);
    return NextResponse.json({ ok: false, error: "Failed to fetch users" }, { status: 500 });
  }
}

/** POST /api/users: create a new user (register) */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, avatarColor, upiId } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ ok: false, error: "Name is required" }, { status: 400 });
    }
    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ ok: false, error: "Valid email is required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return NextResponse.json({ ok: true, user: existing, message: "Logged in as existing user" });
    }

    const colors = ["#10b981", "#f43f5e", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        avatarColor: avatarColor || randomColor,
        upiId: (upiId || "").trim() || null,
      },
    });

    return NextResponse.json({ ok: true, user: newUser, created: true });
  } catch (e) {
    console.error("[POST /api/users]", e);
    return NextResponse.json({ ok: false, error: "Could not create user" }, { status: 500 });
  }
}

/** PATCH /api/users: update user UPI ID or profile */
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { userId, upiId } = body;

    if (!userId) {
      return NextResponse.json({ ok: false, error: "userId is required" }, { status: 400 });
    }

    const cleanUPI = (upiId || "").trim();
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { upiId: cleanUPI || null },
    });

    return NextResponse.json({ ok: true, user: updated });
  } catch (e: any) {
    console.error("[PATCH /api/users]", e);
    return NextResponse.json({ ok: false, error: e.message || "Failed to update user" }, { status: 500 });
  }
}
