import type { MetadataRoute } from "next";
import { BLOG_GUIDES } from "@/lib/blogGuides";

const BASE_URL = "https://splitrupee.vercel.app";

/**
 * SplitRupee Canonical Dynamic XML Sitemap
 * Serves only genuinely public, indexable marketing, guide, and tool pages.
 * Strictly excludes private authenticated routes (/dashboard, /groups, /expenses, /activity, /profile, /api/*, auth).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date();

  const staticPublicRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/calculator`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/itinerary`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/pro`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: currentDate,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: currentDate,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const blogArticleRoutes: MetadataRoute.Sitemap = BLOG_GUIDES.map((guide) => ({
    url: `${BASE_URL}/blog/${guide.slug}`,
    lastModified: currentDate,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticPublicRoutes, ...blogArticleRoutes];
}
