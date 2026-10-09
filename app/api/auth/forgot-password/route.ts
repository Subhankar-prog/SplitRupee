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
    const { identifier, newPassword, otp } = body;

    const cleanId = (identifier || "").trim();
    if (!cleanId) {
      return NextResponse.json({ ok: false, error: "Email or phone number is required" }, { status: 400 });
    }

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
      return NextResponse.json({ ok: false, error: "No account found with this email/phone" }, { status: 404 });
    }

    // If newPassword provided, reset it
    if (newPassword) {
      if (newPassword.length < 4) {
        return NextResponse.json({ ok: false, error: "Password must be at least 4 characters" }, { status: 400 });
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashPassword(newPassword) },
      });
      return NextResponse.json({
        ok: true,
        message: "Password has been successfully updated! You can now log in.",
      });
    }

    // Otherwise send reset OTP / link simulation
    const channel = user.phone && user.phone === cleanId ? "WhatsApp / SMS" : "Email";
    return NextResponse.json({
      ok: true,
      channel,
      message: `Password reset link and OTP code sent to your registered ${channel} (${cleanId}).`,
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ ok: false, error: error.message || "Failed to process request" }, { status: 500 });
  }
}
