import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, password, authMethod, avatarColor, upiId } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ ok: false, error: "Full Name is required" }, { status: 400 });
    }

    let userEmail = (email || "").trim().toLowerCase();
    let userPhone = (phone || "").trim();

    if (authMethod === "phone") {
      if (!userPhone || userPhone.length < 10) {
        return NextResponse.json({ ok: false, error: "Valid 10-digit mobile number is required." }, { status: 400 });
      }
      if (!userEmail) {
        userEmail = `${userPhone.slice(-10)}@splitrupee.in`;
      }
    } else if (authMethod === "email") {
      if (!userEmail || !userEmail.includes("@")) {
        return NextResponse.json({ ok: false, error: "Valid email address is required." }, { status: 400 });
      }
    } else if (authMethod === "google") {
      if (!userEmail || !userEmail.includes("@")) {
        return NextResponse.json({ ok: false, error: "Valid Google email address is required." }, { status: 400 });
      }
    }

    if (authMethod !== "google") {
      if (!password || password.length < 4) {
        return NextResponse.json({ ok: false, error: "Password must be at least 4 characters long." }, { status: 400 });
      }
    }

    // Check if user already exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: userEmail },
          ...(userPhone ? [{ phone: userPhone }] : []),
        ],
      },
    });

    if (existing) {
      // If the user was previously added to groups as an invited placeholder (passwordHash is null),
      // allow them to claim and activate their account so all their groups automatically load!
      if (!existing.passwordHash) {
        const passwordHash = password ? hashPassword(password) : null;
        const colors = ["#10b981", "#f43f5e", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#3b82f6"];
        const chosenColor = avatarColor || existing.avatarColor || colors[Math.floor(Math.random() * colors.length)];

        const user = await prisma.user.update({
          where: { id: existing.id },
          data: {
            name: name.trim() || existing.name,
            email: userEmail || existing.email,
            phone: userPhone || existing.phone,
            passwordHash,
            avatarColor: chosenColor,
            upiId: (upiId || "").trim() || existing.upiId,
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarColor: true,
            upiId: true,
            createdAt: true,
          },
        });

        return NextResponse.json({ ok: true, user, claimed: true });
      }

      return NextResponse.json(
        { ok: false, error: "An account with this email or phone number already exists. Please log in." },
        { status: 409 }
      );
    }

    const passwordHash = password ? hashPassword(password) : null;
    const colors = ["#10b981", "#f43f5e", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#3b82f6"];
    const chosenColor = avatarColor || colors[Math.floor(Math.random() * colors.length)];

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: userEmail,
        phone: userPhone || null,
        passwordHash,
        avatarColor: chosenColor,
        upiId: (upiId || "").trim() || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarColor: true,
        upiId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ ok: true, user });
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json({ ok: false, error: error.message || "Signup failed" }, { status: 500 });
  }
}
