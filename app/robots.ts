import type { MetadataRoute } from "next";

const BASE_URL = "https://splitrupee.vercel.app";

/**
 * SplitRupee Robots.txt Configuration
 * Instructs search engine crawlers (Googlebot, Bingbot, etc.) to index public marketing,
 * tool, and guide content while disallowing private user data, API endpoints, and authentication flows.
 */
export default function robots(): MetadataRoute.Robots {
  const allowedPublicPaths = [
    "/",
    "/about",
    "/calculator",
    "/itinerary",
    "/pro",
    "/faq",
    "/contact",
    "/blog",
    "/blog/",
    "/privacy",
    "/terms",
  ];

  const disallowedPrivatePaths = [
    "/api/",
    "/dashboard",
    "/dashboard/",
    "/groups",
    "/groups/",
    "/expenses",
    "/expenses/",
    "/activity",
    "/activity/",
    "/profile",
    "/profile/",
    "/join/",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/offline",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: allowedPublicPaths,
        disallow: disallowedPrivatePaths,
      },
      {
        userAgent: "Googlebot",
        allow: allowedPublicPaths,
        disallow: disallowedPrivatePaths,
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
