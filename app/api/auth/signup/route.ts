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
    const { name, email, phone, password, authMethod, avatarColor } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ ok: false, error: "Full Name is required" }, { status: 400 });
    }

    let userEmail = (email || "").trim().toLowerCase();
    let userPhone = (phone || "").trim();

    if (authMethod === "phone") {
      if (!userPhone || userPhone.length < 10) {
        return NextResponse.json({ ok: false, error: "Valid 10-digit mobile number is required" }, { status: 400 });
      }
      if (!userEmail) {
        userEmail = `${userPhone.slice(-10)}@splitrupee.in`;
      }
    } else if (authMethod === "email") {
      if (!userEmail || !userEmail.includes("@")) {
        return NextResponse.json({ ok: false, error: "Valid email address is required" }, { status: 400 });
      }
      if (!password || password.length < 4) {
        return NextResponse.json({ ok: false, error: "Password must be at least 4 characters long" }, { status: 400 });
      }
    } else if (authMethod === "google") {
      if (!userEmail) {
        userEmail = `${name.toLowerCase().replace(/\s+/g, ".")}@gmail.com`;
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
        upiId: `${name.toLowerCase().replace(/[^a-z0-9]/g, "")}@upi`,
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
