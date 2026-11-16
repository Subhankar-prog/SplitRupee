import { describe, it, expect, vi } from "vitest";

vi.mock("next/font/local", () => ({
  default: () => ({
    variable: "--font-mock",
    className: "font-mock",
  }),
}));

import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { metadata as rootMetadata } from "@/app/layout";
import { metadata as dashboardMetadata } from "@/app/dashboard/layout";
import { metadata as groupsMetadata } from "@/app/groups/layout";
import { metadata as expensesMetadata } from "@/app/expenses/layout";
import { metadata as activityMetadata } from "@/app/activity/layout";
import { metadata as profileMetadata } from "@/app/profile/layout";
import { metadata as joinMetadata } from "@/app/join/layout";
import { metadata as loginMetadata } from "@/app/login/layout";
import { metadata as signupMetadata } from "@/app/signup/layout";
import { metadata as forgotPasswordMetadata } from "@/app/forgot-password/layout";
import { metadata as resetPasswordMetadata } from "@/app/reset-password/layout";
import { metadata as offlineMetadata } from "@/app/offline/layout";
import { metadata as aboutMetadata } from "@/app/about/page";
import { metadata as calculatorMetadata } from "@/app/calculator/layout";
import { metadata as itineraryMetadata } from "@/app/itinerary/layout";
import { metadata as proMetadata } from "@/app/pro/layout";
import { metadata as faqMetadata } from "@/app/faq/layout";
import { metadata as contactMetadata } from "@/app/contact/layout";
import { metadata as blogMetadata } from "@/app/blog/page";
import { metadata as privacyMetadata } from "@/app/privacy/page";
import { metadata as termsMetadata } from "@/app/terms/page";
import { generateMetadata as generateBlogArticleMetadata } from "@/app/blog/[slug]/page";

