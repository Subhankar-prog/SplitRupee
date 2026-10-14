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

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

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
    const { token, newPassword } = body;

    if (!token) {
      return NextResponse.json({ ok: false, error: "Reset token is required" }, { status: 400 });
    }

    if (!newPassword || newPassword.length < 4) {
      return NextResponse.json(
        { ok: false, error: "Password must be at least 4 characters long" },
        { status: 400 }
      );
    }

    // Verify token exists and has not expired
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "This reset link is invalid or has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Update password hash and revoke reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashPassword(newPassword.trim()),
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

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
