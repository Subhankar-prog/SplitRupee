import { describe, it, expect } from "vitest";
import { PRESET_AVATARS, isPresetAvatar } from "@/lib/presetAvatars";

describe("Preset Avatars (lib/presetAvatars.ts)", () => {
  it("defines at least 12 curated preset avatars", () => {
    expect(PRESET_AVATARS.length).toBeGreaterThanOrEqual(12);
  });

  it("assigns valid url paths and non-empty metadata to all presets", () => {
    for (const avatar of PRESET_AVATARS) {
      expect(avatar.id).toBeTruthy();
      expect(avatar.name).toBeTruthy();
      expect(avatar.url).toMatch(/^\/avatars\/avatar-\d+\.svg$/);
      expect(["animal", "nature", "fintech", "celestial"]).toContain(avatar.category);
    }
  });

  it("correctly identifies valid preset avatar URLs and rejects foreign URLs", () => {
    expect(isPresetAvatar("/avatars/avatar-1.svg")).toBe(true);
    expect(isPresetAvatar("/avatars/avatar-7.svg")).toBe(true);
    expect(isPresetAvatar("/avatars/avatar-12.svg")).toBe(true);
    expect(isPresetAvatar("https://lh3.googleusercontent.com/a/random")).toBe(false);
    expect(isPresetAvatar("data:image/png;base64,abc123")).toBe(false);
    expect(isPresetAvatar(null)).toBe(false);
    expect(isPresetAvatar(undefined)).toBe(false);
    expect(isPresetAvatar("")).toBe(false);
  });
});
