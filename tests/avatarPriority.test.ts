import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Avatar Priority & Google Profile Picture Integration", () => {
  interface TestUser {
    id: string;
    name: string;
    email: string;
    avatarColor: string;
    avatarUrl: string | null;
    googleAvatarUrl: string | null;
    customAvatarUrl: string | null;
    googleId: string | null;
  }

  function resolveEffectiveAvatar(user: Partial<TestUser>): {
    avatarUrl: string | null;
    source: "custom" | "google" | "initials";
  } {
    // 1. User-uploaded custom avatar (Priority 1)
    if (user.customAvatarUrl && user.customAvatarUrl.trim()) {
      return { avatarUrl: user.customAvatarUrl, source: "custom" };
    }
    // 2. Google profile picture (Priority 2)
    if (user.googleAvatarUrl && user.googleAvatarUrl.trim()) {
      return { avatarUrl: user.googleAvatarUrl, source: "google" };
    }
    // 3. Fallback to initials (Priority 3)
    return { avatarUrl: null, source: "initials" };
  }

  function handleGoogleLoginSync(
    user: TestUser,
    googleProfile: { picture?: string; sub: string }
  ): TestUser {
    const newGooglePic = googleProfile.picture || null;
    const hasCustomAvatar = Boolean(user.customAvatarUrl);

    return {
      ...user,
      googleId: user.googleId || googleProfile.sub,
      googleAvatarUrl: newGooglePic,
      // CRITICAL: NEVER overwrite customAvatarUrl or avatarUrl if custom exists!
      avatarUrl: hasCustomAvatar ? user.customAvatarUrl : newGooglePic,
    };
  }

  function removeCustomAvatar(user: TestUser): TestUser {
    return {
      ...user,
      customAvatarUrl: null,
      // Gracefully fall back to Google picture if available, otherwise null
      avatarUrl: user.googleAvatarUrl || null,
    };
  }

  it("Priority 1: custom avatar overrides Google avatar", () => {
    const user: TestUser = {
      id: "u1",
      name: "Rohan Varma",
      email: "rohan@gmail.com",
      avatarColor: "#10b981",
      avatarUrl: "https://custom.cdn.com/my-pic.png",
      customAvatarUrl: "https://custom.cdn.com/my-pic.png",
      googleAvatarUrl: "https://lh3.googleusercontent.com/a/google-pic",
      googleId: "sub-12345",
    };

    const resolved = resolveEffectiveAvatar(user);
    expect(resolved.source).toBe("custom");
    expect(resolved.avatarUrl).toBe("https://custom.cdn.com/my-pic.png");
  });

  it("Priority 2: Google profile picture is used when no custom avatar is set", () => {
    const user: TestUser = {
      id: "u2",
      name: "Aarav Sharma",
      email: "aarav@gmail.com",
      avatarColor: "#0ea5e9",
      avatarUrl: "https://lh3.googleusercontent.com/a/google-pic",
      customAvatarUrl: null,
      googleAvatarUrl: "https://lh3.googleusercontent.com/a/google-pic",
      googleId: "sub-67890",
    };

    const resolved = resolveEffectiveAvatar(user);
    expect(resolved.source).toBe("google");
    expect(resolved.avatarUrl).toBe("https://lh3.googleusercontent.com/a/google-pic");
  });

  it("Priority 3: Initials fallback is used when neither custom nor Google avatar exists", () => {
    const user: TestUser = {
      id: "u3",
      name: "Diya Patel",
      email: "diya@example.com",
      avatarColor: "#f59e0b",
      avatarUrl: null,
      customAvatarUrl: null,
      googleAvatarUrl: null,
      googleId: null,
    };

    const resolved = resolveEffectiveAvatar(user);
    expect(resolved.source).toBe("initials");
    expect(resolved.avatarUrl).toBeNull();
  });

  it("Google login NEVER overwrites an existing custom avatar", () => {
    const existingUserWithCustom: TestUser = {
      id: "u4",
      name: "Karan Singh",
      email: "karan@gmail.com",
      avatarColor: "#8b5cf6",
      avatarUrl: "https://custom.cdn.com/karan-photo.png",
      customAvatarUrl: "https://custom.cdn.com/karan-photo.png",
      googleAvatarUrl: null,
      googleId: "sub-9999",
    };

    const synced = handleGoogleLoginSync(existingUserWithCustom, {
      sub: "sub-9999",
      picture: "https://lh3.googleusercontent.com/a/brand-new-google-pic",
    });

    // Custom avatar is untouched and remains the active avatar
    expect(synced.customAvatarUrl).toBe("https://custom.cdn.com/karan-photo.png");
    expect(synced.avatarUrl).toBe("https://custom.cdn.com/karan-photo.png");
    // Google avatar is cached in googleAvatarUrl
    expect(synced.googleAvatarUrl).toBe("https://lh3.googleusercontent.com/a/brand-new-google-pic");
  });

  it("Removing custom avatar restores Google avatar if previously signed in with Google", () => {
    const user: TestUser = {
      id: "u5",
      name: "Meera Nair",
      email: "meera@gmail.com",
      avatarColor: "#ec4899",
      avatarUrl: "https://custom.cdn.com/meera-photo.png",
      customAvatarUrl: "https://custom.cdn.com/meera-photo.png",
      googleAvatarUrl: "https://lh3.googleusercontent.com/a/meera-google",
      googleId: "sub-5555",
    };

    const restored = removeCustomAvatar(user);
    expect(restored.customAvatarUrl).toBeNull();
    expect(restored.avatarUrl).toBe("https://lh3.googleusercontent.com/a/meera-google");
  });

  it("Removing custom avatar falls back to initials if user has no Google avatar", () => {
    const user: TestUser = {
      id: "u6",
      name: "Vikram Das",
      email: "vikram@example.com",
      avatarColor: "#14b8a6",
      avatarUrl: "https://custom.cdn.com/vikram-photo.png",
      customAvatarUrl: "https://custom.cdn.com/vikram-photo.png",
      googleAvatarUrl: null,
      googleId: null,
    };

    const restored = removeCustomAvatar(user);
    expect(restored.customAvatarUrl).toBeNull();
    expect(restored.avatarUrl).toBeNull();
  });

  it("Existing users without picture receive picture on next successful Google authentication", () => {
    const oldGoogleUser: TestUser = {
      id: "u7",
      name: "Pooja Hegde",
      email: "pooja@gmail.com",
      avatarColor: "#3b82f6",
      avatarUrl: null,
      customAvatarUrl: null,
      googleAvatarUrl: null,
      googleId: null,
    };

    const updated = handleGoogleLoginSync(oldGoogleUser, {
      sub: "sub-7777",
      picture: "https://lh3.googleusercontent.com/a/pooja-photo",
    });

    expect(updated.googleId).toBe("sub-7777");
    expect(updated.googleAvatarUrl).toBe("https://lh3.googleusercontent.com/a/pooja-photo");
    expect(updated.avatarUrl).toBe("https://lh3.googleusercontent.com/a/pooja-photo");
  });

  it("Google account without a picture gracefully keeps initials fallback", () => {
    const userWithoutPic: TestUser = {
      id: "u8",
      name: "Amitabh Sen",
      email: "amitabh@gmail.com",
      avatarColor: "#10b981",
      avatarUrl: null,
      customAvatarUrl: null,
      googleAvatarUrl: null,
      googleId: null,
    };

    const updated = handleGoogleLoginSync(userWithoutPic, {
      sub: "sub-8888",
      // No picture claim
    });

    expect(updated.googleId).toBe("sub-8888");
    expect(updated.googleAvatarUrl).toBeNull();
    expect(updated.avatarUrl).toBeNull();
  });
});

