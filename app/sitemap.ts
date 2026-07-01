import type { MetadataRoute } from "next";
import { COMPARISON_SLUGS } from "@/lib/marketing/comparisons";

const SITE_URL = "https://pointsy.kids";

/** The public, indexable pages. Authenticated app routes are intentionally
 * excluded (see robots.ts). */
export default function sitemap(): MetadataRoute.Sitemap {
  const core = [
    "",
    "/about",
    "/sign-up",
    "/sign-in",
    "/join",
    "/privacy",
    "/terms",
  ];
  const marketing = [
    "/compare",
    "/tools/reward-calculator",
    "/tools/allowance-calculator",
    "/guides/age-appropriate-chores",
    "/guides/token-economy-for-kids",
    ...COMPARISON_SLUGS.map((slug) => `/compare/${slug}`),
  ];

  return [...core, ...marketing].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority:
      path === ""
        ? 1
        : path.startsWith("/compare") || path.startsWith("/tools")
          ? 0.7
          : 0.6,
  }));
}
