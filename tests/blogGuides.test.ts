import { describe, it, expect } from "vitest";
import { BLOG_GUIDES, getBlogGuideBySlug } from "@/lib/blogGuides";
import { getShellMode } from "@/lib/routeShell";

describe("Blog guides & public routing (F-05)", () => {
  it("resolves all three guide slugs cleanly and returns null for unknown slugs", () => {
    expect(BLOG_GUIDES).toHaveLength(3);
    for (const guide of BLOG_GUIDES) {
      const resolved = getBlogGuideBySlug(guide.slug);
      expect(resolved).not.toBeNull();
      expect(resolved?.title).toBe(guide.title);
      expect(resolved?.sections.length).toBeGreaterThanOrEqual(3);
    }
    expect(getBlogGuideBySlug("non-existent-guide")).toBeNull();
  });

  it("keeps /blog and /blog/[slug] routes in the public shell mode", () => {
    expect(getShellMode("/blog", false)).toBe("public");
    expect(getShellMode("/blog/how-to-split-goa-trip-expenses", false)).toBe("public");
    expect(getShellMode("/blog/upi-deep-linking-explained", true)).toBe("public");
  });
});

