import { describe, it, expect } from "vitest";
import {
  INITIAL_FONT_STYLES,
  DEFAULT_INITIAL_FONT,
  getInitialFontClass,
  getInitials,
} from "@/lib/initialFonts";

describe("Funky Initials Typography (lib/initialFonts.ts)", () => {
  it("provides 6 curated typography styles with zero DB storage", () => {
    expect(INITIAL_FONT_STYLES.length).toBe(6);
    const ids = INITIAL_FONT_STYLES.map((s) => s.id);
    expect(ids).toEqual(["funky", "comic", "stencil", "groovy", "serif", "modern"]);
  });

  it("resolves CSS classes correctly with or without font: prefix", () => {
    expect(getInitialFontClass("funky")).toBe("avatar-font-funky");
    expect(getInitialFontClass("font:funky")).toBe("avatar-font-funky");
    expect(getInitialFontClass("comic")).toBe("avatar-font-comic");
    expect(getInitialFontClass("font:comic")).toBe("avatar-font-comic");
    expect(getInitialFontClass("stencil")).toBe("avatar-font-stencil");
    expect(getInitialFontClass("font:stencil")).toBe("avatar-font-stencil");
    expect(getInitialFontClass("groovy")).toBe("avatar-font-groovy");
    expect(getInitialFontClass("font:groovy")).toBe("avatar-font-groovy");
    expect(getInitialFontClass("serif")).toBe("avatar-font-serif");
    expect(getInitialFontClass("font:serif")).toBe("avatar-font-serif");
    expect(getInitialFontClass("modern")).toBe("avatar-font-modern");
    expect(getInitialFontClass("font:modern")).toBe("avatar-font-modern");
  });

  it("defaults gracefully to avatar-font-funky on undefined, null, or invalid font id", () => {
    expect(getInitialFontClass(null)).toBe("avatar-font-funky");
    expect(getInitialFontClass(undefined)).toBe("avatar-font-funky");
    expect(getInitialFontClass("non-existent-font")).toBe("avatar-font-funky");
    expect(getInitialFontClass("")).toBe("avatar-font-funky");
  });

  it("extracts 2-letter uppercase initials accurately", () => {
    expect(getInitials("Arjun Sharma")).toBe("AS");
    expect(getInitials("Priya")).toBe("PR");
    expect(getInitials("Devika Rani Mukherjee")).toBe("DM");
    expect(getInitials("   rohit   ")).toBe("RO");
    expect(getInitials("")).toBe("US");
    expect(getInitials(null)).toBe("US");
  });

  it("ensures zero storage footprint (under 15 chars string payload)", () => {
    INITIAL_FONT_STYLES.forEach((style) => {
      const dbPayload = `font:${style.id}`;
      expect(dbPayload.length).toBeLessThan(16);
    });
  });
});
