import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * GET: Verifies if a reset token is valid and not expired
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ ok: false, error: "Reset token is missing" }, { status: 400 });
    }

    const users: any[] = await prisma.$queryRawUnsafe(
      `SELECT id, email, name FROM "User" WHERE "resetToken" = $1 AND "resetTokenExpiry" > NOW() LIMIT 1`,
      token
    );
    const user = users[0];

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "This password reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      email: user.email,
      name: user.name,
    });
  } catch (error: any) {
    console.error("Token verification error:", error);
    return NextResponse.json({ ok: false, error: "Failed to verify token" }, { status: 500 });
  }
}

/**
 * POST: Resets user's password and clears token
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, phone, newPassword } = body;

    if (!token && !phone) {
      return NextResponse.json({ ok: false, error: "Reset token or verified phone is required" }, { status: 400 });
    }

    if (!newPassword || newPassword.length < 4) {
      return NextResponse.json(
        { ok: false, error: "Password must be at least 4 characters long" },
        { status: 400 }
      );
    }

    // 1. Phone-verified reset
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, "").slice(-10);
      const users: any[] = await prisma.$queryRawUnsafe(
        `SELECT id FROM "User" WHERE phone = $1 LIMIT 1`,
        cleanPhone
      );
      const user = users[0];

      if (!user) {
        return NextResponse.json({ ok: false, error: "No account found with this phone number." }, { status: 404 });
      }

      await prisma.$executeRawUnsafe(
        `UPDATE "User" SET "passwordHash" = $1, "resetToken" = NULL, "resetTokenExpiry" = NULL WHERE "id" = $2`,
        hashPassword(newPassword.trim()),
        user.id
      );

      return NextResponse.json({
        ok: true,
        message: "Your password has been successfully updated! You can now log in.",
      });
    }

    // 2. Email token-verified reset
    const users: any[] = await prisma.$queryRawUnsafe(
      `SELECT id FROM "User" WHERE "resetToken" = $1 AND "resetTokenExpiry" > NOW() LIMIT 1`,
      token
    );
    const user = users[0];

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "This reset link is invalid or has expired. Please request a new one." },
        { status: 400 }
      );
    }

    await prisma.$executeRawUnsafe(
      `UPDATE "User" SET "passwordHash" = $1, "resetToken" = NULL, "resetTokenExpiry" = NULL WHERE "id" = $2`,
      hashPassword(newPassword.trim()),
      user.id
    );

    return NextResponse.json({
      ok: true,
      message: "Your password has been successfully updated! You can now log in.",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to reset password" },
      { status: 500 }
    );
  }
}