describe("Technical SEO & Google Indexing Infrastructure", () => {
  describe("XML Sitemap (app/sitemap.ts)", () => {
    it("generates canonical sitemap with all public pages", () => {
      const items = sitemap();
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThanOrEqual(13);

      const urls = items.map((i) => i.url);

      // Core public marketing and tool URLs
      expect(urls).toContain("https://splitrupee.vercel.app/");
      expect(urls).toContain("https://splitrupee.vercel.app/calculator");
      expect(urls).toContain("https://splitrupee.vercel.app/itinerary");
      expect(urls).toContain("https://splitrupee.vercel.app/pro");
      expect(urls).toContain("https://splitrupee.vercel.app/blog");
      expect(urls).toContain("https://splitrupee.vercel.app/faq");
      expect(urls).toContain("https://splitrupee.vercel.app/about");
      expect(urls).toContain("https://splitrupee.vercel.app/contact");
      expect(urls).toContain("https://splitrupee.vercel.app/privacy");
      expect(urls).toContain("https://splitrupee.vercel.app/terms");

      // Blog article URLs
      expect(urls).toContain("https://splitrupee.vercel.app/blog/how-to-split-goa-trip-expenses");
      expect(urls).toContain("https://splitrupee.vercel.app/blog/flatmate-rent-and-groceries-guide");
      expect(urls).toContain("https://splitrupee.vercel.app/blog/upi-deep-linking-explained");
    });

    it("strictly excludes private, authenticated, API, and internal routes", () => {
      const items = sitemap();
      const urls = items.map((i) => i.url);

      for (const url of urls) {
        expect(url).not.toMatch(/\/dashboard(\/|$)/);
        expect(url).not.toMatch(/\/groups(\/|$)/);
        expect(url).not.toMatch(/\/expenses(\/|$)/);
        expect(url).not.toMatch(/\/activity(\/|$)/);
        expect(url).not.toMatch(/\/profile(\/|$)/);
        expect(url).not.toMatch(/\/api(\/|$)/);
        expect(url).not.toMatch(/\/login(\/|$)/);
        expect(url).not.toMatch(/\/signup(\/|$)/);
        expect(url).not.toMatch(/\/forgot-password(\/|$)/);
        expect(url).not.toMatch(/\/reset-password(\/|$)/);
        expect(url).not.toMatch(/\/join(\/|$)/);
        expect(url).not.toMatch(/\/offline(\/|$)/);
      }
    });

    it("provides valid changeFrequency and priority numbers", () => {
      const items = sitemap();
      for (const item of items) {
        expect(item.url.startsWith("https://splitrupee.vercel.app")).toBe(true);
        expect(item.priority).toBeGreaterThanOrEqual(0);
        expect(item.priority).toBeLessThanOrEqual(1.0);
        expect(["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"]).toContain(
          item.changeFrequency
        );
      }
    });
  });

  describe("Robots.txt (app/robots.ts)", () => {
    it("configures crawl rules and points to canonical sitemap", () => {
      const rob = robots();
      expect(rob.sitemap).toBe("https://splitrupee.vercel.app/sitemap.xml");

      const rules = Array.isArray(rob.rules) ? rob.rules : [rob.rules];
      expect(rules.length).toBeGreaterThanOrEqual(1);

      const wildcardRule = rules.find((r) => r.userAgent === "*" || r.userAgent?.includes("*"));
      expect(wildcardRule).toBeDefined();

      const disallowed = Array.isArray(wildcardRule?.disallow)
        ? wildcardRule?.disallow
        : [wildcardRule?.disallow];

      expect(disallowed).toContain("/api/");
      expect(disallowed).toContain("/dashboard");
      expect(disallowed).toContain("/groups");
      expect(disallowed).toContain("/expenses");
      expect(disallowed).toContain("/activity");
      expect(disallowed).toContain("/profile");
      expect(disallowed).toContain("/login");
      expect(disallowed).toContain("/signup");
    });
  });

  describe("Root Layout Metadata & Google Search Console Verification", () => {
    it("configures suggested branding, metadataBase, canonical, OpenGraph, and Twitter", () => {
      expect(rootMetadata.metadataBase?.toString()).toBe("https://splitrupee.vercel.app/");

      const titleObj = rootMetadata.title as any;
      expect(titleObj?.default).toBe("SplitRupee — Split Expenses, Manage Group Bills & Plan Trips");
      expect(titleObj?.template).toBe("%s | SplitRupee");

      expect(rootMetadata.description).toBe(
        "Split expenses with friends, track shared bills, manage group settlements and plan trips with SplitRupee."
      );

      const og = rootMetadata.openGraph as any;
      expect(og?.url).toBe("https://splitrupee.vercel.app");
      expect(og?.siteName).toBe("SplitRupee");

      const twitter = rootMetadata.twitter as any;
      expect(twitter?.card).toBe("summary_large_image");

      const rob = rootMetadata.robots as any;
      expect(rob?.index).toBe(true);
      expect(rob?.follow).toBe(true);
    });

    it("supports Google Search Console verification securely via environment without fake tokens", () => {
      const ver = rootMetadata.verification as any;
      // When env var is not set, it should be undefined (never a fabricated string)
      if (!process.env.GOOGLE_SITE_VERIFICATION) {
        expect(ver?.google).toBeUndefined();
      } else {
        expect(typeof ver?.google).toBe("string");
      }
    });
  });

  describe("Search Engine Indexing Safeguards on Private Pages", () => {
    const privateLayouts = [
      { name: "dashboard", meta: dashboardMetadata },
      { name: "groups", meta: groupsMetadata },
      { name: "expenses", meta: expensesMetadata },
      { name: "activity", meta: activityMetadata },
      { name: "profile", meta: profileMetadata },
      { name: "join", meta: joinMetadata },
      { name: "login", meta: loginMetadata },
      { name: "signup", meta: signupMetadata },
      { name: "forgot-password", meta: forgotPasswordMetadata },
      { name: "reset-password", meta: resetPasswordMetadata },
      { name: "offline", meta: offlineMetadata },
    ];

    it.each(privateLayouts)("strictly applies noindex to $name route", ({ meta }) => {
      const rob = meta.robots as any;
      expect(rob?.index).toBe(false);
      expect(rob?.follow).toBe(false);
      expect(rob?.googleBot?.index).toBe(false);
      expect(rob?.googleBot?.follow).toBe(false);
    });
  });

  describe("Public Page Metadata & Canonical Links", () => {
    const publicPages = [
      { name: "about", meta: aboutMetadata, path: "/about" },
      { name: "calculator", meta: calculatorMetadata, path: "/calculator" },
      { name: "itinerary", meta: itineraryMetadata, path: "/itinerary" },
      { name: "pro", meta: proMetadata, path: "/pro" },
      { name: "faq", meta: faqMetadata, path: "/faq" },
      { name: "contact", meta: contactMetadata, path: "/contact" },
      { name: "blog", meta: blogMetadata, path: "/blog" },
      { name: "privacy", meta: privacyMetadata, path: "/privacy" },
      { name: "terms", meta: termsMetadata, path: "/terms" },
    ];

    it.each(publicPages)("has title, description, and canonical for $name", ({ meta, path }) => {
      expect(meta.title).toBeDefined();
      expect(meta.description).toBeDefined();
      expect((meta.alternates as any)?.canonical).toBe(path);
      // Ensure no accidental noindex on public pages
      expect((meta.robots as any)?.index).not.toBe(false);
    });

    it("generates article metadata with canonical for dynamic blog guides", () => {
      const meta = generateBlogArticleMetadata({
        params: { slug: "how-to-split-goa-trip-expenses" },
      });
      expect(meta.title).toBe("How to Split Goa Trip Expenses Fairly with 8 Friends");
      expect((meta.alternates as any)?.canonical).toBe(
        "/blog/how-to-split-goa-trip-expenses"
      );
    });
  });
});
