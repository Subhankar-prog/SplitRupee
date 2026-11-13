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
    let googleId: string | null = null;

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
      googleId = profile.sub || null;
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
      googleId = tokenInfo.sub || null;
    } else if (googleUser && googleUser.email) {
      // 3. Fallback for demo mode
      email = googleUser.email;
      name = googleUser.name || "Google User";
      avatarUrl = googleUser.avatarUrl || "";
      googleId = googleUser.googleId || null;
    }

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Unable to retrieve verified email from Google" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Look up user:
    // First by verified Google ID (sub) if available, then by verified email address
    let existingUser = googleId
      ? await prisma.user.findFirst({
          where: { OR: [{ googleId }, { email: cleanEmail }] },
        })
      : await prisma.user.findFirst({
          where: { email: cleanEmail },
        });

    // If returning user: direct login!
    if (existingUser) {
      // Preserve Avatar Priority:
      // 1. User-uploaded custom avatar (must NEVER be overwritten by Google login)
      // 2. Google profile picture
      // 3. Initials fallback
      const hasCustomAvatar = Boolean(existingUser.customAvatarUrl);
      const effectiveAvatar = hasCustomAvatar
        ? existingUser.customAvatarUrl
        : (avatarUrl || existingUser.avatarUrl || null);

      // Prepare updates if Google ID or Google Avatar is new/updated
      const updateData: any = {};
      if (googleId && existingUser.googleId !== googleId) {
        updateData.googleId = googleId;
      }
      if (avatarUrl && existingUser.googleAvatarUrl !== avatarUrl) {
        updateData.googleAvatarUrl = avatarUrl;
      }
      // Only update avatarUrl if user has no custom avatar
      if (!hasCustomAvatar && avatarUrl && existingUser.avatarUrl !== avatarUrl) {
        updateData.avatarUrl = avatarUrl;
      }

      let updatedUser = existingUser;
      if (Object.keys(updateData).length > 0) {
        updatedUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: updateData,
        });
      }

      return NextResponse.json({
        ok: true,
        isNewUser: false,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          avatarColor: updatedUser.avatarColor,
          avatarUrl: effectiveAvatar,
          googleAvatarUrl: updatedUser.googleAvatarUrl,
          customAvatarUrl: updatedUser.customAvatarUrl,
          googleId: updatedUser.googleId,
          upiId: updatedUser.upiId,
          isPro: updatedUser.isPro,
          createdAt: updatedUser.createdAt,
        },
        avatarUrl: effectiveAvatar,
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
        googleAvatarUrl: avatarUrl,
        googleId,
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
