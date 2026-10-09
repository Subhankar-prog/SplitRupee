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
    const { identifier, password, authMethod, googleUser } = body;

    // 1. Google OAuth 1-Click Login
    if (authMethod === "google") {
      let email = googleUser?.email || "";
      let name = googleUser?.name || "";

      if (!email && !name) {
        // Find or create default first user for testing Google 1-Click
        const firstUser = await prisma.user.findFirst({
          select: { id: true, name: true, email: true, phone: true, avatarColor: true, upiId: true, createdAt: true },
        });
        if (firstUser) {
          return NextResponse.json({ ok: true, user: firstUser });
        }
        email = "aarav.google@gmail.com";
        name = "Aarav Sharma";
      }

      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: email.toLowerCase() },
            { name: { equals: name, mode: "insensitive" } },
          ],
        },
        select: { id: true, name: true, email: true, phone: true, avatarColor: true, upiId: true, createdAt: true },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            name: name || "Google User",
            email: email.toLowerCase() || `user.${Date.now()}@gmail.com`,
            avatarColor: "#10b981",
            upiId: `${(name || "user").toLowerCase().replace(/[^a-z0-9]/g, "")}@upi`,
          },
          select: { id: true, name: true, email: true, phone: true, avatarColor: true, upiId: true, createdAt: true },
        });
      }

      return NextResponse.json({ ok: true, user });
    }

    // 2. Username / Email / Phone + Password Login
    const cleanId = (identifier || "").trim();
    if (!cleanId) {
      return NextResponse.json({ ok: false, error: "Please enter your Email, Phone number, or Username" }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ ok: false, error: "Please enter your password" }, { status: 400 });
    }

    // Find matching user by email, phone, or name
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: cleanId, mode: "insensitive" } },
          { phone: cleanId },
          { name: { equals: cleanId, mode: "insensitive" } },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "No account found with this username, email or phone. Please sign up first." },
        { status: 404 }
      );
    }

    // Verify password if user has passwordHash set
    if (user.passwordHash) {
      const hashed = hashPassword(password);
      if (user.passwordHash !== hashed) {
        return NextResponse.json({ ok: false, error: "Incorrect password. Please try again or reset password." }, { status: 401 });
      }
    }

    const { passwordHash: _, ...safeUser } = user;
    return NextResponse.json({ ok: true, user: safeUser });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ ok: false, error: error.message || "Login failed" }, { status: 500 });
  }
}
