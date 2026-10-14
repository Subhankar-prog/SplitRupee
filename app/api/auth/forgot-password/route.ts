import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { identifier } = body;

    const cleanId = (identifier || "").trim().toLowerCase();
    if (!cleanId) {
      return NextResponse.json(
        { ok: false, error: "Please enter your registered email address or mobile number." },
        { status: 400 }
      );
    }

    // 1. Locate user by email or phone
    const cleanPhone = cleanId.replace(/\D/g, "").slice(-10);
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: cleanId, mode: "insensitive" } },
          ...(cleanPhone.length === 10 ? [{ phone: cleanPhone }] : []),
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "No account found matching this email or mobile number." },
        { status: 404 }
      );
    }

    // 2. Generate cryptographically secure token & 15-minute expiry
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // 3. Determine base URL (works in local development and production)
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const origin = req.headers.get("origin") || `${protocol}://${host}`;
    const resetUrl = `${origin}/reset-password?token=${resetToken}`;

    // 4. Send Magic Reset Email via Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "SplitRupee <onboarding@resend.dev>",
            to: user.email,
            subject: "Reset your SplitRupee password",
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1329; color: #f8fafc; margin: 0; padding: 24px; }
                  .container { max-width: 520px; margin: 0 auto; background: #0f172a; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 20px; padding: 36px 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
                  .brand { display: flex; align-items: center; gap: 8px; margin-bottom: 24px; }
                  .badge { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #10b981, #14b8a6); color: #020617; font-weight: bold; font-size: 18px; text-align: center; line-height: 36px; }
                  .brand-name { font-size: 18px; font-weight: bold; color: #ffffff; letter-spacing: -0.5px; }
                  h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 12px; }
                  p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 20px; }
                  .button-container { text-align: center; margin: 28px 0; }
                  .button { display: inline-block; background: linear-gradient(135deg, #10b981, #14b8a6); color: #020617 !important; font-weight: bold; font-size: 14px; padding: 14px 32px; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35); }
                  .link-alt { font-size: 12px; color: #64748b; word-break: break-all; margin-top: 20px; }
                  .footer { font-size: 11px; color: #475569; text-align: center; margin-top: 32px; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 16px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="brand">
                    <div class="badge">₹</div>
                    <span class="brand-name">SplitRupee</span>
                  </div>
                  <h1>Password Reset Request</h1>
                  <p>Hi ${user.name},</p>
                  <p>We received a request to reset the password for your SplitRupee account. Click the button below to choose a new password:</p>
                  <div class="button-container">
                    <a href="${resetUrl}" class="button" target="_blank">Reset My Password</a>
                  </div>
                  <p style="font-size: 12.5px; color: #cbd5e1;">⚠️ This link is valid for <strong>15 minutes</strong> and can only be used once.</p>
                  <p style="font-size: 12px; color: #64748b;">If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
                  <div class="link-alt">
                    Button not working? Copy and paste this link in your browser:<br>
                    <a href="${resetUrl}" style="color: #10b981;">${resetUrl}</a>
                  </div>
                  <div class="footer">
                    © ${new Date().getFullYear()} SplitRupee · India's Smart Group Expense Manager
                  </div>
                </div>
              </body>
              </html>
            `,
          }),
        });

        const resendData = await resendRes.json();
        if (!resendRes.ok) {
          console.error("Resend API error:", resendData);
        }
      } catch (emailErr) {
        console.error("Failed to send email via Resend:", emailErr);
      }
    }

    // Return masked email so user knows where to check
    const emailParts = user.email.split("@");
    const maskedEmail =
      emailParts[0].slice(0, 2) + "***@" + emailParts[1];

    return NextResponse.json({
      ok: true,
      email: maskedEmail,
      message: `A secure password reset link has been sent to ${maskedEmail}.`,
    });
  } catch (error: any) {
    console.error("Forgot password request error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to process password reset request." },
      { status: 500 }
    );
  }
}
