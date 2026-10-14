import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { accessToken, idToken, googleUser } = body;

    let email = "";
    let name = "";
    let avatarUrl = "";

    // 1. Verify via Google Access Token (Userinfo endpoint)
    if (accessToken) {
      const googleRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!googleRes.ok) {
        return NextResponse.json(
          { ok: false, error: "Invalid or expired Google access token" },
          { status: 401 }
        );
      }

      const profile = await googleRes.json();
      email = profile.email || "";
      name = profile.name || profile.given_name || "";
      avatarUrl = profile.picture || "";
    } else if (idToken) {
      // 2. Verify via Google ID Token (Tokeninfo endpoint)
      const tokenRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
      if (!tokenRes.ok) {
        return NextResponse.json(
          { ok: false, error: "Invalid Google ID token" },
          { status: 401 }
        );
      }
      const tokenInfo = await tokenRes.json();
      email = tokenInfo.email || "";
      name = tokenInfo.name || "";
      avatarUrl = tokenInfo.picture || "";
    } else if (googleUser && googleUser.email) {
      // 3. Fallback for demo mode
      email = googleUser.email;
      name = googleUser.name || "Google User";
    }

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Unable to retrieve verified email from Google" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists in database with this verified Google email
    const user = await prisma.user.findFirst({
      where: {
        email: cleanEmail,
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

    // If returning user: direct login!
    if (user) {
      return NextResponse.json({
        ok: true,
        isNewUser: false,
        user,
        avatarUrl,
      });
    }

    // If first-time Google user:
    // Do NOT auto-create user with dummy UPI.
    // Instead return isNewUser: true with profile details so they can confirm/edit Name and enter their real UPI ID in Signup.
    return NextResponse.json({
      ok: true,
      isNewUser: true,
      googleProfile: {
        email: cleanEmail,
        name: name.trim() || cleanEmail.split("@")[0],
        avatarUrl,
      },
    });
  } catch (error: any) {
    console.error("Google Auth API error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to authenticate with Google" },
      { status: 500 }
    );
  }
}
